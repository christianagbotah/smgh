'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Slide {
  url: string
  alt?: string
}

interface HeroSliderProps {
  slides: Slide[]
  interval?: number
  children?: React.ReactNode
}

export default function HeroSlider({ slides, interval = 6000, children }: HeroSliderProps) {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % slides.length)
  }, [slides.length])

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(next, interval)
    return () => clearInterval(timer)
  }, [next, interval, slides.length])

  if (slides.length === 0) return null

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden">
      {/* Spacer pushes content up to avoid overlap with stats cards */}
      <div className="flex-shrink-0" />

      {/* Slider Background */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <img
              src={slides[current].url}
              alt={slides[current].alt || 'SMGH'}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-green-900/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
      </div>

      {/* Slider Dots - Bottom Left */}
      {slides.length > 1 && (
        <div className="absolute bottom-14 md:bottom-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {slides.map((slide, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className="group relative"
              aria-label={`Go to slide ${idx + 1}`}
            >
              <span
                className={`block rounded-full transition-all duration-500 ${
                  idx === current
                    ? 'w-8 h-2 bg-white'
                    : 'w-2 h-2 bg-white/40 group-hover:bg-white/70'
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Content Overlay */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center pb-28 md:pb-36">
        {children}
      </div>
    </section>
  )
}
