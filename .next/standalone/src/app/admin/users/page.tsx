'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, UserPlus, Shield, ShieldCheck, Trash2, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { fetchJSON, fetchJSONOrNull, fetchWrite, ensureArray } from '@/lib/fetch-helpers'
import { useConfirm } from '@/hooks/useConfirm'
import PageLoadingOverlay from '@/components/admin/PageLoadingOverlay'

interface AdminUser {
  id: string
  username: string
  name: string
  role: string
  active: boolean
  createdAt: string
}

interface AuthUser {
  name: string
  username: string
  role?: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [adding, setAdding] = useState(false)
  const { toast } = useToast()
  const { confirm } = useConfirm()

  // New user form
  const [newName, setNewName] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('editor')

  const fetchUsers = useCallback(async () => {
    try {
      const data = await fetchJSON('/api/users')
      setUsers(ensureArray(data))
    } catch (err: any) {
      if (err?.message?.includes('403')) {
        // Not authorized — user is not super_admin
        const authData = await fetchJSONOrNull('/api/auth')
        setCurrentUser(authData?.user || null)
      } else {
        toast({ title: 'Failed to load users', variant: 'destructive' })
      }
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    // First get auth info, then fetch users
    fetchJSONOrNull('/api/auth').then(data => {
      if (data?.user) setCurrentUser(data.user)
    })
    fetchUsers()
  }, [fetchUsers])

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newUsername || !newPassword) {
      toast({ title: 'All fields are required', variant: 'destructive' })
      return
    }
    if (newPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' })
      return
    }

    setAdding(true)
    try {
      const { ok, data } = await fetchWrite('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword, name: newName, role: newRole }),
      })
      if (ok) {
        toast({ title: 'User created successfully' })
        setNewName('')
        setNewUsername('')
        setNewPassword('')
        setNewRole('editor')
        setShowAddForm(false)
        fetchUsers()
      } else {
        toast({ title: data?.error || 'Failed to create user', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to create user', variant: 'destructive' })
    } finally {
      setAdding(false)
    }
  }

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'super_admin' ? 'editor' : 'super_admin'
    const { ok, data } = await fetchWrite(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    if (ok) {
      toast({ title: `Role updated to ${newRole === 'super_admin' ? 'Super Admin' : 'Editor'}` })
      fetchUsers()
    } else {
      toast({ title: data?.error || 'Failed to update role', variant: 'destructive' })
    }
  }

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    const { ok, data } = await fetchWrite(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !currentActive }),
    })
    if (ok) {
      toast({ title: `User ${currentActive ? 'deactivated' : 'activated'}` })
      fetchUsers()
    } else {
      toast({ title: data?.error || 'Failed to update status', variant: 'destructive' })
    }
  }

  const handleDelete = async (userId: string) => {
    const confirmed = await confirm({
      title: 'Delete User',
      description: 'Are you sure you want to delete this user? This action cannot be undone.',
      variant: 'danger',
    })
    if (!confirmed) return

    const { ok, data } = await fetchWrite(`/api/users/${userId}`, { method: 'DELETE' })
    if (ok) {
      toast({ title: 'User deleted' })
      fetchUsers()
    } else {
      toast({ title: data?.error || 'Failed to delete user', variant: 'destructive' })
    }
  }

  // Not a super_admin — show access denied
  if (currentUser && currentUser.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass rounded-2xl p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 text-sm">
            You don&apos;t have permission to manage users. Only Super Admins can access this page.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="glass rounded-xl p-6 h-12" />
        <div className="glass rounded-xl p-6 h-64" />
      </div>
    )
  }

  return (
    <div>
      <PageLoadingOverlay visible={adding} message="Creating user..." />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-smgh-green" />
            Admin Users
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage admin accounts, roles and permissions</p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant="success"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="glass rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-smgh-green" />
              Create New Admin
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleAddUser} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Full Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-smgh-green"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-smgh-green"
                placeholder="johndoe"
                required
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-smgh-green"
                placeholder="Min 6 characters"
                required
                minLength={6}
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-gray-400 text-xs mb-1 block">Role</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-smgh-green appearance-none"
                >
                  <option value="editor" className="bg-[#1a1a1a]">Editor</option>
                  <option value="super_admin" className="bg-[#1a1a1a]">Super Admin</option>
                </select>
              </div>
              <Button type="submit" disabled={adding} variant="success" className="px-6">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="glass rounded-xl overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 text-xs font-medium px-6 py-4 uppercase tracking-wider">Name</th>
                <th className="text-left text-gray-400 text-xs font-medium px-6 py-4 uppercase tracking-wider">Username</th>
                <th className="text-left text-gray-400 text-xs font-medium px-6 py-4 uppercase tracking-wider">Role</th>
                <th className="text-left text-gray-400 text-xs font-medium px-6 py-4 uppercase tracking-wider">Status</th>
                <th className="text-left text-gray-400 text-xs font-medium px-6 py-4 uppercase tracking-wider">Created</th>
                <th className="text-right text-gray-400 text-xs font-medium px-6 py-4 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No admin users found</p>
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-smgh-green/30 to-smgh-teal/30 flex items-center justify-center text-white text-xs font-bold">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span className="text-white text-sm font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 text-sm">@{user.username}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleRole(user.id, user.role)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                          user.role === 'super_admin'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                            : 'bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-gray-500/20'
                        }`}
                        title="Click to toggle role"
                      >
                        {user.role === 'super_admin' ? (
                          <>
                            <ShieldCheck className="w-3 h-3" />
                            Super Admin
                          </>
                        ) : (
                          <>
                            <Shield className="w-3 h-3" />
                            Editor
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(user.id, user.active)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                          user.active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                        }`}
                        title="Click to toggle status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        {user.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-500 text-sm">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(user.id)}
                        disabled={user.username === currentUser?.username}
                        className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 h-7 px-2 disabled:opacity-20 disabled:cursor-not-allowed"
                        title={user.username === currentUser?.username ? "Can't delete yourself" : 'Delete user'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-800/50">
          {users.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No admin users found</p>
            </div>
          ) : (
            users.map(user => (
              <div key={user.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-smgh-green/30 to-smgh-teal/30 flex items-center justify-center text-white text-xs font-bold">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{user.name}</p>
                      <p className="text-gray-500 text-xs">@{user.username}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(user.id)}
                    disabled={user.username === currentUser?.username}
                    className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0 disabled:opacity-20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleToggleRole(user.id, user.role)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      user.role === 'super_admin'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}
                  >
                    {user.role === 'super_admin' ? (
                      <><ShieldCheck className="w-3 h-3" />Super Admin</>
                    ) : (
                      <><Shield className="w-3 h-3" />Editor</>
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleActive(user.id, user.active)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      user.active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    {user.active ? 'Active' : 'Inactive'}
                  </button>
                  <span className="text-gray-600 text-xs ml-auto">
                    {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="glass rounded-xl p-4">
          <p className="text-gray-500 text-xs">Total Users</p>
          <p className="text-white text-2xl font-bold mt-1">{users.length}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-gray-500 text-xs">Super Admins</p>
          <p className="text-amber-400 text-2xl font-bold mt-1">{users.filter(u => u.role === 'super_admin').length}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-gray-500 text-xs">Active Users</p>
          <p className="text-emerald-400 text-2xl font-bold mt-1">{users.filter(u => u.active).length}</p>
        </div>
      </div>
    </div>
  )
}
