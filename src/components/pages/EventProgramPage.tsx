'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, Link } from '@/lib/router'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Download, Calendar, Clock, MapPin, FileText,
  Loader2, AlertCircle, ChevronRight, ExternalLink, Smartphone, Monitor
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface EventData {
  id: string
  title: string
  slug: string
  date: string
  time: string | null
  venue: string
  city: string
  bannerImage: string | null
  programOutlineUrl: string | null
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])
  return isMobile
}

export default function EventProgramPage() {
  const { params } = useRouter()
  const slug = params.slug
  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(true)
  const [viewerMode, setViewerMode] = useState<'iframe' | 'mobile'>('iframe')
  const isMobile = useIsMobile(768)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/events?slug=${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const ev = Array.isArray(data) ? data[0] : data
        setEvent(ev || null)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [slug])

  // Set viewer mode based on device and allow manual toggle
  useEffect(() => {
    setViewerMode(isMobile ? 'mobile' : 'iframe')
  }, [isMobile])

  const handleIframeLoad = useCallback(() => {
    setPdfLoading(false)
  }, [])

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-48 w-full rounded-2xl mb-6" />
          <Skeleton className="h-12 w-full rounded-xl mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md px-4"
        >
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-500 mb-6">The event you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link to="/events">
            <Button className="bg-gradient-to-r from-smgh-green to-emerald-500 hover:from-smgh-green-dark hover:to-emerald-600 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  if (!event.programOutlineUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <nav className="flex items-center gap-2 text-sm text-gray-400">
            <Link to="/events" className="hover:text-smgh-green transition-colors">Events</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={`/events/${event.slug}`} className="hover:text-smgh-green transition-colors truncate max-w-[200px]">{event.title}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600">Program Outline</span>
          </nav>
        </div>
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md px-4"
          >
            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Program Outline Not Available</h1>
            <p className="text-gray-500 mb-6">The program outline for this event hasn&apos;t been uploaded yet. Please check back later.</p>
            <Link to={`/events/${event.slug}`}>
              <Button className="bg-gradient-to-r from-smgh-green to-emerald-500 hover:from-smgh-green-dark hover:to-emerald-600 text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Event
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  // Build absolute URL for Google Docs viewer
  const absolutePdfUrl = typeof window !== 'undefined'
    ? new URL(event.programOutlineUrl, window.location.origin).href
    : event.programOutlineUrl

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Banner */}
      <div className="relative">
        {event.bannerImage ? (
          <div className="relative h-48 sm:h-64 overflow-hidden">
            <img
              src={event.bannerImage}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/10" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
              <div className="max-w-5xl mx-auto">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl sm:text-3xl font-bold text-white mb-2"
                >
                  {event.title}
                </motion.h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-white/80">
                  <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    <Calendar className="w-3 h-3 text-smgh-green-light" />
                    {formatDate(event.date)}
                  </span>
                  {event.time && (
                    <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <Clock className="w-3 h-3 text-smgh-green-light" />
                      {event.time}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    <MapPin className="w-3 h-3 text-smgh-green-light" />
                    {event.venue}, {event.city}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-smgh-green to-emerald-500 h-40 sm:h-56 flex items-center">
            <div className="max-w-5xl mx-auto px-4 w-full">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl sm:text-3xl font-bold text-white mb-2"
              >
                {event.title}
              </motion.h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-white/80">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(event.date)}
                </span>
                {event.time && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {event.time}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {event.venue}, {event.city}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 pt-4 sm:pt-6">
        <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-400 overflow-x-auto">
          <Link to="/events" className="hover:text-smgh-green transition-colors whitespace-nowrap">Events</Link>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <Link to={`/events/${event.slug}`} className="hover:text-smgh-green transition-colors truncate max-w-[140px] sm:max-w-[200px]">{event.title}</Link>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <span className="text-gray-600 font-medium whitespace-nowrap">Program Outline</span>
        </nav>
      </div>

      {/* Content Area */}
      <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6"
        >
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-smgh-green" />
              Event Program Outline
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              View or download the complete program for this event
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <a
              href={event.programOutlineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none"
            >
              <Button variant="outline" className="border-gray-200 hover:bg-gray-50 w-full sm:w-auto text-sm">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Open in New Tab
              </Button>
            </a>
            <a href={event.programOutlineUrl} download className="flex-1 sm:flex-none">
              <Button className="bg-gradient-to-r from-smgh-green to-emerald-500 hover:from-smgh-green-dark hover:to-emerald-600 text-white shadow-lg shadow-smgh-green/20 w-full sm:w-auto text-sm">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download PDF
              </Button>
            </a>
          </div>
        </motion.div>

        {/* PDF Viewer Container */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-700">Program Outline</p>
                <p className="text-[10px] sm:text-xs text-gray-400">PDF Document</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile/Desktop Toggle */}
              <div className="hidden sm:flex items-center bg-white rounded-lg border border-gray-200 p-0.5">
                <button
                  onClick={() => { setViewerMode('iframe'); setPdfLoading(true) }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewerMode === 'iframe'
                      ? 'bg-smgh-green text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  Desktop
                </button>
                <button
                  onClick={() => { setViewerMode('mobile'); setPdfLoading(true) }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewerMode === 'mobile'
                      ? 'bg-smgh-green text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Mobile
                </button>
              </div>
              <Badge variant="secondary" className="bg-smgh-green/10 text-smgh-green text-[10px] sm:text-xs border-0">
                Event Program
              </Badge>
            </div>
          </div>

          {/* PDF Embed - Desktop Mode (iframe) */}
          {viewerMode === 'iframe' && (
            <div className="relative" style={{ minHeight: '75vh' }}>
              {pdfLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-smgh-green animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Loading document...</p>
                    <p className="text-gray-400 text-xs mt-1">Desktop viewer uses browser PDF plugin</p>
                  </div>
                </div>
              )}
              <iframe
                src={`${event.programOutlineUrl}#toolbar=0&navpanes=0`}
                className="w-full border-0"
                style={{ minHeight: '75vh' }}
                title={`Program Outline - ${event.title}`}
                onLoad={handleIframeLoad}
              />
            </div>
          )}

          {/* PDF Embed - Mobile Mode (Google Docs Viewer - renders as images) */}
          {viewerMode === 'mobile' && (
            <div className="relative" style={{ minHeight: '70vh' }}>
              {pdfLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-smgh-green animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Loading document...</p>
                    <p className="text-gray-400 text-xs mt-1">Rendering pages for mobile view</p>
                  </div>
                </div>
              )}
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(absolutePdfUrl)}&embedded=true`}
                className="w-full border-0"
                style={{ minHeight: '70vh' }}
                title={`Program Outline - ${event.title}`}
                onLoad={handleIframeLoad}
                onError={() => setPdfLoading(false)}
              />
            </div>
          )}
        </motion.div>

        {/* Mobile Quick Actions (below viewer) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 sm:hidden"
        >
          <div className="bg-gradient-to-r from-smgh-green/5 to-emerald-500/5 rounded-xl p-4 border border-smgh-green/10">
            <p className="text-xs text-gray-500 mb-3 text-center">Having trouble viewing? Try these options:</p>
            <div className="flex gap-2">
              <a href={event.programOutlineUrl} download className="flex-1">
                <Button className="w-full bg-gradient-to-r from-smgh-green to-emerald-500 hover:from-smgh-green-dark hover:to-emerald-600 text-white text-sm">
                  <Download className="w-4 h-4 mr-1.5" />
                  Download PDF
                </Button>
              </a>
              <a href={event.programOutlineUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="outline" className="w-full border-gray-200 hover:bg-gray-50 text-sm">
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  Open in Browser
                </Button>
              </a>
            </div>
          </div>
        </motion.div>

        {/* Footer Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pb-8"
        >
          <Link to={`/events/${event.slug}`}>
            <Button variant="ghost" className="text-gray-500 hover:text-gray-700 text-sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Event Details
            </Button>
          </Link>
          <a href={event.programOutlineUrl} download>
            <Button className="bg-gradient-to-r from-smgh-green to-emerald-500 hover:from-smgh-green-dark hover:to-emerald-600 text-white text-sm">
              <Download className="w-4 h-4 mr-2" />
              Download Program Outline
            </Button>
          </a>
        </motion.div>
      </div>
    </div>
  )
}
