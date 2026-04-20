'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Calendar, Image, Heart, Music, FileText,
  MessageSquare, Mail, Settings, LogOut, Upload, X, Menu, ChevronLeft,
  Users, UserPlus, ShoppingBag, Package, DollarSign, FilePlus2, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/rsvps', label: 'RSVPs', icon: UserPlus },
  { href: '/admin/gallery', label: 'Gallery', icon: Image },
  { href: '/admin/foundation', label: 'Foundation', icon: Heart },
  { href: '/admin/artists', label: 'Artists', icon: Music },
  { href: '/admin/team', label: 'Team', icon: Users },
  { href: '/admin/products', label: 'Products', icon: ShoppingBag },
  { href: '/admin/orders', label: 'Orders', icon: Package },
  { href: '/admin/donations', label: 'Donations', icon: DollarSign },
  { href: '/admin/pages', label: 'Pages', icon: FileText },
  { href: '/admin/custom-pages', label: 'Custom Pages', icon: FilePlus2 },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Mail },
  { href: '/admin/media', label: 'Media', icon: Upload },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/users', label: 'Users', icon: Shield },
]

function renderSidebarContent(
  pathname: string,
  sidebarOpen: boolean,
  user: { name: string; username: string; role?: string } | null,
  onCloseMobile: () => void,
  onToggleSidebar: () => void,
  onLogout: () => void
) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full gradient-green flex items-center justify-center overflow-hidden">
            <img src="/images/logo/smgh-logo.png" alt="SMGH" className="w-full h-full object-contain rounded-full" />
          </div>
          {sidebarOpen && <span className="text-white font-bold text-sm">SMGH Admin</span>}
        </Link>
        <button onClick={onCloseMobile} className="lg:hidden text-gray-400">
          <X className="w-5 h-5" />
        </button>
        <button onClick={onToggleSidebar} className="hidden lg:block text-gray-400 hover:text-white">
          <ChevronLeft className={`w-4 h-4 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto admin-scrollbar">
        {navItems.map(item => {
          // Hide Users link for non-super_admin
          if (item.href === '/admin/users' && user?.role !== 'super_admin') return null
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-smgh-green/10 text-smgh-green font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-gray-800 p-4">
        {user && sidebarOpen && (
          <div className="mb-3">
            <p className="text-white text-sm font-medium">{user.name}</p>
            <p className="text-gray-500 text-xs">@{user.username}</p>
          </div>
        )}
        <div className="flex gap-2">
          <Link href="/" className="flex-1">
            <Button variant="outline" size="sm" className="w-full border-gray-700 text-gray-300 text-xs">
              View Site
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={onLogout} className="border-red-500/30 text-red-400 text-xs">
            <LogOut className="w-3 h-3 mr-1" />
            {sidebarOpen && 'Logout'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [user, setUser] = useState<{ name: string; username: string; role?: string } | null>(null)
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    fetch('/api/auth')
      .then(res => {
        if (res.ok) return res.json()
        throw new Error('Not authenticated')
      })
      .then(data => {
        setAuthed(true)
        setUser(data.user)
        setLoading(false)
      })
      .catch(() => {
        setAuthed(false)
        setLoading(false)
      })
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', ...loginData }),
      })
      if (res.ok) {
        const data = await res.json()
        setAuthed(true)
        setUser(data.user)
      } else {
        setLoginError('Invalid credentials')
      }
    } catch {
      setLoginError('Login failed')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    setAuthed(false)
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101010] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#101010] flex items-center justify-center px-4 admin-theme">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full gradient-green mx-auto mb-4 flex items-center justify-center overflow-hidden">
              <img src="/images/logo/smgh-logo.png" alt="SMGH" className="w-full h-full object-contain rounded-full" />
            </div>
            <h1 className="text-2xl font-bold text-white">SMGH Admin</h1>
            <p className="text-gray-400 text-sm">Sign in to the CMS</p>
          </div>

          <form onSubmit={handleLogin} className="glass rounded-2xl p-6 space-y-4">
            {loginError && (
              <p className="text-red-400 text-sm text-center bg-red-400/10 rounded-lg py-2">{loginError}</p>
            )}
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Username</label>
              <input
                type="text"
                value={loginData.username}
                onChange={e => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:border-smgh-green"
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Password</label>
              <input
                type="password"
                value={loginData.password}
                onChange={e => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:border-smgh-green"
                placeholder="Enter password"
                required
              />
            </div>
            <Button type="submit" className="w-full gradient-green text-white font-semibold py-6">
              Sign In
            </Button>
            <p className="text-gray-500 text-xs text-center">Sign in with your admin credentials</p>
          </form>
        </motion.div>
      </div>
    )
  }

  const closeMobile = () => setMobileOpen(false)
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  const sidebar = renderSidebarContent(pathname, sidebarOpen, user, closeMobile, toggleSidebar, handleLogout)

  return (
    <div className="min-h-screen bg-[#101010] flex admin-theme">
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 256 : 72 }}
        transition={{ duration: 0.3 }}
        className="hidden lg:block fixed left-0 top-0 bottom-0 bg-[#0a0a0a] border-r border-gray-800 z-30"
      >
        {sidebar}
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={closeMobile} />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#0a0a0a] border-r border-gray-800 z-50"
          >
            {sidebar}
          </motion.aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 transition-all duration-300 lg:ml-0" style={{ marginLeft: sidebarOpen ? 256 : 72 }}>
        {/* Top Bar */}
        <header className="sticky top-0 z-20 glass-strong px-4 md:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <Link href="/">
              <span className="text-gray-400 hover:text-white text-sm transition-colors">Visit Site →</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
