'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function EditStudent() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id
  
  // State สำหรับเก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    grade: 4,
    section: ''
  })
  
  const [originalStudentId, setOriginalStudentId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // ฟังก์ชันดึงข้อมูลนักเรียนที่จะแก้ไข
  const fetchStudent = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error('ไม่พบข้อมูลนักเรียน')
      }

      setFormData({
        student_id: data.student_id,
        first_name: data.first_name,
        last_name: data.last_name,
        grade: data.grade,
        section: data.section
      })
      
      setOriginalStudentId(data.student_id)

    } catch (error) {
      console.error('Error fetching student:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // ดึงข้อมูลเมื่อหน้าโหลด
  useEffect(() => {
    if (studentId) {
      fetchStudent()
    }
  }, [studentId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ฟังก์ชันจัดการการเปลี่ยนแปลงข้อมูลในฟอร์ม
  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }))
  }

  // ฟังก์ชันบันทึกข้อมูลที่แก้ไข
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!formData.student_id || !formData.first_name || !formData.last_name || !formData.section) {
        throw new Error('กรุณากรอกข้อมูลให้ครบทุกช่อง')
      }

      // ตรวจสอบรหัสนักเรียนซ้ำ (เฉพาะกรณีที่เปลี่ยนรหัส)
      if (formData.student_id !== originalStudentId) {
        const { data: existingStudent } = await supabase
          .from('students')
          .select('student_id')
          .eq('student_id', formData.student_id)
          .single()

        if (existingStudent) {
          throw new Error('รหัสนักเรียนนี้มีอยู่แล้ว กรุณาใช้รหัสอื่น')
        }
      }

      // อัพเดทข้อมูลในฐานข้อมูล
      const { data, error } = await supabase
        .from('students')
        .update({
          student_id: formData.student_id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          grade: formData.grade,
          section: formData.section
        })
        .eq('id', studentId)
        .select()

      if (error) {
        throw error
      }

      setSuccess(true)
      
      // แจ้งเตือนสำเร็จแล้วกลับหน้าหลัก
      setTimeout(() => {
        router.push('/')
      }, 1500)

    } catch (error) {
      console.error('Error updating student:', error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  // แสดงหน้าโหลด
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">กำลังโหลดข้อมูล...</div>
          </div>
        </div>
      </div>
    )
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
            แก้ไขข้อมูลนักเรียน
          </h1>
          <p className="text-gray-600">
            แก้ไขข้อมูลนักเรียน: {formData.first_name} {formData.last_name}
          </p>
        </div>

        {/* แสดงข้อความสำเร็จ */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-800 font-medium">
              ✅ บันทึกการแก้ไขเรียบร้อยแล้ว กำลังกลับหน้าหลัก...
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
              {formData.student_id !== originalStudentId && (
                <p className="mt-1 text-sm text-amber-600">
                  ⚠️ คุณกำลังเปลี่ยนรหัสนักเรียนจาก &quot;{originalStudentId}&quot; เป็น &quot;{formData.student_id}&quot;
                </p>
              )}
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
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
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
          <h3 className="font-medium text-blue-900 mb-2">💡 คำแนะนำการแก้ไข:</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• การเปลี่ยนรหัสนักเรียนจะตรวจสอบว่าซ้ำกับรหัสอื่นหรือไม่</li>
            <li>• ตรวจสอบข้อมูลให้ถูกต้องก่อนบันทึก</li>
            <li>• การแก้ไขจะมีผลทันทีหลังบันทึก</li>
          </ul>
        </div>
      </div>
    </div>
  )
}