'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { formatAge } from '../../../lib/dateUtils'

// ฟังก์ชัน formatThaiDate (เผื่อยังไม่มีใน dateUtils)
const formatThaiDate = (date) => {
  if (!date) return '-'
  
  try {
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return date
  }
}

export default function StudentDetail({ params }) {
  const router = useRouter()
  const studentId = params.id

  const [student, setStudent] = useState(null)
  const [siblings, setSiblings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (studentId) {
      loadStudentData()
    }
  }, [studentId])

  const loadStudentData = async () => {
    try {
      setLoading(true)

      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()

      if (studentError) {
        if (studentError.code === 'PGRST116') {
          throw new Error('ไม่พบข้อมูลนักเรียนที่ระบุ')
        }
        throw studentError
      }

      setStudent(studentData)

      const { data: siblingsData } = await supabase
        .from('siblings')
        .select('*')
        .eq('student_id', studentId)
        .order('birth_date', { ascending: false })

      setSiblings(siblingsData || [])

    } catch (err) {
      console.error('Error loading student data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลนักเรียน...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-600 text-lg font-medium mb-4">⚠️ เกิดข้อผิดพลาด</div>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              กลับหน้าหลัก
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="mb-4 text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            ← กลับหน้าหลัก
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ข้อมูลนักเรียน
              </h1>
              <p className="text-gray-600">
                {student?.title}{student?.first_name} {student?.last_name}
              </p>
            </div>
            <a
              href="/add-student?mode=edit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              ✏️ แก้ไขข้อมูล
            </a>
          </div>
        </div>

        {/* ข้อมูลพื้นฐาน */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">ข้อมูลพื้นฐาน</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* รูปภาพ */}
              <div className="flex justify-center">
                {student?.photo_url ? (
                  <div className="text-center">
                    <img
                      src={student.photo_url}
                      alt={`รูป${student.first_name}`}
                      className="w-40 h-40 object-cover rounded-lg border-2 border-gray-200 shadow-md"
                      onError={(e) => {
                        console.error('Error loading image:', student.photo_url)
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                    <div 
                      className="w-40 h-40 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center" 
                      style={{display: 'none'}}
                    >
                      <div className="text-center">
                        <span className="text-gray-400 text-sm block">ไม่สามารถโหลดรูปได้</span>
                        <span className="text-xs text-gray-300">URL อาจมีปัญหา</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 break-all">
                      {student.photo_url.length > 50 ? 
                        `${student.photo_url.substring(0, 50)}...` : 
                        student.photo_url
                      }
                    </p>
                  </div>
                ) : (
                  <div className="w-40 h-40 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-gray-400 text-sm">ไม่มีรูปภาพ</span>
                      <span className="text-xs text-gray-300 block mt-1">photo_url เป็น null</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* ข้อมูลหลัก */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">เลขบัตรประชาชน</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{student?.national_id}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">รหัสนักเรียน</label>
                  <p className="mt-1 text-sm text-gray-900">{student?.student_id || '-'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">คำนำหน้า</label>
                  <p className="mt-1 text-sm text-gray-900">{student?.title}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">ชื่อ</label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">{student?.first_name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">นามสกุล</label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">{student?.last_name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">ชั้นเรียน/ห้อง</label>
                  <p className="mt-1 text-sm text-gray-900">ป.{student?.grade} {student?.section && `/ ${student.section}`}</p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">วันเดือนปีเกิด</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatThaiDate(student?.birth_date)}
                    {student?.birth_date && (
                      <span className="block text-xs text-gray-600">
                        อายุ: {formatAge(student.birth_date)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            {/* ที่อยู่ */}
            {student?.address && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700">ที่อยู่</label>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{student.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* ข้อมูลบิดา */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">ข้อมูลบิดา</h2>
          </div>
          <div className="p-6">
            {student?.father_first_name || student?.father_last_name ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">
                    {student?.father_first_name} {student?.father_last_name}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">เลขบัตรประชาชน</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{student?.father_national_id || '-'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">วันเดือนปีเกิด</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatThaiDate(student?.father_birth_date)}
                    {student?.father_birth_date && (
                      <span className="block text-xs text-gray-600">
                        อายุ: {formatAge(student.father_birth_date)}
                      </span>
                    )}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                  <p className="mt-1 text-sm text-gray-900">{student?.father_phone || '-'}</p>
                </div>
                
                {student?.father_address && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">ที่อยู่</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{student.father_address}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">ไม่มีข้อมูลบิดา</p>
            )}
          </div>
        </div>

        {/* ข้อมูลมารดา */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">ข้อมูลมารดา</h2>
          </div>
          <div className="p-6">
            {student?.mother_first_name || student?.mother_last_name ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">
                    {student?.mother_first_name} {student?.mother_last_name}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">เลขบัตรประชาชน</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{student?.mother_national_id || '-'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">วันเดือนปีเกิด</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatThaiDate(student?.mother_birth_date)}
                    {student?.mother_birth_date && (
                      <span className="block text-xs text-gray-600">
                        อายุ: {formatAge(student.mother_birth_date)}
                      </span>
                    )}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                  <p className="mt-1 text-sm text-gray-900">{student?.mother_phone || '-'}</p>
                </div>
                
                {student?.mother_address && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">ที่อยู่</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{student.mother_address}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">ไม่มีข้อมูลมารดา</p>
            )}
          </div>
        </div>

        {/* ข้อมูลพี่น้อง */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              ข้อมูลพี่น้อง {siblings.length > 0 && `(${siblings.length} คน)`}
            </h2>
          </div>
          <div className="p-6">
            {siblings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        เลขบัตรประชาชน
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        ชื่อ-นามสกุล
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        วันเดือนปีเกิด
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        การศึกษา
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {siblings.map((sibling, index) => (
                      <tr key={sibling.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-4 text-sm text-gray-900 font-mono">
                          {sibling.national_id}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                          {sibling.first_name} {sibling.last_name}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {formatThaiDate(sibling.birth_date)}
                          {sibling.birth_date && (
                            <>
                              <br />
                              <span className="text-xs text-gray-600">
                                อายุ: {formatAge(sibling.birth_date)}
                              </span>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {sibling.education_level || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">ไม่มีข้อมูลพี่น้อง</p>
            )}
          </div>
        </div>

        {/* ข้อมูลระบบ */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">ข้อมูลระบบ</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">วันที่สร้างข้อมูล</label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatThaiDate(student?.created_at)}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">วันที่แก้ไขล่าสุด</label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatThaiDate(student?.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ปุ่มการจัดการ */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push('/')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            กลับหน้าหลัก
          </button>
          
          <a
            href="/add-student?mode=edit"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            ✏️ แก้ไขข้อมูล
          </a>
          
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            🖨️ พิมพ์ข้อมูล
          </button>
        </div>
      </div>
    </div>
  )
}