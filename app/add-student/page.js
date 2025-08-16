'use client'

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