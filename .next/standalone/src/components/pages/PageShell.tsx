'use client'

import { useRouter } from '@/lib/router'
import { AnimatePresence, motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import CustomPageRenderer from '@/components/pages/CustomPageRenderer'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import HomePage from '@/components/pages/HomePage'
import EventsPage from '@/components/pages/EventsPage'
import EventDetailPage from '@/components/pages/EventDetailPage'
import FoundationPage from '@/components/pages/FoundationPage'
import TeamPage from '@/components/pages/TeamPage'
import GalleryPage from '@/components/pages/GalleryPage'
import ArtistsPage from '@/components/pages/ArtistsPage'
import DonatePage from '@/components/pages/DonatePage'
import ContactPage from '@/components/pages/ContactPage'
import ShopPage from '@/components/pages/ShopPage'
import OrderTrackingPage from '@/components/pages/OrderTrackingPage'

const RESERVED_PATHS = ['/', '/events', '/events/:slug', '/foundation', '/team', '/gallery', '/artists', '/donate', '/contact', '/shop', '/track-order']

export function PageShell() {
  const { path } = useRouter()
  const [customPages, setCustomPages] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/custom-pages?status=published')
      .then(r => r.json())
      .then(pages => setCustomPages(pages.map((p: { slug: string }) => p.slug)))
      .catch(() => {})
  }, [])

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [path])

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={path}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {path === '/' && <HomePage />}
            {path === '/events' && <EventsPage />}
            {path === '/events/:slug' && <EventDetailPage />}
            {path === '/foundation' && <FoundationPage />}
            {path === '/team' && <TeamPage />}
            {path === '/gallery' && <GalleryPage />}
            {path === '/artists' && <ArtistsPage />}
            {path === '/donate' && <DonatePage />}
            {path === '/contact' && <ContactPage />}
            {path === '/shop' && <ShopPage />}
            {path === '/track-order' && <OrderTrackingPage />}

            {/* Custom Pages - catch-all for any slug not reserved */}
            {!RESERVED_PATHS.includes(path) && customPages.includes(path.replace(/^\//, '')) && (
              <CustomPageRenderer slug={path.replace(/^\//, '')} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}
