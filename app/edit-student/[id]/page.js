'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { validateNationalId, validatePhoneNumber, formatAge } from '../../../lib/dateUtils'

export default function EditStudent() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id

  // === State หลัก ===
  const [formData, setFormData] = useState({
    national_id: '',
    student_id: '',
    title: 'เด็กชาย',
    first_name: '',
    last_name: '',
    birth_date: '',
    address: '',
    grade: 4,
    section: '',

    // ผู้ปกครอง
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

    // รูปภาพ
    photo_url: ''
  })

  // อัปโหลดรูป
  const [photoFile, setPhotoFile] = useState(null)
  const photoPreview = useMemo(() => (photoFile ? URL.createObjectURL(photoFile) : null), [photoFile])

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
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [currentTab, setCurrentTab] = useState('basic')
  const [originalNationalId, setOriginalNationalId] = useState('')

  // ===== ฟังก์ชันดึงข้อมูล =====
  const fetchStudentData = async () => {
    try {
      setInitialLoading(true)
      setError(null)

      // ดึงข้อมูลนักเรียน
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()

      if (studentError) throw studentError
      if (!studentData) throw new Error('ไม่พบข้อมูลนักเรียน')

      // ตั้งค่าข้อมูลลงฟอร์ม
      setFormData({
        national_id: studentData.national_id || '',
        student_id: studentData.student_id || '',
        title: studentData.title || 'เด็กชาย',
        first_name: studentData.first_name || '',
        last_name: studentData.last_name || '',
        birth_date: studentData.birth_date || '',
        address: studentData.address || '',
        grade: studentData.grade || 4,
        section: studentData.section || '',

        father_first_name: studentData.father_first_name || '',
        father_last_name: studentData.father_last_name || '',
        father_national_id: studentData.father_national_id || '',
        father_birth_date: studentData.father_birth_date || '',
        father_address: studentData.father_address || '',
        father_phone: studentData.father_phone || '',

        mother_first_name: studentData.mother_first_name || '',
        mother_last_name: studentData.mother_last_name || '',
        mother_national_id: studentData.mother_national_id || '',
        mother_birth_date: studentData.mother_birth_date || '',
        mother_address: studentData.mother_address || '',
        mother_phone: studentData.mother_phone || '',

        photo_url: studentData.photo_url || ''
      })

      setOriginalNationalId(studentData.national_id)

      // ดึงข้อมูลพี่น้อง
      const { data: siblingsData, error: siblingsError } = await supabase
        .from('siblings')
        .select('*')
        .eq('student_id', studentId)

      if (siblingsError) throw siblingsError
      
      setSiblings(siblingsData || [])

    } catch (err) {
      console.error('Error fetching student data:', err)
      setError(err.message || 'ไม่สามารถดึงข้อมูลได้')
    } finally {
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    if (studentId) {
      fetchStudentData()
    }
  }, [studentId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ===== handlers =====
  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseInt(value)) : value
    }))
  }

  const handleSelectPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('ไฟล์รูปขนาดเกิน 5MB')
      e.target.value = ''
      return
    }
    setPhotoFile(file)
  }

  const addSibling = (e) => {
    e?.preventDefault()
    
    if (!newSibling.national_id || !newSibling.first_name || !newSibling.last_name || !newSibling.birth_date) {
      alert('กรุณากรอกข้อมูลพี่น้องให้ครบถ้วน: เลขบัตรประชาชน, ชื่อ, นามสกุล, และวันเกิด')
      return
    }
    
    // ตรวจเลขบัตรประชาชนพี่น้อง
    const nationalIdCheck = validateNationalId(newSibling.national_id)
    if (!nationalIdCheck.isValid) {
      alert(`เลขบัตรประชาชนพี่น้องไม่ถูกต้อง: ${nationalIdCheck.message}`)
      return
    }
    
    // ตรวจซ้ำกับนักเรียน
    if (newSibling.national_id === formData.national_id) {
      alert('เลขบัตรประชาชนพี่น้องซ้ำกับเลขบัตรประชาชนนักเรียน')
      return
    }
    
    // ตรวจซ้ำกับพี่น้องคนอื่น
    const existingSibling = siblings.find(s => s.national_id === newSibling.national_id)
    if (existingSibling) {
      alert(`เลขบัตรประชาชนนี้ซ้ำกับพี่น้องที่มีอยู่แล้ว: ${existingSibling.first_name} ${existingSibling.last_name}`)
      return
    }
    
    setSiblings([...siblings, { ...newSibling, id: Date.now(), isNew: true }])
    setNewSibling({ national_id: '', first_name: '', last_name: '', birth_date: '', education_level: '' })
  }

  const removeSibling = (siblingToRemove) => {
    setSiblings(siblings.filter((s) => s.id !== siblingToRemove.id))
  }

  // helper: แปลงค่าว่างเป็น null
  const emptyToNull = (obj) => {
    const out = {}
    for (const [k, v] of Object.entries(obj)) {
      out[k] = v === '' ? null : v
    }
    return out
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // (1) ตรวจสอบข้อมูลบังคับ
      if (!formData.national_id || !formData.first_name || !formData.last_name || !formData.grade) {
        throw new Error('กรุณากรอก เลขบัตรประชาชน, ชื่อ, นามสกุล และชั้นเรียน')
      }

      // ตรวจเลขบัตรประชาชนนักเรียน
      const nationalIdCheck = validateNationalId(formData.national_id)
      if (!nationalIdCheck.isValid) {
        throw new Error(`เลขบัตรประชาชนนักเรียนไม่ถูกต้อง: ${nationalIdCheck.message}`)
      }

      // ตรวจเลขบัตรประชาชนบิดา (ถ้ากรอก)
      if (formData.father_national_id) {
        const fatherIdCheck = validateNationalId(formData.father_national_id)
        if (!fatherIdCheck.isValid) {
          throw new Error(`เลขบัตรประชาชนบิดาไม่ถูกต้อง: ${fatherIdCheck.message}`)
        }
      }

      // ตรวจเลขบัตรประชาชนมารดา (ถ้ากรอก)
      if (formData.mother_national_id) {
        const motherIdCheck = validateNationalId(formData.mother_national_id)
        if (!motherIdCheck.isValid) {
          throw new Error(`เลขบัตรประชาชนมารดาไม่ถูกต้อง: ${motherIdCheck.message}`)
        }
      }

      // ตรวจเบอร์โทร
      if (formData.father_phone) {
        const phoneCheck = validatePhoneNumber(formData.father_phone)
        if (!phoneCheck.isValid) throw new Error(`เบอร์โทรศัพท์บิดาไม่ถูกต้อง: ${phoneCheck.message}`)
      }
      if (formData.mother_phone) {
        const phoneCheck = validatePhoneNumber(formData.mother_phone)
        if (!phoneCheck.isValid) throw new Error(`เบอร์โทรศัพท์มารดาไม่ถูกต้อง: ${phoneCheck.message}`)
      }

      // ตรวจข้อมูลซ้ำ national_id (ถ้าเปลี่ยน)
      if (formData.national_id !== originalNationalId) {
        const { data: existingByNid } = await supabase
          .from('students')
          .select('national_id')
          .eq('national_id', formData.national_id)
          .neq('id', studentId)
          .maybeSingle()

        if (existingByNid) {
          throw new Error('เลขบัตรประชาชนนักเรียนนี้มีอยู่ในระบบแล้ว')
        }
      }

      // ตรวจสอบเลขบัตรประชาชนพี่น้องซ้ำกับนักเรียนหรือกันเอง
      for (let i = 0; i < siblings.length; i++) {
        const sibling = siblings[i]
        
        if (sibling.national_id === formData.national_id) {
          throw new Error(`เลขบัตรประชาชนพี่น้องคนที่ ${i + 1} (${sibling.first_name} ${sibling.last_name}) ซ้ำกับเลขบัตรประชาชนนักเรียน`)
        }

        for (let j = i + 1; j < siblings.length; j++) {
          if (siblings[j].national_id === sibling.national_id) {
            throw new Error(`เลขบัตรประชาชนพี่น้องคนที่ ${i + 1} และคนที่ ${j + 1} ซ้ำกัน`)
          }
        }
      }

      // (3) อัปโหลดรูป (ถ้ามีไฟล์ใหม่)
      let photoUrl = formData.photo_url
      if (photoFile) {
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

      // เตรียม payload
      const payload = emptyToNull({ ...formData, photo_url: photoUrl })

      // อัปเดตข้อมูลนักเรียน
      const { error: studentError } = await supabase
        .from('students')
        .update(payload)
        .eq('id', studentId)

      if (studentError) throw studentError

      // จัดการข้อมูลพี่น้อง
      // 1. ลบพี่น้องเก่าทั้งหมด
      const { error: deleteError } = await supabase
        .from('siblings')
        .delete()
        .eq('student_id', studentId)

      if (deleteError) throw deleteError

      // 2. เพิ่มพี่น้องใหม่ทั้งหมด
      if (siblings.length > 0) {
        const siblingsData = siblings.map((s) => ({
          student_id: parseInt(studentId),
          national_id: s.national_id,
          first_name: s.first_name,
          last_name: s.last_name,
          birth_date: s.birth_date || null,
          education_level: s.education_level || null
        }))
        
        const { error: siblingsError } = await supabase
          .from('siblings')
          .insert(siblingsData)
          
        if (siblingsError) throw siblingsError
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/')
      }, 2000)

    } catch (err) {
      console.error('Error updating student:', err)
      setError(err.message || 'ไม่สามารถบันทึกข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  // แสดงหน้าโหลด
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">กำลังโหลดข้อมูล...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* กลับ & หัวข้อ */}
        <div className="mb-8">
          <button type="button" onClick={() => router.push('/')} className="mb-4 text-blue-600 hover:text-blue-800 font-medium">
            ← กลับหน้าหลัก
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">แก้ไขข้อมูลนักเรียน</h1>
          <p className="text-gray-600">แก้ไขข้อมูลของ: {formData.first_name} {formData.last_name}</p>
        </div>

        {/* success / error */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-800 font-medium">✅ แก้ไขข้อมูลนักเรียนเรียบร้อยแล้ว กำลังกลับหน้าหลัก...</div>
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
                  type="button"
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
                    {formData.national_id !== originalNationalId && (
                      <p className="mt-1 text-sm text-amber-600">
                        ⚠️ คุณกำลังเปลี่ยนเลขบัตรประชาชนจาก "{originalNationalId}" เป็น "{formData.national_id}"
                      </p>
                    )}
                  </div>

                  {/* รหัสนักเรียน (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">เลขประจำตัวนักเรียน</label>
                    <input
                      type="text"
                      name="student_id"
                      value={formData.student_id || ''}
                      onChange={handleChange}
                      placeholder="001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* คำนำหน้า */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">คำนำหน้า</label>
                    <select
                      name="title"
                      value={formData.title || ''}
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

                  {/* วันเกิด */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">วันเดือนปีเกิด</label>
                    <input
                      type="date"
                      name="birth_date"
                      value={formData.birth_date || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {formData.birth_date && <p className="mt-1 text-sm text-gray-600">อายุ: {formatAge(formData.birth_date)}</p>}
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

                  {/* ห้อง */}
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

                {/* ที่อยู่ */}
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลบิดา</h3>
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลมารดา</h3>
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลพี่น้องในบ้าน</h3>
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
                      <button 
                        type="button" 
                        onClick={addSibling}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >เพิ่มพี่น้อง
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
                                {s.birth_date ? new Date(s.birth_date).toLocaleDateString('th-TH') : '-'}
                                {s.birth_date && (
                                  <>
                                    <br />
                                    <span className="text-gray-600 text-xs">อายุ: {formatAge(s.birth_date)}</span>
                                  </>
                                )}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900">{s.education_level || '-'}</td>
                              <td className="px-4 py-4">
                               <button 
                                  type="button" 
                                  onClick={() => removeSibling(s)} 
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  ลบ
                                </button>
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
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
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
        <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-medium text-orange-900 mb-2">🔧 หมายเหตุการแก้ไข</h3>
          <ul className="text-orange-800 text-sm space-y-1">
            <li>• ข้อมูลที่แก้ไขจะมีผลทันทีหลังบันทึก</li>
            <li>• การเปลี่ยนเลขบัตรประชาชนจะตรวจสอบการซ้ำกับข้อมูลอื่น</li>
            <li>• รูปภาพใหม่จะแทนที่รูปเดิม (ถ้าอัปโหลด)</li>
            <li>• ข้อมูลพี่น้องจะถูกแทนที่ทั้งหมดด้วยรายการใหม่</li>
          </ul>
        </div>
      </div>
    </div>
  )
}