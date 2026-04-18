'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, Link } from '@/lib/router'
import { Menu, X, Heart, Home, Calendar, Users, Award, Image, Music, DollarSign, Phone, ShoppingBag, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

const defaultNavLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/foundation', label: 'Foundation', icon: Award },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/gallery', label: 'Gallery', icon: Image },
  { href: '/artists', label: 'Artists', icon: Music },
  { href: '/donate', label: 'Donate', icon: DollarSign },
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/contact', label: 'Contact', icon: Phone },
  { href: '/track-order', label: 'Track Order', icon: Truck },
]

// Icon lookup map
const iconMap: Record<string, any> = { Home, Calendar, Award, Users, Image, Music, DollarSign, ShoppingBag, Phone, Truck }

export default function Navbar() {
  const { path } = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const [navLinks, setNavLinks] = useState(defaultNavLinks)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(settings => {
      try {
        const parsed = JSON.parse(settings.nav_links || '[]')
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNavLinks(parsed.map((link: {label: string, href: string}) => ({
            href: link.href,
            label: link.label,
            icon: iconMap[link.label?.replace(/[^a-zA-Z]/g, '')] || Home,
          })))
        }
      } catch {}
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Set portal target to document body after mount
  useEffect(() => {
    setPortalTarget(document.body)
  }, [])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const handleNavigate = useCallback(() => {
    setMobileOpen(false)
  }, [])

  // Close mobile menu on route change (using event listener pattern)
  useEffect(() => {
    const handler = () => setMobileOpen(false)
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  const getActiveHref = () => {
    if (path === '/') return '/'
    if (path === '/events/:slug') return '/events'
    return path
  }

  const activeHref = getActiveHref()

  const drawerContent = (
    <AnimatePresence>
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-[60]"
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="lg:hidden fixed top-0 right-0 bottom-0 w-[280px] bg-white z-[70] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
                <img src="/images/logo/smgh-logo.png" alt="SMGH" className="h-8" />
                <span className="font-bold text-lg text-gray-900">
                  SM<span className="text-green-500">GH</span>
                </span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 overscroll-contain">
              {navLinks.map(link => {
                const isActive = activeHref === link.href
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'text-smgh-green bg-smgh-green/5 border-l-2 border-smgh-green'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <link.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-smgh-green' : 'text-gray-400'}`} />
                    {link.label}
                  </Link>
                )
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-100 space-y-3 flex-shrink-0">
              <Link to="/donate" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-smgh-red hover:bg-smgh-red-dark text-white rounded-xl h-11">
                  <Heart className="w-4 h-4 mr-2" /> Donate Now
                </Button>
              </Link>
              <Link to="/track-order" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full rounded-xl h-11 border-gray-200 text-gray-700 hover:bg-gray-50">
                  <Truck className="w-4 h-4 mr-2" /> Track Order
                </Button>
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img src="/images/logo/smgh-logo.png" alt="SMGH" className={`h-9 ${scrolled ? '' : 'brightness-0 invert'}`} />
              <span className={`font-bold text-lg ${scrolled ? 'text-gray-900' : 'text-white'}`}>
                SM<span className="text-green-500">GH</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => {
                const isActive = activeHref === link.href
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'text-smgh-green bg-smgh-green/5'
                        : scrolled
                          ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-2">
              <Link to="/donate">
                <Button size="sm" className="bg-smgh-red hover:bg-smgh-red-dark text-white rounded-full px-5">
                  <Heart className="w-3.5 h-3.5 mr-1.5" /> Donate
                </Button>
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Portal the drawer to document body so it's not nested inside the fixed nav */}
      {portalTarget && createPortal(drawerContent, portalTarget)}
    </>
  )
}
