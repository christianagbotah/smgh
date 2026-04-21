'use client'

import { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'

interface ImageZoomProps {
  src: string
  alt?: string
  children?: React.ReactNode
  className?: string
}

export default function ImageZoom({ src, alt = 'Image', children, className = '' }: ImageZoomProps) {
  const [open, setOpen] = useState(false)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const openZoom = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    e?.preventDefault()
    setScale(1)
    setRotation(0)
    setOffset({ x: 0, y: 0 })
    setOpen(true)
    document.body.style.overflow = 'hidden'
  }, [])

  const closeZoom = useCallback(() => {
    setOpen(false)
    document.body.style.overflow = ''
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeZoom()
      if (e.key === '+' || e.key === '=') setScale(s => Math.min(s + 0.25, 4))
      if (e.key === '-') setScale(s => Math.max(s - 0.25, 0.5))
      if (e.key === 'r') setRotation(r => (r + 90) % 360)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, closeZoom])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setScale(s => Math.min(Math.max(s - e.deltaY * 0.002, 0.5), 4))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale <= 1) return
    setDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }, [scale, offset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }, [dragging, dragStart])

  const handleMouseUp = useCallback(() => setDragging(false), [])

  const zoomIn = () => setScale(s => Math.min(s + 0.5, 4))
  const zoomOut = () => setScale(s => Math.max(s - 0.5, 0.5))
  const rotate = () => setRotation(r => (r + 90) % 360)
  const resetView = () => { setScale(1); setRotation(0); setOffset({ x: 0, y: 0 }) }

  return (
    <>
      <div
        className={`cursor-zoom-in group ${className}`}
        onClick={openZoom}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter') openZoom() }}
        aria-label={`Zoom image: ${alt}`}
      >
        {children}
        {/* Zoom hint overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg">
            <ZoomIn className="w-5 h-5 text-gray-800" />
          </div>
        </div>
      </div>

      {/* Lightbox Portal */}
      {open && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={closeZoom} />

          {/* Close button */}
          <button
            onClick={closeZoom}
            className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close zoom"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Toolbar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-3 py-2 border border-white/10">
            <button onClick={zoomOut} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors" aria-label="Zoom out">
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-white/70 text-xs font-mono min-w-[48px] text-center">{Math.round(scale * 100)}%</span>
            <button onClick={zoomIn} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors" aria-label="Zoom in">
              <ZoomIn className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-white/20 mx-1" />
            <button onClick={rotate} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors" aria-label="Rotate">
              <RotateCw className="w-5 h-5" />
            </button>
            <button onClick={resetView} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors text-xs font-medium">
              Reset
            </button>
          </div>

          {/* Image container — scrollable/pannable */}
          <div
            className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
          >
            <img
              src={src}
              alt={alt}
              className="absolute top-1/2 left-1/2 max-w-none select-none"
              style={{
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transition: dragging ? 'none' : 'transform 0.2s ease-out',
              }}
              draggable={false}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
