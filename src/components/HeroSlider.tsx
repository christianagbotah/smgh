'use client'

import { useState, useEffect, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Slide {
  url: string
  alt?: string
}

interface HeroSliderProps {
  slides: Slide[]
  interval?: number
  children?: ReactNode
}

export default function HeroSlider({ slides, interval = 5000, children }: HeroSliderProps) {
  const [current, setCurrent] = useState(0)
  const hasImages = slides.length > 0

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % Math.max(slides.length, 1))
  }, [slides.length])

  useEffect(() => {
    if (!hasImages) return
    const timer = setInterval(next, interval)
    return () => clearInterval(timer)
  }, [hasImages, interval, next])

  const bgStyle: React.CSSProperties = hasImages
    ? {}
    : { background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)' }

  return (
    <section className="relative w-full h-screen min-h-[600px] max-h-[900px] overflow-hidden" style={bgStyle}>
      {hasImages && (
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <img
              src={slides[current].url}
              alt={slides[current].alt || 'SMGH'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Slide indicators */}
      {hasImages && slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                idx === current ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Content overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="text-center px-4 max-w-4xl mx-auto">
          {children}
        </div>
      </div>
    </section>
  )
}
