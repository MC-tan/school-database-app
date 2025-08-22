'use client'

import { useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { validateNationalId, validatePhoneNumber, formatAge } from '../../lib/dateUtils'

export default function AddStudent() {
  const router = useRouter()

  // === State หลัก ===
  const [formData, setFormData] = useState({
    // พื้นฐาน (บังคับบางช่องเท่านั้น)
    national_id: '',
    student_id: '',           // ไม่บังคับ
    title: 'เด็กชาย',        // ไม่บังคับ
    first_name: '',
    last_name: '',
    birth_date: '',           // ไม่บังคับ
    address: '',              // ไม่บังคับ
    grade: 4,
    section: '',              // ไม่บังคับ

    // ผู้ปกครอง (ไม่บังคับ)
    father_first_name: '',
    father_last_name: '',
    father_national_id: '',
    father_birth_date: '',
    father_address: '',
    father_phone: '',

    mother_first_name: '',
    mother_last_name: '',
    mother_national_id: '',
    mother_birth_date: '',
    mother_address: '',
    mother_phone: '',

    // เก็บ URL รูปหลังอัปโหลด
    photo_url: ''
  })

  // อัปโหลดรูป
  const [photoFile, setPhotoFile] = useState(null)
  const photoPreview = useMemo(() => photoFile ? URL.createObjectURL(photoFile) : null, [photoFile])

  // พี่น้อง
  const [siblings, setSiblings] = useState([])
  const [newSibling, setNewSibling] = useState({
    national_id: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    education_level: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [currentTab, setCurrentTab] = useState('basic') // basic, father, mother, siblings

  // === handlers ===
  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }))
  }

  const handleSelectPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // กันไฟล์ใหญ่เกิน ~5MB (ปรับได้)
    if (file.size > 5 * 1024 * 1024) {
      alert('ไฟล์รูปขนาดเกิน 5MB')
      e.target.value = ''
      return
    }
    setPhotoFile(file)
  }

  const addSibling = () => {
    if (!newSibling.national_id || !newSibling.first_name || !newSibling.last_name || !newSibling.birth_date) {
      alert('กรุณากรอกข้อมูลพี่น้องให้ครบถ้วน')
      return
    }
    const nationalIdCheck = validateNationalId(newSibling.national_id)
    if (!nationalIdCheck.isValid) {
      alert(nationalIdCheck.message)
      return
    }
    if (siblings.some(s => s.national_id === newSibling.national_id)) {
      alert('เลขบัตรประชาชนของพี่น้องซ้ำกัน')
      return
    }
    setSiblings([...siblings, { ...newSibling, id: Date.now() }])
    setNewSibling({ national_id: '', first_name: '', last_name: '', birth_date: '', education_level: '' })
  }

  const removeSibling = (id) => {
    setSiblings(siblings.filter(s => s.id !== id))
  }

  // helper: แปลงค่าว่างเป็น null (กัน constraint NOT NULL/unique ผิดพลาด)
  const emptyToNull = (obj) => {
    const out = {}
    for (const [k, v] of Object.entries(obj)) {
      out[k] = (v === '' || v === undefined) ? null : v
    }
    return out
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // (1) บังคับเฉพาะ 4 ช่อง: เลขบัตร, ชื่อ, สกุล, ชั้นเรียน
      if (!formData.national_id || !formData.first_name || !formData.last_name || !formData.grade) {
        throw new Error('กรุณากรอก เลขบัตรประชาชน, ชื่อ, นามสกุล และชั้นเรียน')
      }

      // ตรวจเลขบัตรประชาชนเฉพาะของนักเรียน
      const nationalIdCheck = validateNationalId(formData.national_id)
      if (!nationalIdCheck.isValid) {
        throw new Error(nationalIdCheck.message)
      }

      // (2) ช่องอื่นๆ ไม่บังคับ — ถ้ากรอกเบอร์ จะตรวจรูปแบบให้
      if (formData.father_phone) {
        const phoneCheck = validatePhoneNumber(formData.father_phone)
        if (!phoneCheck.isValid) throw new Error('เบอร์โทรบิดา: ' + phoneCheck.message)
      }
      if (formData.mother_phone) {
        const phoneCheck = validatePhoneNumber(formData.mother_phone)
        if (!phoneCheck.isValid) throw new Error('เบอร์โทรมารดา: ' + phoneCheck.message)
      }

      // ตรวจข้อมูลซ้ำเฉพาะ national_id (student_id ไม่บังคับ/ไม่ตรวจซ้ำแล้ว)
      const { data: existingByNid } = await supabase
        .from('students')
        .select('national_id')
        .eq('national_id', formData.national_id)
        .maybeSingle()

      if (existingByNid) {
        throw new Error('เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว')
      }

      // (3) อัปโหลดรูป (ถ้ามีไฟล์)
      let photoUrl = null
      if (photoFile) {
        // ต้องมี bucket ชื่อ 'students' และตั้ง public read (หรือใช้ getPublicUrl)
        const fileExt = photoFile.name.split('.').pop()
        const fileName = `${formData.national_id || Date.now()}.${fileExt}`
        const filePath = `photos/${fileName}`

        const { error: upErr } = await supabase.storage.from('students').upload(filePath, photoFile, {
          cacheControl: '3600',
          upsert: true
        })
        if (upErr) throw upErr

        const { data: pub } = supabase.storage.from('students').getPublicUrl(filePath)
        photoUrl = pub?.publicUrl || null
      }

      // เตรียม payload (แปลง '' -> null) และใส่ photo_url ถ้ามี
      const payload = emptyToNull({ ...formData, photo_url: photoUrl || formData.photo_url || null })

      // บันทึกข้อมูลนักเรียน
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert([payload])
        .select()
        .single()
      if (studentError) throw studentError

      // บันทึกข้อมูลพี่น้อง (ถ้ามี)
      if (siblings.length > 0) {
        const siblingsData = siblings.map(s => ({
          student_id: studentData.id,
          national_id: s.national_id,
          first_name: s.first_name,
          last_name: s.last_name,
          birth_date: s.birth_date || null,
          education_level: s.education_level || null
        }))
        const { error: siblingsError } = await supabase.from('siblings').insert(siblingsData)
        if (siblingsError) throw siblingsError
      }

      setSuccess(true)
      // reset ฟอร์ม
      setFormData({
        national_id: '', student_id: '', title: 'เด็กชาย', first_name: '', last_name: '',
        birth_date: '', address: '', grade: 4, section: '',
        father_first_name: '', father_last_name: '', father_national_id: '',
        father_birth_date: '', father_address: '', father_phone: '',
        mother_first_name: '', mother_last_name: '', mother_national_id: '',
        mother_birth_date: '', mother_address: '', mother_phone: '',
        photo_url: ''
      })
      setPhotoFile(null)
      setSiblings([])
      setCurrentTab('basic')
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      console.error('Error adding student:', err)
      setError(err.message || 'ไม่สามารถบันทึกข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* กลับ & หัวข้อ */}
        <div className="mb-8">
          <button onClick={() => router.push('/')} className="mb-4 text-blue-600 hover:text-blue-800 font-medium">
            ← กลับหน้าหลัก
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">เพิ่มข้อมูลนักเรียนใหม่</h1>
          <p className="text-gray-600">กรอกเฉพาะข้อมูลที่จำเป็นก็ได้ ช่องอื่นๆ จะเพิ่มภายหลังก็ได้</p>
        </div>

        {/* success / error */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-800 font-medium">✅ บันทึกข้อมูลนักเรียนเรียบร้อยแล้ว</div>
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800 font-medium">❌ {error}</div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: 'basic', name: 'ข้อมูลพื้นฐาน', icon: '👤' },
                { id: 'father', name: 'ข้อมูลบิดา', icon: '👨' },
                { id: 'mother', name: 'ข้อมูลมารดา', icon: '👩' },
                { id: 'siblings', name: 'ข้อมูลพี่น้อง', icon: '👶' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    currentTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon} {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow p-6">

            {/* BASIC */}
            {currentTab === 'basic' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลพื้นฐานนักเรียน</h3>

                {/* อัปโหลดรูปภาพ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพนักเรียน</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSelectPhoto}
                      className="w-full text-sm file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border file:border-gray-300 file:bg-gray-50 hover:file:bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">รองรับไฟล์ .jpg .png ขนาด ≤ 5MB</p>
                  </div>
                  <div className="md:col-span-2 flex items-center">
                    {photoPreview ? (
                      <img src={photoPreview} alt="ตัวอย่างรูป" className="h-32 w-32 object-cover rounded-lg border" />
                    ) : formData.photo_url ? (
                      <img src={formData.photo_url} alt="รูปเดิม" className="h-32 w-32 object-cover rounded-lg border" />
                    ) : (
                      <div className="h-32 w-32 rounded-lg border flex items-center justify-center text-gray-400 text-sm">
                        ไม่มีรูป
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* เลขบัตร (required) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">เลขบัตรประจำตัวประชาชน *</label>
                    <input
                      type="text"
                      name="national_id"
                      value={formData.national_id}
                      onChange={handleChange}
                      placeholder="1234567890123"
                      maxLength={13}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* รหัสนักเรียน (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">เลขประจำตัวนักเรียน</label>
                    <input
                      type="text"
                      name="student_id"
                      value={formData.student_id}
                      onChange={handleChange}
                      placeholder="001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* คำนำหน้า (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">คำนำหน้า</label>
                    <select
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="เด็กชาย">เด็กชาย</option>
                      <option value="เด็กหญิง">เด็กหญิง</option>
                      <option value="นาย">นาย</option>
                      <option value="นางสาว">นางสาว</option>
                    </select>
                  </div>

                  {/* ชื่อ (required) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ *</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="ชื่อนักเรียน"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* นามสกุล (required) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">นามสกุล *</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="นามสกุลนักเรียน"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* วันเกิด (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">วันเดือนปีเกิด</label>
                    <input
                      type="date"
                      name="birth_date"
                      value={formData.birth_date || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {formData.birth_date && (
                      <p className="mt-1 text-sm text-gray-600">อายุ: {formatAge(formData.birth_date)}</p>
                    )}
                  </div>

                  {/* ชั้นเรียน (required) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ชั้นเรียน *</label>
                    <select
                      name="grade"
                      value={formData.grade}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value={1}>ป.1</option>
                      <option value={2}>ป.2</option>
                      <option value={3}>ป.3</option>
                      <option value={4}>ป.4</option>
                      <option value={5}>ป.5</option>
                      <option value={6}>ป.6</option>
                    </select>
                  </div>

                  {/* ห้อง (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ห้อง</label>
                    <input
                      type="text"
                      name="section"
                      value={formData.section || ''}
                      onChange={handleChange}
                      placeholder="1, 2, A, B"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* ที่อยู่ (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ที่อยู่</label>
                  <textarea
                    name="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                    placeholder="ที่อยู่ปัจจุบัน"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* FATHER */}
            {currentTab === 'father' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลบิดา (ไม่บังคับ)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อบิดา</label>
                    <input type="text" name="father_first_name" value={formData.father_first_name || ''} onChange={handleChange}
                      placeholder="ชื่อบิดา" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">นามสกุลบิดา</label>
                    <input type="text" name="father_last_name" value={formData.father_last_name || ''} onChange={handleChange}
                      placeholder="นามสกุลบิดา" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">เลขบัตรประชาชนบิดา</label>
                    <input type="text" name="father_national_id" value={formData.father_national_id || ''} onChange={handleChange}
                      placeholder="1234567890123" maxLength={13}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">วันเดือนปีเกิดบิดา</label>
                    <input type="date" name="father_birth_date" value={formData.father_birth_date || ''} onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    {formData.father_birth_date && <p className="mt-1 text-sm text-gray-600">อายุ: {formatAge(formData.father_birth_date)}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">เบอร์โทรศัพท์บิดา</label>
                    <input type="tel" name="father_phone" value={formData.father_phone || ''} onChange={handleChange}
                      placeholder="081-234-5678" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ที่อยู่บิดา</label>
                  <textarea name="father_address" value={formData.father_address || ''} onChange={handleChange} placeholder="ที่อยู่ปัจจุบันของบิดา" rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
            )}

            {/* MOTHER */}
            {currentTab === 'mother' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลมารดา (ไม่บังคับ)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อมารดา</label>
                    <input type="text" name="mother_first_name" value={formData.mother_first_name || ''} onChange={handleChange}
                      placeholder="ชื่อมารดา" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">นามสกุลมารดา</label>
                    <input type="text" name="mother_last_name" value={formData.mother_last_name || ''} onChange={handleChange}
                      placeholder="นามสกุลมารดา" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">เลขบัตรประชาชนมารดา</label>
                    <input type="text" name="mother_national_id" value={formData.mother_national_id || ''} onChange={handleChange}
                      placeholder="1234567890123" maxLength={13}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">วันเดือนปีเกิดมารดา</label>
                    <input type="date" name="mother_birth_date" value={formData.mother_birth_date || ''} onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    {formData.mother_birth_date && <p className="mt-1 text-sm text-gray-600">อายุ: {formatAge(formData.mother_birth_date)}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">เบอร์โทรศัพท์มารดา</label>
                    <input type="tel" name="mother_phone" value={formData.mother_phone || ''} onChange={handleChange}
                      placeholder="081-234-5678" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ที่อยู่มารดา</label>
                  <textarea name="mother_address" value={formData.mother_address || ''} onChange={handleChange} placeholder="ที่อยู่ปัจจุบันของมารดา" rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
            )}

            {/* SIBLINGS */}
            {currentTab === 'siblings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลพี่น้องในบ้าน (ไม่บังคับ)</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-800 mb-4">เพิ่มข้อมูลพี่น้อง</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">เลขบัตรประชาชน</label>
                      <input type="text" value={newSibling.national_id} onChange={(e) => setNewSibling({ ...newSibling, national_id: e.target.value })}
                        placeholder="1234567890123" maxLength={13}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ</label>
                      <input type="text" value={newSibling.first_name} onChange={(e) => setNewSibling({ ...newSibling, first_name: e.target.value })}
                        placeholder="ชื่อ" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล</label>
                      <input type="text" value={newSibling.last_name} onChange={(e) => setNewSibling({ ...newSibling, last_name: e.target.value })}
                        placeholder="นามสกุล" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">วันเดือนปีเกิด</label>
                      <input type="date" value={newSibling.birth_date} onChange={(e) => setNewSibling({ ...newSibling, birth_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">การศึกษาสูงสุด</label>
                      <input type="text" value={newSibling.education_level} onChange={(e) => setNewSibling({ ...newSibling, education_level: e.target.value })}
                        placeholder="เช่น ป.6, ม.3, ปริญญาตรี" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="flex items-end">
                      <button type="button" onClick={addSibling}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        เพิ่มพี่น้อง
                      </button>
                    </div>
                  </div>
                </div>

                {siblings.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-4">รายการพี่น้อง ({siblings.length} คน)</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">เลขบัตรประชาชน</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อ-นามสกุล</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันเดือนปีเกิด</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">การศึกษา</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {siblings.map((s) => (
                            <tr key={s.id}>
                              <td className="px-4 py-4 text-sm text-gray-900">{s.national_id}</td>
                              <td className="px-4 py-4 text-sm text-gray-900">{s.first_name} {s.last_name}</td>
                              <td className="px-4 py-4 text-sm text-gray-900">
                                {new Date(s.birth_date).toLocaleDateString('th-TH')}
                                <br />
                                <span className="text-gray-600 text-xs">อายุ: {formatAge(s.birth_date)}</span>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900">{s.education_level || '-'}</td>
                              <td className="px-4 py-4">
                                <button type="button" onClick={() => removeSibling(s.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">ลบ</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ปุ่มส่ง */}
            <div className="mt-8 flex gap-4">
              {currentTab !== 'basic' && (
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['basic', 'father', 'mother', 'siblings']
                    const currentIndex = tabs.indexOf(currentTab)
                    setCurrentTab(tabs[currentIndex - 1])
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  ← ก่อนหน้า
                </button>
              )}

              {currentTab !== 'siblings' ? (
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['basic', 'father', 'mother', 'siblings']
                    const currentIndex = tabs.indexOf(currentTab)
                    setCurrentTab(tabs[currentIndex + 1])
                  }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  ถัดไป →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลทั้งหมด'}
                </button>
              )}

              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </form>

        {/* Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 หมายเหตุ</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• บังคับกรอกเฉพาะ: เลขบัตรประชาชน, ชื่อ, นามสกุล, ชั้นเรียน</li>
            <li>• ช่องอื่นเว้นว่างได้ กดบันทึกได้เลย</li>
            <li>• ถ้าอัปโหลดรูป ระบบจะบันทึกไฟล์ใน Supabase Storage และเก็บ URL ใน student</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
