'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  // State สำหรับเก็บข้อมูลนักเรียน
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // State สำหรับการค้นหาและกรอง
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedSection, setSelectedSection] = useState('')

  // ฟังก์ชันดึงข้อมูลจากฐานข้อมูล
  async function fetchStudents() {
    try {
      setLoading(true)
      
      // ดึงข้อมูลจากตาราง students
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('grade', { ascending: true })

      if (error) {
        throw error
      }

      setStudents(data || [])
      setFilteredStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // ฟังก์ชันกรองข้อมูล
  const filterStudents = () => {
    let filtered = students

    // กรองตามคำค้นหา (ชื่อ, นามสกุล, รหัสนักเรียน)
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // กรองตามชั้นเรียน
    if (selectedGrade) {
      filtered = filtered.filter(student => student.grade === parseInt(selectedGrade))
    }

    // กรองตามห้อง
    if (selectedSection) {
      filtered = filtered.filter(student => student.section === selectedSection)
    }

    setFilteredStudents(filtered)
  }

  // เรียกใช้ฟังก์ชันกรองเมื่อมีการเปลี่ยนแปลงเงื่อนไข
  useEffect(() => {
    filterStudents()
  }, [students, searchTerm, selectedGrade, selectedSection]) // eslint-disable-line react-hooks/exhaustive-deps

  // ฟังก์ชันรีเซ็ตการค้นหา
  const resetFilters = () => {
    setSearchTerm('')
    setSelectedGrade('')
    setSelectedSection('')
  }

  // ฟังก์ชันหาค่าที่ไม่ซ้ำกันสำหรับ dropdown
  const getUniqueGrades = () => {
    const grades = students.map(s => s.grade)
    return [...new Set(grades)].sort()
  }

  const getUniqueSections = () => {
    const sections = students.map(s => s.section)
    return [...new Set(sections)].sort()
  }

  // ฟังก์ชันลบข้อมูลนักเรียน
  const handleDeleteStudent = async (studentId, firstName, lastName) => {
    // ยืนยันการลบ
    const confirmDelete = window.confirm(
      `คุณต้องการลบข้อมูลนักเรียน "${firstName} ${lastName}" หรือไม่?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้`
    )

    if (!confirmDelete) {
      return
    }

    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)

      if (error) {
        throw error
      }

      // รีเฟรชข้อมูลหลังลบสำเร็จ
      await fetchStudents()
      
      alert(`ลบข้อมูลนักเรียน "${firstName} ${lastName}" เรียบร้อยแล้ว`)

    } catch (error) {
      console.error('Error deleting student:', error)
      alert(`เกิดข้อผิดพลาดในการลบข้อมูล: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // เรียกใช้ฟังก์ชันเมื่อ component โหลด
  useEffect(() => {
    fetchStudents()
  }, [])

  // แสดงข้อความขณะโหลด
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            ระบบข้อมูลนักเรียน
          </h1>
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">กำลังโหลดข้อมูล...</div>
          </div>
        </div>
      </div>
    )
  }

  // แสดงข้อความผิดพลาด
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            ระบบข้อมูลนักเรียน
          </h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">เกิดข้อผิดพลาด: {error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* หัวข้อหลัก */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ระบบข้อมูลนักเรียน
            </h1>
            <p className="text-gray-600">
              โรงเรียนบ้านมาลา ตำบลตาเนาะแมเราะ อำเภอเบตง จังหวัดยะลา
            </p>
          </div>
          <a
            href="/add-student"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + เพิ่มนักเรียนใหม่
          </a>
        </div>

        {/* สถิติรวม */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">
              {filteredStudents.length}
            </div>
            <div className="text-gray-600">
              {searchTerm || selectedGrade || selectedSection ? 'ผลการค้นหา' : 'นักเรียนทั้งหมด'}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">
              {filteredStudents.filter(s => s.grade === 4).length}
            </div>
            <div className="text-gray-600">นักเรียนชั้น ป.4</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-600">
              {filteredStudents.filter(s => s.grade === 5).length}
            </div>
            <div className="text-gray-600">นักเรียนชั้น ป.5</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-orange-600">
              {filteredStudents.filter(s => s.grade === 6).length}
            </div>
            <div className="text-gray-600">นักเรียนชั้น ป.6</div>
          </div>
        </div>

        {/* ระบบค้นหาและกรอง */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ค้นหาและกรองข้อมูล</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* ช่องค้นหา */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                ค้นหา
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ชื่อ, นามสกุล, หรือรหัสนักเรียน"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* กรองตามชั้น */}
            <div>
              <label htmlFor="grade-filter" className="block text-sm font-medium text-gray-700 mb-1">
                ชั้นเรียน
              </label>
              <select
                id="grade-filter"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">ทุกชั้น</option>
                {getUniqueGrades().map(grade => (
                  <option key={grade} value={grade}>ป.{grade}</option>
                ))}
              </select>
            </div>

            {/* กรองตามห้อง */}
            <div>
              <label htmlFor="section-filter" className="block text-sm font-medium text-gray-700 mb-1">
                ห้อง
              </label>
              <select
                id="section-filter"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">ทุกห้อง</option>
                {getUniqueSections().map(section => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
            </div>

            {/* ปุ่มรีเซ็ต */}
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                รีเซ็ต
              </button>
            </div>
          </div>

          {/* แสดงสถานะการกรอง */}
          {(searchTerm || selectedGrade || selectedSection) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>กำลังกรอง:</strong>
                {searchTerm && ` คำค้นหา "${searchTerm}"`}
                {selectedGrade && ` ชั้น ป.${selectedGrade}`}
                {selectedSection && ` ห้อง ${selectedSection}`}
                <span className="ml-2 font-medium">
                  (พบ {filteredStudents.length} จาก {students.length} คน)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ตารางแสดงข้อมูล */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              รายชื่อนักเรียน
            </h2>
          </div>
          
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {students.length === 0 ? 'ยังไม่มีข้อมูลนักเรียน' : 'ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      รหัสนักเรียน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ชื่อ-นามสกุล
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ชั้น
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ห้อง
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การจัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student, index) => (
                    <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.student_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ป.{student.grade}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.section}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex gap-2">
                          <a
                            href={`/edit-student/${student.id}`}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            แก้ไข
                          </a>
                          <button
                            onClick={() => handleDeleteStudent(student.id, student.first_name, student.last_name)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ปุ่มรีเฟรช */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchStudents}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
          </button>
        </div>
      </div>
    </div>
  )
}