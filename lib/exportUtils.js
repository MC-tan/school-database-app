import * as XLSX from 'xlsx'

// ฟังก์ชันส่งออกข้อมูลเป็น Excel
export const exportToExcel = (students, filename = 'รายชื่อนักเรียน') => {
  try {
    // เตรียมข้อมูลสำหรับ Excel
    const excelData = students.map((student, index) => ({
      'ลำดับ': index + 1,
      'รหัสนักเรียน': student.student_id,
      'ชื่อ': student.first_name,
      'นามสกุล': student.last_name,
      'ชั้นเรียน': `ป.${student.grade}`,
      'ห้อง': student.section,
      'วันที่สร้างข้อมูล': new Date(student.created_at).toLocaleDateString('th-TH')
    }))

    // สร้าง workbook และ worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // ปรับขนาดคอลัมน์
    const columnWidths = [
      { wch: 8 },   // ลำดับ
      { wch: 15 },  // รหัสนักเรียน
      { wch: 20 },  // ชื่อ
      { wch: 20 },  // นามสกุล
      { wch: 12 },  // ชั้นเรียน
      { wch: 8 },   // ห้อง
      { wch: 20 }   // วันที่สร้าง
    ]
    worksheet['!cols'] = columnWidths

    // เพิ่ม worksheet เข้า workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'รายชื่อนักเรียน')

    // สร้างชื่อไฟล์พร้อมวันที่
    const date = new Date().toLocaleDateString('th-TH')
    const fullFilename = `${filename}_${date}.xlsx`

    // ดาวน์โหลดไฟล์
    XLSX.writeFile(workbook, fullFilename)

    return { success: true, filename: fullFilename }
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    return { success: false, error: error.message }
  }
}

// ฟังก์ชันส่งออกข้อมูลที่กรองแล้ว
export const exportFilteredData = (allStudents, filters) => {
  try {
    // กรองข้อมูลตามเงื่อนไข
    let filteredStudents = [...allStudents]
    
    if (filters.searchTerm) {
      filteredStudents = filteredStudents.filter(student =>
        student.first_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        student.last_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        student.student_id.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
    }

    if (filters.selectedGrade) {
      filteredStudents = filteredStudents.filter(student => 
        student.grade === parseInt(filters.selectedGrade)
      )
    }

    if (filters.selectedSection) {
      filteredStudents = filteredStudents.filter(student => 
        student.section === filters.selectedSection
      )
    }

    // สร้างชื่อไฟล์ตามการกรอง
    let filename = 'รายชื่อนักเรียน'
    if (filters.selectedGrade && filters.selectedSection) {
      filename += `_ป${filters.selectedGrade}_ห้อง${filters.selectedSection}`
    } else if (filters.selectedGrade) {
      filename += `_ป${filters.selectedGrade}`
    } else if (filters.selectedSection) {
      filename += `_ห้อง${filters.selectedSection}`
    }
    
    if (filters.searchTerm) {
      filename += `_ค้นหา_${filters.searchTerm}`
    }

    // ส่งออกเป็น Excel
    return exportToExcel(filteredStudents, filename)
  } catch (error) {
    console.error('Error exporting filtered data:', error)
    return { success: false, error: error.message }
  }
}