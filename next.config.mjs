/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ปิด ESLint warnings บางอย่างในระหว่าง build
    ignoreDuringBuilds: false, // เปลี่ยนเป็น true ถ้าต้องการปิดทั้งหมด
  },
  images: {
    // ถ้าต้องการใช้ external images
    domains: ['your-supabase-project.supabase.co'], // แทนที่ด้วย domain จริง
    unoptimized: true // สำหรับ Supabase storage
  }
}

module.exports = nextConfig