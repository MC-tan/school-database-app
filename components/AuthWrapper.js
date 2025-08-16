'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthWrapper({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(true)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ตรวจสอบสถานะการล็อกอิน
  useEffect(() => {
    // ตรวจสอบ session ปัจจุบัน
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // ฟังการเปลี่ยนแปลงสถานะ auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ฟังก์ชันล็อกอิน
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      setSuccess('เข้าสู่ระบบสำเร็จ!')
      setShowLogin(false)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // ฟังก์ชันสมัครสมาชิก
  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      setSuccess('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ')
      setIsLogin(true)
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // ฟังก์ชันออกจากระบบ
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setShowLogin(true)
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // หน้าโหลด
  if (loading && !showLogin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    )
  }

  // แสดงหน้าล็อกอินถ้ายังไม่ได้เข้าสู่ระบบ
  if (!user || showLogin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          {/* โลโก้และชื่อระบบ */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ระบบข้อมูลนักเรียน
            </h1>
            <p className="text-gray-600 text-sm">
              โรงเรียนบ้านมาลา อำเภอเบตง จังหวัดยะลา
            </p>
          </div>

          {/* ข้อความสำเร็จ */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          {/* ข้อความผิดพลาด */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* แท็บเลือกเข้าสู่ระบบ */}
          <div className="mb-6 text-center">
            <h2 className="text-lg font-semibold text-gray-900">เข้าสู่ระบบ</h2>
            <p className="text-sm text-gray-600 mt-1">
              สำหรับเจ้าหน้าที่และครูผู้สอน
            </p>
          </div>

          {/* ฟอร์มล็อกอิน */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* อีเมล */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                อีเมล
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* รหัสผ่าน */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่าน
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="รหัสผ่าน"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                minLength={6}
              />
            </div>

            {/* ยืนยันรหัสผ่าน (ลบออก) */}

            {/* ปุ่มส่งข้อมูล */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          {/* คำแนะนำ */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>🔐 สำหรับเจ้าหน้าที่:</strong><br/>
              หากยังไม่มีบัญชี กรุณาติดต่อผู้ดูแลระบบเพื่อสร้างบัญชีให้
            </p>
          </div>
        </div>
      </div>
    )
  }

  // แสดงเนื้อหาหลักพร้อมข้อมูลผู้ใช้
  return (
    <div>
      {/* Header Bar แสดงข้อมูลผู้ใช้ */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-sm text-gray-600">
            เข้าสู่ระบบในฐานะ: <span className="font-medium text-gray-900">{user.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded font-medium transition-colors"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
      
      {/* เนื้อหาหลัก */}
      {children}
    </div>
  )
}