// ฟังก์ชันคำนวณอายุแบบละเอียด (ปี เดือน วัน)
export const calculateAge = (birthDate) => {
  if (!birthDate) return null
  
  const birth = new Date(birthDate)
  const today = new Date()
  
  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  let days = today.getDate() - birth.getDate()
  
  // ปรับเดือนและปีถ้าวันยังไม่ถึง
  if (days < 0) {
    months--
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    days += lastMonth.getDate()
  }
  
  // ปรับปีถ้าเดือนยังไม่ถึง
  if (months < 0) {
    years--
    months += 12
  }
  
  return { years, months, days }
}

// ฟังก์ชันแสดงอายุเป็นข้อความ
export const formatAge = (birthDate) => {
  const age = calculateAge(birthDate)
  if (!age) return '-'
  
  const parts = []
  if (age.years > 0) parts.push(`${age.years} ปี`)
  if (age.months > 0) parts.push(`${age.months} เดือน`)
  if (age.days > 0) parts.push(`${age.days} วัน`)
  
  return parts.length > 0 ? parts.join(' ') : '0 วัน'
}

// ฟังก์ชันแปลงวันที่เป็นรูปแบบไทย
export const formatThaiDate = (date) => {
  if (!date) return '-'
  
  const options = {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    locale: 'th-TH'
  }
  
  return new Date(date).toLocaleDateString('th-TH', options)
}

// ฟังก์ชันแปลงวันที่สำหรับ input date
export const formatDateForInput = (date) => {
  if (!date) return ''
  
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

// ฟังก์ชันตรวจสอบเลขบัตรประชาชน (แค่ 13 หลัก)
export const validateNationalId = (nationalId) => {
  if (!nationalId) {
    return { isValid: false, message: 'กรุณากรอกเลขบัตรประจำตัวประชาชน' }
  }

  // ลบช่องว่างและขีดออก
  const cleanId = nationalId.replace(/[\s-]/g, '')

  // ตรวจสอบความยาว
  if (cleanId.length !== 13) {
    return { isValid: false, message: 'เลขบัตรประจำตัวประชาชนต้องมี 13 หลัก' }
  }

  // ตรวจสอบว่าเป็นตัวเลขทั้งหมด
  if (!/^\d{13}$/.test(cleanId)) {
    return { isValid: false, message: 'เลขบัตรประจำตัวประชาชนต้องเป็นตัวเลขเท่านั้น' }
  }

  return { isValid: true, message: 'เลขบัตรประชาชนถูกต้อง' }
}
// ฟังก์ชันตรวจสอบวันที่ไม่เกินปัจจุบัน
export const validateBirthDate = (birthDate) => {
  if (!birthDate) {
    return { isValid: false, message: 'กรุณาระบุวันเดือนปีเกิด' }
  }
  
  const birth = new Date(birthDate)
  const today = new Date()
  
  if (birth > today) {
    return { isValid: false, message: 'วันเดือนปีเกิดไม่สามารถเป็นอนาคตได้' }
  }
  
  // ตรวจสอบอายุไม่เกิน 100 ปี
  const age = calculateAge(birthDate)
  if (age && age.years > 100) {
    return { isValid: false, message: 'วันเดือนปีเกิดไม่สมเหตุสมผล' }
  }
  
  return { isValid: true, message: 'วันเดือนปีเกิดถูกต้อง' }
}

// ฟังก์ชันตรวจสอบเบอร์โทรศัพท์
export const validatePhoneNumber = (phone) => {
  if (!phone) return { isValid: true, message: '' } // เบอร์โทรเป็น optional
  
  // รูปแบบเบอร์โทรไทย: 08xxxxxxxx, 09xxxxxxxx, 02xxxxxxx, etc.
  const phoneRegex = /^(\+66|66|0)([0-9]{8,9})$/
  
  if (!phoneRegex.test(phone.replace(/[-\s]/g, ''))) {
    return { isValid: false, message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง' }
  }
  
  return { isValid: true, message: 'เบอร์โทรศัพท์ถูกต้อง' }
}