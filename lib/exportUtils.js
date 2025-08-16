import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

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

// ฟังก์ชันส่งออกข้อมูลเป็น PDF
export const exportToPDF = (students, filename = 'รายชื่อนักเรียน') => {
  try {
    // สร้าง PDF document
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    // กำหนดฟอนต์ (ใช้ฟอนต์ที่รองรับภาษาไทย)
    pdf.setFont('helvetica')
    
    // หัวข้อหลัก
    pdf.setFontSize(18)
    pdf.text('ระบบข้อมูลนักเรียน', 105, 20, { align: 'center' })
    
    pdf.setFontSize(14)
    pdf.text('โรงเรียนบ้านมาลา ตำบลตาเนาะแมเราะ อำเภอเบตง จังหวัดยะลา', 105, 30, { align: 'center' })
    
    // วันที่ออกรายงาน
    const currentDate = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    pdf.setFontSize(12)
    pdf.text(`วันที่ออกรายงาน: ${currentDate}`, 105, 40, { align: 'center' })
    
    // เตรียมข้อมูลสำหรับตาราง
    const tableData = students.map((student, index) => [
      (index + 1).toString(),
      student.student_id,
      student.first_name,
      student.last_name,
      `ป.${student.grade}`,
      student.section
    ])

    // สร้างตาราง
    pdf.autoTable({
      startY: 50,
      head: [['ลำดับ', 'รหัสนักเรียน', 'ชื่อ', 'นามสกุล', 'ชั้น', 'ห้อง']],
      body: tableData,
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [59, 130, 246], // สีน้ำเงิน
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // สีเทาอ่อน
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 }, // ลำดับ
        1: { cellWidth: 25 }, // รหัสนักเรียน
        2: { cellWidth: 35 }, // ชื่อ
        3: { cellWidth: 35 }, // นามสกุล
        4: { halign: 'center', cellWidth: 20 }, // ชั้น
        5: { halign: 'center', cellWidth: 15 } // ห้อง
      }
    })

    // สรุปข้อมูล
    const finalY = pdf.lastAutoTable.finalY + 15
    pdf.setFontSize(12)
    pdf.text(`จำนวนนักเรียนทั้งหมด: ${students.length} คน`, 20, finalY)
    
    // สถิติแยกตามชั้น
    const gradeStats = {}
    students.forEach(student => {
      const grade = student.grade
      gradeStats[grade] = (gradeStats[grade] || 0) + 1
    })

    let yPosition = finalY + 10
    pdf.text('สถิติแยกตามชั้นเรียน:', 20, yPosition)
    yPosition += 8
    
    Object.entries(gradeStats).forEach(([grade, count]) => {
      pdf.text(`ป.${grade}: ${count} คน`, 30, yPosition)
      yPosition += 6
    })

    // หมายเหตุ
    yPosition += 10
    pdf.setFontSize(10)
    pdf.text('หมายเหตุ: รายงานนี้สร้างโดยระบบอัตโนมัติ', 20, yPosition)

    // สร้างชื่อไฟล์พร้อมวันที่
    const date = new Date().toLocaleDateString('th-TH')
    const fullFilename = `${filename}_${date}.pdf`

    // ดาวน์โหลดไฟล์
    pdf.save(fullFilename)

    return { success: true, filename: fullFilename }
  } catch (error) {
    console.error('Error exporting to PDF:', error)
    return { success: false, error: error.message }
  }
}

// ฟังก์ชันส่งออกข้อมูลที่กรองแล้ว
export const exportFilteredData = (allStudents, filters, format = 'excel') => {
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

    // ส่งออกตามรูปแบบที่เลือก
    if (format === 'excel') {
      return exportToExcel(filteredStudents, filename)
    } else {
      return exportToPDF(filteredStudents, filename)
    }
  } catch (error) {
    console.error('Error exporting filtered data:', error)
    return { success: false, error: error.message }
  }
}