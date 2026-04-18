'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Camera, Play, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GalleryItem {
  id: string
  title: string | null
  description: string | null
  type: string
  url: string
  thumbnail: string | null
  year: number | null
}

export default function Gallery() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [items, setItems] = useState<GalleryItem[]>([])
  const [activeYear, setActiveYear] = useState<string>('all')
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 8

  useEffect(() => {
    fetch('/api/gallery?limit=50')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(() => {})
  }, [])

  const years = ['all', ...Array.from(new Set(items.map(i => i.year).filter(Boolean) as number[])).sort((a, b) => b - a)]
  const filtered = activeYear === 'all' ? items : items.filter(i => i.year?.toString() === activeYear)
  const paged = filtered.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  return (
    <section id="gallery" className="py-20 md:py-32 relative overflow-hidden" ref={ref}>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-smgh-teal/30 to-transparent" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-smgh-teal/3 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-smgh-teal text-sm font-semibold uppercase tracking-widest mb-4 block">
            Memories
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Photo <span className="text-gradient-teal">Gallery</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Relive the moments from our past worship nights and events
          </p>
        </motion.div>

        {/* Year Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {years.map(year => (
            <button
              key={year}
              onClick={() => { setActiveYear(year.toString()); setCurrentPage(0) }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeYear === year
                  ? 'gradient-teal text-black'
                  : 'glass text-gray-300 hover:text-white hover:border-smgh-teal/30'
              }`}
            >
              {year === 'all' ? 'All Years' : year}
            </button>
          ))}
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paged.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
              onClick={() => setLightboxItem(item)}
            >
              <img
                src={item.thumbnail || item.url}
                alt={item.title || 'Gallery'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.type === 'video' ? (
                    <div className="w-12 h-12 rounded-full gradient-teal flex items-center justify-center">
                      <Play className="w-6 h-6 text-black ml-1" />
                    </div>
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-sm font-medium truncate">{item.title}</p>
                {item.year && <p className="text-gray-400 text-xs">{item.year}</p>}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => p - 1)}
              className="border-gray-700 text-gray-400"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-gray-400 text-sm">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(p => p + 1)}
              className="border-gray-700 text-gray-400"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxItem(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-smgh-teal transition-colors"
            onClick={() => setLightboxItem(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <div className="max-w-5xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
            <img
              src={lightboxItem.url}
              alt={lightboxItem.title || 'Gallery'}
              className="max-w-full max-h-[85vh] object-contain mx-auto rounded-lg"
            />
            {lightboxItem.title && (
              <p className="text-center text-white mt-4 text-lg">{lightboxItem.title}</p>
            )}
          </div>
        </motion.div>
      )}
    </section>
  )
}
