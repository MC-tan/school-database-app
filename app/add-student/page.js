'use client'

import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { validateNationalId, validatePhoneNumber, formatAge } from '../../lib/dateUtils'

export default function AddEditStudent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'add' // 'add' หรือ 'edit'
  const isEditing = mode === 'edit'

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

    photo_url: ''
  })

  // === State สำหรับการเลือกนักเรียน ===
  const [studentsList, setStudentsList] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [searchStudent, setSearchStudent] = useState('')
  const [loadingStudents, setLoadingStudents] = useState(false)

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
  const [initialLoading, setInitialLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [currentTab, setCurrentTab] = useState('basic')

  // === โหลดรายชื่อนักเรียนเมื่อเข้าโหมดแก้ไข ===
  useEffect(() => {
    if (isEditing) {
      loadStudentsList()
    }
  }, [isEditing])

  const loadStudentsList = async () => {
    setLoadingStudents(true)
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, grade, section')
        .order('grade', { ascending: true })
        .order('first_name', { ascending: true })

      if (error) throw error
      setStudentsList(data || [])
    } catch (err) {
      console.error('Error loading students list:', err)
      setError('ไม่สามารถโหลดรายชื่อนักเรียนได้')
    } finally {
      setLoadingStudents(false)
    }
  }

  // === กรองรายชื่อนักเรียนตามการค้นหา ===
  const filteredStudents = useMemo(() => {
    if (!searchStudent) return studentsList
    
    const searchTerm = searchStudent.toLowerCase()
    return studentsList.filter(student => 
      student.first_name.toLowerCase().includes(searchTerm) ||
      student.last_name.toLowerCase().includes(searchTerm) ||
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm)
    )
  }, [studentsList, searchStudent])

  // === โหลดข้อมูลนักเรียนเมื่อเลือก ===
  const loadStudentData = async (studentId) => {
    if (!studentId) return
    
    setInitialLoading(true)
    try {
      // โหลดข้อมูลนักเรียน
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()

      if (studentError) throw studentError

      if (studentData) {
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

        // โหลดข้อมูลพี่น้อง
        const { data: siblingsData } = await supabase
          .from('siblings')
          .select('*')
          .eq('student_id', studentId)

        if (siblingsData && siblingsData.length > 0) {
          setSiblings(siblingsData.map(s => ({
            id: s.id,
            national_id: s.national_id,
            first_name: s.first_name,
            last_name: s.last_name,
            birth_date: s.birth_date,
            education_level: s.education_level || ''
          })))
        } else {
          setSiblings([])
        }
      }
    } catch (err) {
      console.error('Error loading student:', err)
      setError('ไม่สามารถโหลดข้อมูลนักเรียนได้')
    } finally {
      setInitialLoading(false)
    }
  }

  // === จัดการการเลือกนักเรียน ===
  const handleSelectStudent = (studentId) => {
    setSelectedStudentId(studentId)
    setError(null)
    loadStudentData(studentId)
  }

  // === handlers ===
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
    
    const nationalIdCheck = validateNationalId(newSibling.national_id)
    if (!nationalIdCheck.isValid) {
      alert(`เลขบัตรประชาชนพี่น้องไม่ถูกต้อง: ${nationalIdCheck.message}`)
      return
    }
    
    if (newSibling.national_id === formData.national_id) {
      alert('เลขบัตรประชาชนพี่น้องซ้ำกับเลขบัตรประชาชนนักเรียน')
      return
    }
    
    const existingSibling = siblings.find(s => s.national_id === newSibling.national_id)
    if (existingSibling) {
      alert(`เลขบัตรประชาชนนี้ซ้ำกับพี่น้องที่มีอยู่แล้ว: ${existingSibling.first_name} ${existingSibling.last_name}`)
      return
    }
    
    setSiblings([...siblings, { ...newSibling, id: Date.now() }])
    setNewSibling({ national_id: '', first_name: '', last_name: '', birth_date: '', education_level: '' })
  }

  const removeSibling = (id) => {
    setSiblings(siblings.filter((s) => s.id !== id))
  }

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
      // ตรวจสอบว่าเลือกนักเรียนแล้วเมื่อแก้ไข
      if (isEditing && !selectedStudentId) {
        throw new Error('กรุณาเลือกนักเรียนที่ต้องการแก้ไข')
      }

      // ตรวจสอบข้อมูลบังคับ
      if (!formData.national_id || !formData.first_name || !formData.last_name || !formData.grade) {
        throw new Error('กรุณากรอก เลขบัตรประชาชน, ชื่อ, นามสกุล และชั้นเรียน')
      }

      // ตรวจเลขบัตรประชาชน
      const nationalIdCheck = validateNationalId(formData.national_id)
      if (!nationalIdCheck.isValid) {
        throw new Error(`เลขบัตรประชาชนนักเรียนไม่ถูกต้อง: ${nationalIdCheck.message}`)
      }

      // ตรวจเลขบัตรประชาชนบิดา-มารดา
      if (formData.father_national_id) {
        const fatherIdCheck = validateNationalId(formData.father_national_id)
        if (!fatherIdCheck.isValid) {
          throw new Error(`เลขบัตรประชาชนบิดาไม่ถูกต้อง: ${fatherIdCheck.message}`)
        }
      }

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

      // ตรวจข้อมูลซ้ำ
      if (!isEditing) {
        const { data: existingByNid } = await supabase
          .from('students')
          .select('national_id')
          .eq('national_id', formData.national_id)
          .maybeSingle()

        if (existingByNid) {
          throw new Error('เลขบัตรประชาชนนักเรียนนี้มีอยู่ในระบบแล้ว')
        }
      } else {
        const { data: existingByNid } = await supabase
          .from('students')
          .select('id, national_id')
          .eq('national_id', formData.national_id)
          .neq('id', selectedStudentId)
          .maybeSingle()

        if (existingByNid) {
          throw new Error('เลขบัตรประชาชนนักเรียนนี้ซ้ำกับนักเรียนคนอื่นในระบบ')
        }
      }

      // ตรวจสอบเลขบัตรประชาชนพี่น้อง
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

      // อัปโหลดรูป
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

      const payload = emptyToNull({ ...formData, photo_url: photoUrl })
      let savedStudentData

      if (isEditing) {
        // แก้ไขข้อมูล
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .update(payload)
          .eq('id', selectedStudentId)
          .select()
          .single()
        if (studentError) throw studentError
        savedStudentData = studentData

        // ลบพี่น้องเก่าแล้วเพิ่มใหม่
        const { error: deleteSiblingsError } = await supabase
          .from('siblings')
          .delete()
          .eq('student_id', selectedStudentId)
        if (deleteSiblingsError) throw deleteSiblingsError

      } else {
        // เพิ่มข้อมูลใหม่
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .insert([payload])
          .select()
          .single()
        if (studentError) throw studentError
        savedStudentData = studentData
      }

      // บันทึกข้อมูลพี่น้อง
      if (siblings.length > 0) {
        const siblingsData = siblings.map((s) => ({
          student_id: savedStudentData.id,
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
      
      if (!isEditing) {
        // reset ฟอร์มเมื่อเพิ่มใหม่
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
      } else {
        // อัปเดตรายชื่อนักเรียนใหม่
        loadStudentsList()
      }
      
      setTimeout(() => setSuccess(false), 5000)

    } catch (err) {
      console.error('Error saving student:', err)
      setError(err.message || 'ไม่สามารถบันทึกข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  // แสดง loading เมื่อโหลดข้อมูล
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลนักเรียน...</p>
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
          
          {/* เลือกโหมด */}
          <div className="mb-6">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  router.push('/add-student?mode=add')
                  setSelectedStudentId('')
                  setFormData({
                    national_id: '', student_id: '', title: 'เด็กชาย', first_name: '', last_name: '',
                    birth_date: '', address: '', grade: 4, section: '',
                    father_first_name: '', father_last_name: '', father_national_id: '',
                    father_birth_date: '', father_address: '', father_phone: '',
                    mother_first_name: '', mother_last_name: '', mother_national_id: '',
                    mother_birth_date: '', mother_address: '', mother_phone: '',
                    photo_url: ''
                  })
                  setSiblings([])
                  setPhotoFile(null)
                }}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  !isEditing ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ➕ เพิ่มนักเรียนใหม่
              </button>
              <button
                type="button"
                onClick={() => router.push('/add-student?mode=edit')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isEditing ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ✏️ แก้ไขข้อมูลนักเรียน
              </button>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditing ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มข้อมูลนักเรียนใหม่'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'เลือกนักเรียนที่ต้องการแก้ไขข้อมูล' : 'กรอกเฉพาะข้อมูลที่จำเป็นก็ได้ ช่องอื่นๆ จะเพิ่มภายหลังก็ได้'}
          </p>
        </div>

        {/* เลือกนักเรียน (เฉพาะโหมดแก้ไข) */}
        {isEditing && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">เลือกนักเรียนที่ต้องการแก้ไข</h3>
            
            {/* ช่องค้นหา */}
            <div className="mb-4">
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="ค้นหาชื่อ-นามสกุลนักเรียน..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* รายชื่อนักเรียน */}
            {loadingStudents ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">กำลังโหลดรายชื่อ...</p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredStudents.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => handleSelectStudent(student.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                          selectedStudentId === student.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </span>
                            <span className="ml-2 text-sm text-gray-500">
                              ป.{student.grade}{student.section ? `/${student.section}` : ''}
                            </span>
                          </div>
                          {selectedStudentId === student.id && (
                            <span className="text-blue-600 text-sm">✓ เลือกแล้ว</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    {searchStudent ? 'ไม่พบนักเรียนที่ค้นหา' : 'ไม่มีนักเรียนในระบบ'}
                  </div>
                )}
              </div>
            )}

            {selectedStudentId && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  ✓ เลือกนักเรียนแล้ว กรุณาแก้ไขข้อมูลในแบบฟอร์มด้านล่าง
                </p>
              </div>
            )}
          </div>
        )}

        {/* success / error */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-800 font-medium">
              ✅ {isEditing ? 'แก้ไขข้อมูลนักเรียนเรียบร้อยแล้ว' : 'บันทึกข้อมูลนักเรียนเรียบร้อยแล้ว'}
            </div>
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800 font-medium">❌ {error}</div>
          </div>
        )}

        {/* แสดงฟอร์มเฉพาะเมื่อไม่ใช่โหมดแก้ไข หรือเลือกนักเรียนแล้ว */}
        {(!isEditing || selectedStudentId) && (
          <>
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

                      {/* คำนำหน้า (optional) */}
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
                                      onClick={() => removeSibling(s.id)} 
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
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg font-medium transition-colors"
                    >
                      {loading ? 'กำลังบันทึก...' : (isEditing ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลทั้งหมด')}
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
          </>
        )}

        {/* Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 หมายเหตุ</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            {isEditing ? (
              <>
                <li>• เลือกนักเรียนจากรายชื่อด้านบน แล้วแก้ไขข้อมูลในแบบฟอร์ม</li>
                <li>• สามารถค้นหาชื่อนักเรียนได้ในช่องค้นหา</li>
                <li>• การแก้ไขจะอัปเดตข้อมูลที่มีอยู่แล้ว ไม่ใช่สร้างใหม่</li>
              </>
            ) : (
              <>
                <li>• บังคับกรอกเฉพาะ: เลขบัตรประชาชน, ชื่อ, นามสกุล, ชั้นเรียน</li>
                <li>• ช่องอื่นเว้นว่างได้ กดบันทึกได้เลย</li>
                <li>• ถ้าอัปโหลดรูป ระบบจะบันทึกไฟล์ใน Supabase Storage และเก็บ URL ใน student</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}