'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { validateNationalId, validateBirthDate, validatePhoneNumber, formatAge } from '../../lib/dateUtils'

export default function AddStudent() {
  const router = useRouter()
  
  // State สำหรับข้อมูลนักเรียน
  const [formData, setFormData] = useState({
    // ข้อมูลพื้นฐาน
    national_id: '',
    student_id: '',
    title: 'เด็กชาย',
    first_name: '',
    last_name: '',
    birth_date: '',
    address: '',
    grade: 4,
    section: '',
    
    // ข้อมูลบิดา
    father_first_name: '',
    father_last_name: '',
    father_national_id: '',
    father_birth_date: '',
    father_address: '',
    father_phone: '',
    
    // ข้อมูลมารดา
    mother_first_name: '',
    mother_last_name: '',
    mother_national_id: '',
    mother_birth_date: '',
    mother_address: '',
    mother_phone: ''
  })
  
  // State สำหรับพี่น้อง
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

  // ฟังก์ชันจัดการการเปลี่ยนแปลงข้อมูลในฟอร์ม
  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }))
  }

  // ฟังก์ชันเพิ่มพี่น้อง
  const addSibling = () => {
    // ตรวจสอบข้อมูลพี่น้อง
    if (!newSibling.national_id || !newSibling.first_name || !newSibling.last_name || !newSibling.birth_date) {
      alert('กรุณากรอกข้อมูลพี่น้องให้ครบถ้วน')
      return
    }

    // ตรวจสอบเลขบัตรประชาชน
    const nationalIdCheck = validateNationalId(newSibling.national_id)
    if (!nationalIdCheck.isValid) {
      alert(nationalIdCheck.message)
      return
    }

    // ตรวจสอบไม่ซ้ำ
    if (siblings.some(s => s.national_id === newSibling.national_id)) {
      alert('เลขบัตรประชาชนของพี่น้องซ้ำกัน')
      return
    }

    setSiblings([...siblings, { ...newSibling, id: Date.now() }])
    setNewSibling({
      national_id: '',
      first_name: '',
      last_name: '',
      birth_date: '',
      education_level: ''
    })
  }

  // ฟังก์ชันลบพี่น้อง
  const removeSibling = (id) => {
    setSiblings(siblings.filter(s => s.id !== id))
  }

  // ฟังก์ชันบันทึกข้อมูล
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!formData.national_id || !formData.student_id || !formData.first_name || 
          !formData.last_name || !formData.birth_date || !formData.section) {
        throw new Error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน')
      }

      // ตรวจสอบเลขบัตรประชาชน
      const nationalIdCheck = validateNationalId(formData.national_id)
      if (!nationalIdCheck.isValid) {
        throw new Error(nationalIdCheck.message)
      }

      // ตรวจสอบวันเดือนปีเกิด
      const birthDateCheck = validateBirthDate(formData.birth_date)
      if (!birthDateCheck.isValid) {
        throw new Error(birthDateCheck.message)
      }

      // ตรวจสอบเบอร์โทรบิดา
      if (formData.father_phone) {
        const phoneCheck = validatePhoneNumber(formData.father_phone)
        if (!phoneCheck.isValid) {
          throw new Error('เบอร์โทรบิดา: ' + phoneCheck.message)
        }
      }

      // ตรวจสอบเบอร์โทรมารดา  
      if (formData.mother_phone) {
        const phoneCheck = validatePhoneNumber(formData.mother_phone)
        if (!phoneCheck.isValid) {
          throw new Error('เบอร์โทรมารดา: ' + phoneCheck.message)
        }
      }

      // ตรวจสอบข้อมูลซ้ำ
      const { data: existingStudent } = await supabase
        .from('students_new')
        .select('national_id, student_id')
        .or(`national_id.eq.${formData.national_id},student_id.eq.${formData.student_id}`)
        .single()

      if (existingStudent) {
        if (existingStudent.national_id === formData.national_id) {
          throw new Error('เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว')
        }
        if (existingStudent.student_id === formData.student_id) {
          throw new Error('รหัสนักเรียนนี้มีอยู่ในระบบแล้ว')
        }
      }

      // บันทึกข้อมูลนักเรียน
      const { data: studentData, error: studentError } = await supabase
        .from('students_new')
        .insert([formData])
        .select()
        .single()

      if (studentError) throw studentError

      // บันทึกข้อมูลพี่น้อง
      if (siblings.length > 0) {
        const siblingsData = siblings.map(sibling => ({
          student_id: studentData.id,
          national_id: sibling.national_id,
          first_name: sibling.first_name,
          last_name: sibling.last_name,
          birth_date: sibling.birth_date,
          education_level: sibling.education_level
        }))

        const { error: siblingsError } = await supabase
          .from('siblings')
          .insert(siblingsData)

        if (siblingsError) throw siblingsError
      }

      setSuccess(true)
      
      // รีเซ็ตฟอร์ม
      setFormData({
        national_id: '', student_id: '', title: 'เด็กชาย', first_name: '', last_name: '',
        birth_date: '', address: '', grade: 4, section: '',
        father_first_name: '', father_last_name: '', father_national_id: '',
        father_birth_date: '', father_address: '', father_phone: '',
        mother_first_name: '', mother_last_name: '', mother_national_id: '',
        mother_birth_date: '', mother_address: '', mother_phone: ''
      })
      setSiblings([])
      setCurrentTab('basic')

      setTimeout(() => setSuccess(false), 5000)

    } catch (error) {
      console.error('Error adding student:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* หัวข้อและปุ่มกลับ */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="mb-4 text-blue-600 hover:text-blue-800 font-medium"
          >
            ← กลับหน้าหลัก
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            เพิ่มข้อมูลนักเรียนใหม่
          </h1>
          <p className="text-gray-600">
            กรอกข้อมูลนักเรียนและผู้ปกครองให้ครบถ้วน
          </p>
        </div>

        {/* แสดงข้อความสำเร็จ */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-800 font-medium">
              ✅ บันทึกข้อมูลนักเรียนเรียบร้อยแล้ว
            </div>
          </div>
        )}

        {/* แสดงข้อความผิดพลาด */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800 font-medium">
              ❌ {error}
            </div>
          </div>
        )}

        {/* แท็บเมนู */}
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
                    currentTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon} {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* ฟอร์ม */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow p-6">
            
            {/* แท็บข้อมูลพื้นฐาน */}
            {currentTab === 'basic' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลพื้นฐานนักเรียน</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* เลขบัตรประชาชน */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เลขบัตรประจำตัวประชาชน *
                    </label>
                    <input
                      type="text"
                      name="national_id"
                      value={formData.national_id}
                      onChange={handleChange}
                      placeholder="1234567890123"
                      maxLength="13"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* รหัสนักเรียน */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เลขประจำตัวนักเรียน *
                    </label>
                    <input
                      type="text"
                      name="student_id"
                      value={formData.student_id}
                      onChange={handleChange}
                      placeholder="001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* คำนำหน้า */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      คำนำหน้า *
                    </label>
                    <select
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="เด็กชาย">เด็กชาย</option>
                      <option value="เด็กหญิง">เด็กหญิง</option>
                      <option value="นาย">นาย</option>
                      <option value="นางสาว">นางสาว</option>
                    </select>
                  </div>

                  {/* ชื่อ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อ *
                    </label>
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

                  {/* นามสกุล */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      นามสกุล *
                    </label>
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

                  {/* วันเดือนปีเกิด */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      วันเดือนปีเกิด *
                    </label>
                    <input
                      type="date"
                      name="birth_date"
                      value={formData.birth_date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    {formData.birth_date && (
                      <p className="mt-1 text-sm text-gray-600">
                        อายุ: {formatAge(formData.birth_date)}
                      </p>
                    )}
                  </div>

                  {/* ชั้นเรียน */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชั้นเรียน *
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ห้อง *
                    </label>
                    <input
                      type="text"
                      name="section"
                      value={formData.section}
                      onChange={handleChange}
                      placeholder="1, 2, A, B"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* ที่อยู่ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ที่อยู่
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="ที่อยู่ปัจจุบัน"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* แท็บข้อมูลบิดา */}
            {currentTab === 'father' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลบิดา</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ชื่อบิดา */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อบิดา
                    </label>
                    <input
                      type="text"
                      name="father_first_name"
                      value={formData.father_first_name}
                      onChange={handleChange}
                      placeholder="ชื่อบิดา"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* นามสกุลบิดา */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      นามสกุลบิดา
                    </label>
                    <input
                      type="text"
                      name="father_last_name"
                      value={formData.father_last_name}
                      onChange={handleChange}
                      placeholder="นามสกุลบิดา"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* เลขบัตรประชาชนบิดา */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เลขบัตรประจำตัวประชาชนบิดา
                    </label>
                    <input
                      type="text"
                      name="father_national_id"
                      value={formData.father_national_id}
                      onChange={handleChange}
                      placeholder="1234567890123"
                      maxLength="13"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* วันเดือนปีเกิดบิดา */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      วันเดือนปีเกิดบิดา
                    </label>
                    <input
                      type="date"
                      name="father_birth_date"
                      value={formData.father_birth_date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {formData.father_birth_date && (
                      <p className="mt-1 text-sm text-gray-600">
                        อายุ: {formatAge(formData.father_birth_date)}
                      </p>
                    )}
                  </div>

                  {/* เบอร์โทรบิดา */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เบอร์โทรศัพท์บิดา
                    </label>
                    <input
                      type="tel"
                      name="father_phone"
                      value={formData.father_phone}
                      onChange={handleChange}
                      placeholder="081-234-5678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* ที่อยู่บิดา */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ที่อยู่บิดา
                  </label>
                  <textarea
                    name="father_address"
                    value={formData.father_address}
                    onChange={handleChange}
                    placeholder="ที่อยู่ปัจจุบันของบิดา"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* แท็บข้อมูลมารดา */}
            {currentTab === 'mother' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลมารดา</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ชื่อมารดา */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อมารดา
                    </label>
                    <input
                      type="text"
                      name="mother_first_name"
                      value={formData.mother_first_name}
                      onChange={handleChange}
                      placeholder="ชื่อมารดา"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* นามสกุลมารดา */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      นามสกุลมารดา
                    </label>
                    <input
                      type="text"
                      name="mother_last_name"
                      value={formData.mother_last_name}
                      onChange={handleChange}
                      placeholder="นามสกุลมารดา"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* เลขบัตรประชาชนมารดา */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เลขบัตรประจำตัวประชาชนมารดา
                    </label>
                    <input
                      type="text"
                      name="mother_national_id"
                      value={formData.mother_national_id}
                      onChange={handleChange}
                      placeholder="1234567890123"
                      maxLength="13"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* วันเดือนปีเกิดมารดา */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      วันเดือนปีเกิดมารดา
                    </label>
                    <input
                      type="date"
                      name="mother_birth_date"
                      value={formData.mother_birth_date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {formData.mother_birth_date && (
                      <p className="mt-1 text-sm text-gray-600">
                        อายุ: {formatAge(formData.mother_birth_date)}
                      </p>
                    )}
                  </div>

                  {/* เบอร์โทรมารดา */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เบอร์โทรศัพท์มารดา
                    </label>
                    <input
                      type="tel"
                      name="mother_phone"
                      value={formData.mother_phone}
                      onChange={handleChange}
                      placeholder="081-234-5678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* ที่อยู่มารดา */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ที่อยู่มารดา
                  </label>
                  <textarea
                    name="mother_address"
                    value={formData.mother_address}
                    onChange={handleChange}
                    placeholder="ที่อยู่ปัจจุบันของมารดา"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* แท็บข้อมูลพี่น้อง */}
            {currentTab === 'siblings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลพี่น้องในบ้าน</h3>
                
                {/* ฟอร์มเพิ่มพี่น้อง */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-800 mb-4">เพิ่มข้อมูลพี่น้อง</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        เลขบัตรประชาชน
                      </label>
                      <input
                        type="text"
                        value={newSibling.national_id}
                        onChange={(e) => setNewSibling({...newSibling, national_id: e.target.value})}
                        placeholder="1234567890123"
                        maxLength="13"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ชื่อ
                      </label>
                      <input
                        type="text"
                        value={newSibling.first_name}
                        onChange={(e) => setNewSibling({...newSibling, first_name: e.target.value})}
                        placeholder="ชื่อ"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        นามสกุล
                      </label>
                      <input
                        type="text"
                        value={newSibling.last_name}
                        onChange={(e) => setNewSibling({...newSibling, last_name: e.target.value})}
                        placeholder="นามสกุล"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        วันเดือนปีเกิด
                      </label>
                      <input
                        type="date"
                        value={newSibling.birth_date}
                        onChange={(e) => setNewSibling({...newSibling, birth_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        การศึกษาสูงสุด
                      </label>
                      <input
                        type="text"
                        value={newSibling.education_level}
                        onChange={(e) => setNewSibling({...newSibling, education_level: e.target.value})}
                        placeholder="เช่น ป.6, ม.3, ปริญญาตรี"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={addSibling}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        เพิ่มพี่น้อง
                      </button>
                    </div>
                  </div>
                </div>

                {/* รายการพี่น้อง */}
                {siblings.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-4">
                      รายการพี่น้อง ({siblings.length} คน)
                    </h4>
                    
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
                          {siblings.map((sibling) => (
                            <tr key={sibling.id}>
                              <td className="px-4 py-4 text-sm text-gray-900">{sibling.national_id}</td>
                              <td className="px-4 py-4 text-sm text-gray-900">{sibling.first_name} {sibling.last_name}</td>
                              <td className="px-4 py-4 text-sm text-gray-900">
                                {new Date(sibling.birth_date).toLocaleDateString('th-TH')}
                                <br />
                                <span className="text-gray-600 text-xs">อายุ: {formatAge(sibling.birth_date)}</span>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900">{sibling.education_level || '-'}</td>
                              <td className="px-4 py-4">
                                <button
                                  type="button"
                                  onClick={() => removeSibling(sibling.id)}
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

            {/* ปุ่มส่งข้อมูลและนำทาง */}
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

        {/* คำแนะนำ */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 คำแนะนำการกรอกข้อมูล:</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• ข้อมูลที่มีเครื่องหมาย * จำเป็นต้องกรอก</li>
            <li>• เลขบัตรประชาชนต้องมี 13 หลักและไม่ซ้ำกับที่มีอยู่ในระบบ</li>
            <li>• อายุจะคำนวณอัตโนมัติจากวันเดือนปีเกิด</li>
            <li>• สามารถเพิ่มข้อมูลพี่น้องได้หลายคน</li>
            <li>• ตรวจสอบข้อมูลให้ถูกต้องก่อนบันทึก</li>
          </ul>
        </div>
      </div>
    </div>
  )
}'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AddStudent() {
  const router = useRouter()
  
  // State สำหรับเก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    grade: 4,
    section: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // ฟังก์ชันจัดการการเปลี่ยนแปลงข้อมูลในฟอร์ม
  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }))
  }

  // ฟังก์ชันบันทึกข้อมูล
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!formData.student_id || !formData.first_name || !formData.last_name || !formData.section) {
        throw new Error('กรุณากรอกข้อมูลให้ครบทุกช่อง')
      }

      // ตรวจสอบรหัสนักเรียนซ้ำ
      const { data: existingStudent } = await supabase
        .from('students')
        .select('student_id')
        .eq('student_id', formData.student_id)
        .single()

      if (existingStudent) {
        throw new Error('รหัสนักเรียนนี้มีอยู่แล้ว กรุณาใช้รหัสอื่น')
      }

      // บันทึกข้อมูลลงฐานข้อมูล
      const { data, error } = await supabase
        .from('students')
        .insert([formData])
        .select()

      if (error) {
        throw error
      }

      setSuccess(true)
      
      // รีเซ็ตฟอร์ม
      setFormData({
        student_id: '',
        first_name: '',
        last_name: '',
        grade: 4,
        section: ''
      })

      // แจ้งเตือนสำเร็จ
      setTimeout(() => {
        setSuccess(false)
      }, 3000)

    } catch (error) {
      console.error('Error adding student:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* หัวข้อและปุ่มกลับ */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="mb-4 text-blue-600 hover:text-blue-800 font-medium"
          >
            ← กลับหน้าหลัก
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            เพิ่มข้อมูลนักเรียนใหม่
          </h1>
          <p className="text-gray-600">
            กรอกข้อมูลนักเรียนใหม่ลงในระบบ
          </p>
        </div>

        {/* แสดงข้อความสำเร็จ */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-800 font-medium">
              ✅ บันทึกข้อมูลนักเรียนเรียบร้อยแล้ว
            </div>
          </div>
        )}

        {/* แสดงข้อความผิดพลาด */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800 font-medium">
              ❌ {error}
            </div>
          </div>
        )}

        {/* ฟอร์ม */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* รหัสนักเรียน */}
            <div>
              <label htmlFor="student_id" className="block text-sm font-medium text-gray-700 mb-2">
                รหัสนักเรียน *
              </label>
              <input
                type="text"
                id="student_id"
                name="student_id"
                value={formData.student_id}
                onChange={handleChange}
                placeholder="ตัวอย่าง: 001, 002"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* ชื่อ */}
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อ *
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="ชื่อนักเรียน"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* นามสกุล */}
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                นามสกุล *
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="นามสกุลนักเรียน"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* ชั้นเรียน */}
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                ชั้นเรียน *
              </label>
              <select
                id="grade"
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
              <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-2">
                ห้อง *
              </label>
              <input
                type="text"
                id="section"
                name="section"
                value={formData.section}
                onChange={handleChange}
                placeholder="ตัวอย่าง: 1, 2, A, B"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* ปุ่มส่งข้อมูล */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                ยกเลิก
              </button>
            </div>
            
          </form>
        </div>

        {/* คำแนะนำ */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 คำแนะนำการกรอกข้อมูล:</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• รหัสนักเรียนต้องไม่ซ้ำกัน</li>
            <li>• ช่องที่มีเครื่องหมาย * จำเป็นต้องกรอก</li>
            <li>• ตรวจสอบข้อมูลให้ถูกต้องก่อนบันทึก</li>
          </ul>
        </div>
      </div>
    </div>
  )
}