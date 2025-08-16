'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminUsers() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // ฟอร์มเพิ่มผู้ใช้ใหม่
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'teacher'
  })

  // ตรวจสอบสิทธิ์แอดมิน
  useEffect(() => {
    checkAdminAccess()
    fetchUsers()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('approved', true)
        .single()

      if (!userRole || userRole.role !== 'admin') {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้')
        router.push('/')
        return
      }

      setCurrentUser(userRole)
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/')
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // สร้างผู้ใช้ใหม่ในระบบ Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true
      })

      if (authError) throw authError

      // เพิ่มข้อมูลบทบาทในตาราง user_roles
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: authData.user.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          approved: true
        }])

      if (roleError) throw roleError

      alert('เพิ่มผู้ใช้ใหม่สำเร็จ')
      setNewUser({ email: '', password: '', name: '', role: 'teacher' })
      setShowAddForm(false)
      fetchUsers()

    } catch (error) {
      console.error('Error adding user:', error)
      alert(`เกิดข้อผิดพลาด: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId)

      if (error) throw error

      alert('อัพเดทบทบาทสำเร็จ')
      fetchUsers()
    } catch (error) {
      console.error('Error updating role:', error)
      alert(`เกิดข้อผิดพลาด: ${error.message}`)
    }
  }

  const handleToggleApproval = async (userId, currentApproval) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ approved: !currentApproval })
        .eq('user_id', userId)

      if (error) throw error

      alert(currentApproval ? 'ระงับผู้ใช้สำเร็จ' : 'อนุมัติผู้ใช้สำเร็จ')
      fetchUsers()
    } catch (error) {
      console.error('Error toggling approval:', error)
      alert(`เกิดข้อผิดพลาด: ${error.message}`)
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`คุณต้องการลบผู้ใช้ "${userName}" หรือไม่?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) {
      return
    }

    try {
      // ลบจากตาราง user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)

      if (roleError) throw roleError

      // ลบผู้ใช้จากระบบ Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      if (authError) throw authError

      alert('ลบผู้ใช้สำเร็จ')
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert(`เกิดข้อผิดพลาด: ${error.message}`)
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">กำลังโหลดข้อมูล...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* หัวข้อและนำทาง */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <button
              onClick={() => router.push('/')}
              className="mb-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              ← กลับหน้าหลัก
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              จัดการผู้ใช้งาน
            </h1>
            <p className="text-gray-600">
              จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึง
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + เพิ่มผู้ใช้ใหม่
          </button>
        </div>

        {/* ฟอร์มเพิ่มผู้ใช้ */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">เพิ่มผู้ใช้ใหม่</h2>
            
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  อีเมล *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสผ่าน *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อ-นามสกุล *
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  บทบาท *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                  <option value="teacher">ครูผู้สอน (Teacher)</option>
                  <option value="viewer">ผู้ดูข้อมูล (Viewer)</option>
                </select>
              </div>

              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {loading ? 'กำลังเพิ่ม...' : 'เพิ่มผู้ใช้'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ตารางผู้ใช้ */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              รายชื่อผู้ใช้งาน ({users.length} คน)
            </h2>
          </div>

          {users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              ยังไม่มีข้อมูลผู้ใช้
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ชื่อ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      อีเมล
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      บทบาท
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      การจัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user, index) => (
                    <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.user_id, e.target.value)}
                          disabled={user.user_id === currentUser?.user_id}
                          className="text-xs px-2 py-1 border border-gray-300 rounded"
                        >
                          <option value="admin">Admin</option>
                          <option value="teacher">Teacher</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          user.approved 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.approved ? 'อนุมัติแล้ว' : 'รออนุมัติ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          {user.user_id !== currentUser?.user_id && (
                            <>
                              <button
                                onClick={() => handleToggleApproval(user.user_id, user.approved)}
                                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                  user.approved
                                    ? 'bg-red-100 hover:bg-red-200 text-red-700'
                                    : 'bg-green-100 hover:bg-green-200 text-green-700'
                                }`}
                              >
                                {user.approved ? 'ระงับ' : 'อนุมัติ'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.user_id, user.name)}
                                className="px-2 py-1 text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                              >
                                ลบ
                              </button>
                            </>
                          )}
                          {user.user_id === currentUser?.user_id && (
                            <span className="px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded">
                              (คุณ)
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* คำอธิบายบทบาท */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-3">📋 คำอธิบายบทบาท:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <strong>🔧 Admin (ผู้ดูแลระบบ):</strong><br/>
              • จัดการผู้ใช้ได้<br/>
              • เพิ่ม/แก้ไข/ลบข้อมูลนักเรียนได้<br/>
              • เข้าถึงทุกฟีเจอร์
            </div>
            <div>
              <strong>👨‍🏫 Teacher (ครูผู้สอน):</strong><br/>
              • เพิ่ม/แก้ไขข้อมูลนักเรียนได้<br/>
              • ดูข้อมูลทั้งหมด<br/>
              • ไม่สามารถจัดการผู้ใช้
            </div>
            <div>
              <strong>👁️ Viewer (ผู้ดูข้อมูล):</strong><br/>
              • ดูข้อมูลนักเรียนได้อย่างเดียว<br/>
              • ไม่สามารถแก้ไขข้อมูล<br/>
              • เหมาะสำหรับผู้ปกครอง/แขก
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}