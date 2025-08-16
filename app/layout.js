import { Inter } from 'next/font/google'
import './globals.css'
import AuthWrapper from '../components/AuthWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ระบบข้อมูลนักเรียน - โรงเรียนบ้านมาลา',
  description: 'ระบบจัดการข้อมูลนักเรียน โรงเรียนบ้านมาลา ตำบลตาเนาะแมเราะ อำเภอเบตง จังหวัดยะลา',
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  )
}