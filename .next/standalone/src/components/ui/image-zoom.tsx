'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
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
  const [fitScale, setFitScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imgRef = useRef<HTMLImageElement>(null)

  // Calculate the scale needed to fit image within the viewport (with padding)
  const calcFitScale = useCallback((img: HTMLImageElement) => {
    const vw = window.innerWidth * 0.88
    const vh = (window.innerHeight - 120) * 0.88 // leave room for toolbar
    const s = Math.min(vw / img.naturalWidth, vh / img.naturalHeight, 1)
    setFitScale(s)
    return s
  }, [])

  const openZoom = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    e?.preventDefault()
    setRotation(0)
    setOffset({ x: 0, y: 0 })
    setDragging(false)
    setOpen(true)
    document.body.style.overflow = 'hidden'
  }, [])

  const closeZoom = useCallback(() => {
    setOpen(false)
    document.body.style.overflow = ''
  }, [])

  // Set scale when image loads
  const handleImageLoad = useCallback(() => {
    if (imgRef.current) {
      const s = calcFitScale(imgRef.current)
      setScale(s)
    }
  }, [calcFitScale])

  // Recalculate fit scale on window resize
  useEffect(() => {
    if (!open) return
    const handleResize = () => {
      if (imgRef.current) {
        const s = calcFitScale(imgRef.current)
        setFitScale(s)
        // Adjust current scale proportionally if it was at fitScale
        if (Math.abs(scale / fitScale - 1) < 0.01) {
          setScale(s)
        }
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [open, calcFitScale, scale, fitScale])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeZoom()
      if (e.key === '+' || e.key === '=') setScale(s => Math.min(s + fitScale * 0.25, fitScale * 4))
      if (e.key === '-') setScale(s => Math.max(s - fitScale * 0.25, fitScale * 0.5))
      if (e.key === 'r') setRotation(r => (r + 90) % 360)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, closeZoom, fitScale])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const step = fitScale * 0.05
    setScale(s => Math.min(Math.max(s - e.deltaY * step / 5, fitScale * 0.5), fitScale * 4))
  }, [fitScale])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale <= fitScale * 1.05) return // only drag when zoomed in
    setDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }, [scale, fitScale, offset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }, [dragging, dragStart])

  const handleMouseUp = useCallback(() => setDragging(false), [])

  const zoomIn = () => setScale(s => Math.min(s + fitScale * 0.5, fitScale * 4))
  const zoomOut = () => setScale(s => Math.max(s - fitScale * 0.5, fitScale * 0.5))
  const rotate = () => setRotation(r => (r + 90) % 360)
  const resetView = () => {
    if (imgRef.current) {
      const s = calcFitScale(imgRef.current)
      setScale(s)
    }
    setRotation(0)
    setOffset({ x: 0, y: 0 })
  }

  const percent = fitScale > 0 ? Math.round((scale / fitScale) * 100) : 100

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

      {/* Lightbox Portal — stopPropagation prevents React tree bubbling to parent <Link> */}
      {open && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={e => e.stopPropagation()}
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
            <span className="text-white/70 text-xs font-mono min-w-[48px] text-center">{percent}%</span>
            <button onClick={zoomIn} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors" aria-label="Zoom in">
              <ZoomIn className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-white/20 mx-1" />
            <button onClick={rotate} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors" aria-label="Rotate">
              <RotateCw className="w-5 h-5" />
            </button>
            <button onClick={resetView} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors text-xs font-medium">
              Fit
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
              ref={imgRef}
              src={src}
              alt={alt}
              onLoad={handleImageLoad}
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
