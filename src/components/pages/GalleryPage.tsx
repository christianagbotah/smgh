'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Filter, X } from 'lucide-react'

interface GalleryItem {
  id: string
  title: string | null
  description: string | null
  type: string
  url: string
  thumbnail: string | null
  year: number | null
  category: string | null
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)
  const [lightboxIdx, setLightboxIdx] = useState(0)

  useEffect(() => {
    fetch('/api/gallery?limit=100')
      .then(r => r.json())
      .then(data => { setItems(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const years = ['all', ...Array.from(new Set(items.map(i => i.year).filter(Boolean) as number[])).sort((a, b) => b - a)]
  const categories = ['all', 'event', 'foundation', 'team', 'general']

  const filtered = items.filter(i => {
    if (yearFilter !== 'all' && i.year !== parseInt(yearFilter)) return false
    if (categoryFilter !== 'all' && i.category !== categoryFilter) return false
    return true
  })

  const openLightbox = (idx: number) => {
    setLightboxIdx(idx)
    setLightboxImg(filtered[idx]?.url)
  }

  const closeLightbox = () => {
    setLightboxImg(null)
    setLightboxIdx(0)
  }

  const nextImg = () => {
    const next = (lightboxIdx + 1) % filtered.length
    setLightboxIdx(next)
    setLightboxImg(filtered[next]?.url)
  }

  const prevImg = () => {
    const prev = (lightboxIdx - 1 + filtered.length) % filtered.length
    setLightboxIdx(prev)
    setLightboxImg(filtered[prev]?.url)
  }

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
  const item = { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Hero */}
      <section className="relative bg-smgh-dark py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-smgh-red-dark/30 via-smgh-dark to-smgh-green-dark/20" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <motion.h1 variants={item} className="text-4xl md:text-5xl font-bold text-white mb-4">Gallery</motion.h1>
          <motion.p variants={item} className="text-gray-400 text-lg max-w-2xl mx-auto">
            Moments captured from our events, outreach programs, and community activities
          </motion.p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 px-4 bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Filter className="w-4 h-4" /> Filters:
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
                  categoryFilter === c ? 'bg-smgh-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="hidden sm:block w-px h-6 bg-gray-200" />
          <div className="flex flex-wrap gap-2">
            {years.map(y => (
              <button
                key={y}
                onClick={() => setYearFilter(y.toString())}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  yearFilter === y ? 'bg-smgh-red text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {y === 'all' ? 'All Years' : y}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-10 px-4">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(12)].map((_, i) => <div key={i} className="aspect-[4/3] sm:aspect-square bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filtered.map((gi, idx) => (
                <motion.div
                  key={gi.id}
                  variants={item}
                  className="relative rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer bg-gray-100"
                  onClick={() => openLightbox(idx)}
                >
                  <img
                    src={gi.thumbnail || gi.url}
                    alt={gi.title || 'Gallery'}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end p-3">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity w-full">
                      {gi.title && <p className="text-white text-sm font-medium truncate">{gi.title}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        {gi.year && <span className="text-gray-300 text-xs">{gi.year}</span>}
                        {gi.category && <span className="text-gray-300 text-xs capitalize">{gi.category}</span>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">No gallery items found</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxImg && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <button className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" onClick={closeLightbox}>
            <X className="w-6 h-6" />
          </button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" onClick={e => { e.stopPropagation(); prevImg() }}>
            ←
          </button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" onClick={e => { e.stopPropagation(); nextImg() }}>
            →
          </button>
          <img src={lightboxImg} alt="Gallery" className="max-w-[92vw] sm:max-w-[90vw] max-h-[80vh] sm:max-h-[85vh] object-contain" onClick={e => e.stopPropagation()} />
          <div className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm">
            {lightboxIdx + 1} / {filtered.length}
          </div>
        </div>
      )}
    </motion.div>
  )
}
