'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, Link } from '@/lib/router'
import {
  Calendar, Clock, MapPin, ArrowLeft, Share2, Youtube, ChevronRight,
  Heart, ExternalLink, X, ChevronLeft, Users, Music, Image as ImageIcon,
  Video, Mic, Quote, Copy, Check, Facebook, Twitter,
  ShoppingBag, Ticket, UserPlus, Star, Timer, Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface EventArtist {
  artist: { id: string; name: string; image: string | null; location: string | null; bio: string | null }
  sortOrder: number
}

interface EventGuest {
  id: string; name: string; title: string | null; photo: string | null; description: string | null; sortOrder: number
}

interface EventTestimonial {
  id: string; quote: string; author: string; photo: string | null
}

interface GalleryItem {
  id: string; title: string | null; url: string; thumbnail: string | null; type: string
}

interface Event {
  id: string; title: string; slug: string; date: string; time: string | null
  venue: string; city: string; address: string | null; description: string | null
  bannerImage: string | null; status: string; tags: string | null; youtubeUrls: string | null
  attendanceCount: number
  ticketPrice: number | null
  rsvps?: { id: string; name: string; email: string; phone: string; guests: number; message: string | null; createdAt: string }[]
  artists: EventArtist[]
  guests: EventGuest[]
  testimonials: EventTestimonial[]
  galleryItems: GalleryItem[]
}

interface RelatedEvent {
  id: string; title: string; slug: string; date: string; venue: string; city: string; bannerImage: string | null; status: string
}

interface ProductVariant {
  id: string
  color: string
  colorName: string
  size: string
  stock: number
  image: string | null
  price: number
}

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  image: string | null
  variants: ProductVariant[]
  eventId: string | null
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

/* ─── Countdown Timer Component ─── */
function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const { toast } = useToast()
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate))
  const [prevValues, setPrevValues] = useState(timeLeft)
  const [flipping, setFlipping] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const interval = setInterval(() => {
      setPrevValues(timeLeft)
      const newTime = getTimeLeft(targetDate)
      setTimeLeft(newTime)

      // Determine which units changed for flip animation
      const flipKeys: string[] = []
      if (newTime.days !== prevValues.days) flipKeys.push('days')
      if (newTime.hours !== prevValues.hours) flipKeys.push('hours')
      if (newTime.minutes !== prevValues.minutes) flipKeys.push('minutes')
      if (newTime.seconds !== prevValues.seconds) flipKeys.push('seconds')

      if (flipKeys.length > 0) {
        setFlipping(Object.fromEntries(flipKeys.map(k => [k, true])))
        setTimeout(() => setFlipping({}), 300)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [targetDate, timeLeft, prevValues])

  if (timeLeft.total <= 0) {
    const now = new Date()
    const eventStart = new Date(targetDate)
    // Consider event started if within 24 hours, otherwise completed
    const hoursDiff = (now.getTime() - eventStart.getTime()) / (1000 * 60 * 60)
    if (hoursDiff >= 0 && hoursDiff < 48) {
      return (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-center text-white shadow-lg">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center gap-3"
          >
            <Timer className="w-6 h-6" />
            <span className="text-xl font-bold">Event has started!</span>
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >🎉</motion.span>
          </motion.div>
          <p className="text-white/80 text-sm mt-1">The event is currently happening</p>
        </div>
      )
    }
    return (
      <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl p-6 text-center text-white shadow-lg">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center justify-center gap-3"
        >
          <Check className="w-6 h-6" />
          <span className="text-xl font-bold">Event completed!</span>
        </motion.div>
        <p className="text-white/70 text-sm mt-1">This event has already taken place</p>
      </div>
    )
  }

  const units = [
    { key: 'days', label: 'Days', value: timeLeft.days },
    { key: 'hours', label: 'Hours', value: timeLeft.hours },
    { key: 'minutes', label: 'Minutes', value: timeLeft.minutes },
    { key: 'seconds', label: 'Seconds', value: timeLeft.seconds },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-2xl p-6 shadow-lg"
    >
      <div className="flex items-center gap-2 mb-4 text-white">
        <Timer className="w-5 h-5" />
        <span className="font-semibold text-sm">Countdown to Event</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {units.map(unit => (
          <div key={unit.key} className="flex flex-col items-center">
            <div className="relative perspective-[500px]">
              <motion.div
                animate={flipping[unit.key] ? { rotateX: [0, -90, 0] } : {}}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="bg-white/20 backdrop-blur-sm rounded-xl w-full aspect-square flex items-center justify-center shadow-inner border border-white/30"
              >
                <span className="text-3xl md:text-4xl font-bold text-white tabular-nums">
                  {String(unit.value).padStart(2, '0')}
                </span>
              </motion.div>
            </div>
            <span className="text-white/80 text-xs font-medium mt-2 uppercase tracking-wider">{unit.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function getTimeLeft(targetDate: Date) {
  const now = new Date().getTime()
  const total = targetDate.getTime() - now
  if (total <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  }
}

/* ─── RSVP Modal Component ─── */
function RSVPModal({
  eventId,
  eventTitle,
  isOpen,
  onClose,
  onSuccess,
}: {
  eventId: string
  eventTitle: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    guests: 1,
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.phone.trim()) errs.phone = 'Phone number is required'
    else if (!/^[\d\s+\-()]{8,20}$/.test(form.phone.trim())) errs.phone = 'Invalid phone number'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Invalid email address'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/events/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, ...form }),
      })
      if (res.ok) {
        toast({ title: 'RSVP Confirmed! 🎉', description: `You're attending ${eventTitle}` })
        onSuccess()
        onClose()
        setForm({ name: '', phone: '', email: '', guests: 1, message: '' })
      } else {
        const data = await res.json()
        toast({ title: 'RSVP Failed', description: data.error || 'Something went wrong. Please try again.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Could not connect to the server.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-smgh-green to-emerald-500 p-6 rounded-t-2xl text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">RSVP for Event</h3>
                    <p className="text-white/80 text-sm">Reserve your spot</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="rsvp-name" className="text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="rsvp-name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className={errors.name ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="rsvp-phone" className="text-sm font-medium text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="rsvp-phone"
                  placeholder="+233 XX XXX XXXX"
                  value={form.phone}
                  onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  className={errors.phone ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
                {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="rsvp-email" className="text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="rsvp-email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  className={errors.email ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
              </div>

              {/* Number of Guests */}
              <div className="space-y-2">
                <Label htmlFor="rsvp-guests" className="text-sm font-medium text-gray-700">
                  Number of Guests
                </Label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, guests: Math.max(1, prev.guests - 1) }))}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors font-bold"
                  >
                    −
                  </button>
                  <span className="text-xl font-bold text-gray-900 w-8 text-center">{form.guests}</span>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, guests: Math.min(10, prev.guests + 1) }))}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors font-bold"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-500 ml-2">(max 10)</span>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="rsvp-message" className="text-sm font-medium text-gray-700">
                  Message <span className="text-gray-400 font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="rsvp-message"
                  placeholder="Any special requests or notes..."
                  value={form.message}
                  onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-smgh-green to-emerald-500 hover:from-smgh-green-dark hover:to-emerald-600 text-white font-bold rounded-xl h-12 shadow-lg shadow-smgh-green/20"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Confirm RSVP
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ─── Merchandise Product Card ─── */
function MerchProductCard({ product }: { product: Product }) {
  const variants = Array.isArray(product.variants) ? product.variants : []
  const uniqueColors = variants
    .filter((v, i, arr) => arr.findIndex(a => a.colorName === v.colorName) === i)
  const mainImage = product.image || (variants.length > 0 ? variants[0].image : null)
  const firstVariant = variants.length > 0 ? variants[0] : null
  const displayPrice = firstVariant ? firstVariant.price : product.price

  return (
    <motion.div variants={item}>
      <Link to={`#/shop?product=${product.slug}`}>
        <Card className="border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-12 h-12 text-gray-300" />
                </div>
              )}
              {uniqueColors.length > 1 && (
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm">
                  <span className="text-xs font-medium text-gray-600">{uniqueColors.length} colors</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 group-hover:text-smgh-green transition-colors line-clamp-1">{product.name}</h3>
              <div className="flex items-center justify-between mt-2">
                <p className="text-lg font-bold text-smgh-green">₵{displayPrice.toFixed(2)}</p>
                <span className="text-xs text-smgh-green bg-smgh-green/10 px-2.5 py-1 rounded-full font-medium">Order Now</span>
              </div>
              {/* Color Swatches */}
              {uniqueColors.length > 0 && (
                <div className="flex items-center gap-1.5 mt-3">
                  {uniqueColors.slice(0, 6).map(variant => (
                    <div
                      key={variant.id}
                      className="w-5 h-5 rounded-full border-2 border-gray-200 shadow-sm"
                      style={{ backgroundColor: variant.color }}
                      title={variant.colorName}
                    />
                  ))}
                  {uniqueColors.length > 6 && (
                    <span className="text-xs text-gray-400 ml-1">+{uniqueColors.length - 6}</span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

/* ─── Main EventDetailPage Component ─── */
export default function EventDetailPage() {
  const { params } = useRouter()
  const { toast } = useToast()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [relatedEvents, setRelatedEvents] = useState<RelatedEvent[]>([])
  const [lightboxImg, setLightboxImg] = useState<{ url: string; title?: string | null } | null>(null)
  const [lightboxIdx, setLightboxIdx] = useState(0)
  const [activeVideoIdx, setActiveVideoIdx] = useState(0)
  const [copiedLink, setCopiedLink] = useState(false)
  const [rsvpOpen, setRsvpOpen] = useState(false)
  const [localAttendanceCount, setLocalAttendanceCount] = useState(0)
  const [merchandise, setMerchandise] = useState<Product[]>([])
  const [merchLoading, setMerchLoading] = useState(false)
  const hasFetchedMerch = useRef(false)

  useEffect(() => {
    if (!params.slug) return
    setLoading(true)
    setEvent(null)
    fetch(`/api/events?slug=${encodeURIComponent(params.slug)}`)
      .then(async r => {
        if (!r.ok) throw new Error(`API returned ${r.status}`)
        return r.json()
      })
      .then(data => {
        if (data && !data.error) {
          const raw = Array.isArray(data) ? data[0] : data
          // Normalize: ensure all relation arrays exist
          const ev: Event = {
            ...raw,
            artists: Array.isArray(raw.artists) ? raw.artists : [],
            guests: Array.isArray(raw.guests) ? raw.guests : [],
            testimonials: Array.isArray(raw.testimonials) ? raw.testimonials : [],
            galleryItems: Array.isArray(raw.galleryItems) ? raw.galleryItems : [],
          }
          setEvent(ev)
          setLocalAttendanceCount(ev?.attendanceCount || 0)
        }
      })
      .catch(err => {
        console.error('Failed to fetch event:', err)
      })
      .finally(() => setLoading(false))

    fetch('/api/events?limit=50')
      .then(r => r.json())
      .then(data => {
        const related = (Array.isArray(data) ? data : []).filter((e: { slug: string }) => e.slug !== params.slug).slice(0, 3)
        setRelatedEvents(related)
      })
      .catch(() => {})
  }, [params.slug])

  // Fetch merchandise when event is loaded
  useEffect(() => {
    if (!event?.id || hasFetchedMerch.current) return
    hasFetchedMerch.current = true
    fetch(`/api/products?eventId=${event.id}`)
      .then(r => r.json())
      .then(data => {
        setMerchandise(Array.isArray(data) ? data : [])
      })
      .catch(() => setMerchandise([]))
      .finally(() => setMerchLoading(false))
  }, [event?.id])

  const youtubeUrls: string[] = (() => {
    if (!event?.youtubeUrls) return []
    try { return JSON.parse(event.youtubeUrls) }
    catch { return [] }
  })()

  const getYoutubeId = useCallback((url: string) => {
    const match = url.match(/(?:v=|\/)([^&?/]+)/)
    return match ? match[1] : null
  }, [])

  const getYoutubeEmbed = useCallback((url: string) => {
    const id = getYoutubeId(url)
    return id ? `https://www.youtube.com/embed/${id}` : url
  }, [getYoutubeId])

  const getYoutubeThumb = useCallback((url: string) => {
    const id = getYoutubeId(url)
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : ''
  }, [getYoutubeId])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch { /* ignore */ }
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: event?.title, url: window.location.href })
    } else {
      handleCopyLink()
    }
  }

  const handleLightboxPrev = () => {
    if (!event) return
    const items = event.galleryItems
    setLightboxIdx(prev => (prev - 1 + items.length) % items.length)
    setLightboxImg({ url: items[(lightboxIdx - 1 + items.length) % items.length].url, title: items[(lightboxIdx - 1 + items.length) % items.length].title })
  }

  const handleLightboxNext = () => {
    if (!event) return
    const items = event.galleryItems
    setLightboxIdx(prev => (prev + 1) % items.length)
    setLightboxImg({ url: items[(lightboxIdx + 1) % items.length].url, title: items[(lightboxIdx + 1) % items.length].title })
  }

  const handleRsvpSuccess = () => {
    setLocalAttendanceCount(prev => prev + 1)
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  // Check if event is upcoming or completed
  const isUpcoming = event?.status === 'upcoming' && event.date && new Date(event.date) > new Date()
  const isCompleted = event?.status === 'completed'

  const statusConfig = {
    upcoming: { bg: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500', label: 'Upcoming' },
    completed: { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'Completed' },
    cancelled: { bg: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', label: 'Cancelled' },
  }
  const sc = statusConfig[event?.status as keyof typeof statusConfig] || statusConfig.upcoming

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen">
        <Skeleton className="h-[60vh] w-full" />
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-48 w-full rounded-2xl mt-6" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-400 mb-2">Event not found</h2>
          <p className="text-gray-500 mb-6">The event you are looking for does not exist or has been removed.</p>
          <Link to="/events"><Button className="rounded-full"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Events</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="min-h-screen overflow-hidden">
      {/* Hero Banner */}
      <div className="relative h-[60vh] md:h-[80vh] overflow-hidden">
        <img
          src={event.bannerImage || `https://picsum.photos/seed/${event.slug}/1080/1920`}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        <div className="absolute bottom-0 inset-x-0 p-6 md:p-10 max-w-6xl mx-auto">
          <Link to="/events">
            <motion.span variants={item} className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-5 cursor-pointer transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Events
            </motion.span>
          </Link>
          <motion.div variants={item} className="flex items-center gap-3 mb-4">
            <Badge className={`${sc.bg} border px-3 py-1 text-xs font-semibold`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} mr-1.5`} />
              {sc.label}
            </Badge>
            <Badge variant="outline" className="border-white/30 text-white/80 text-xs bg-white/10 backdrop-blur-sm">
              {new Date(event.date).getFullYear()} Edition
            </Badge>
          </motion.div>
          <motion.h1 variants={item} className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">{event.title}</motion.h1>
          <motion.div variants={item} className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full"><Calendar className="w-4 h-4 text-smgh-green-light" />{formatDate(event.date)}</span>
            {event.time && <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full"><Clock className="w-4 h-4 text-smgh-green-light" />{event.time}</span>}
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full"><MapPin className="w-4 h-4 text-smgh-green-light" />{event.venue}, {event.city}</span>
          </motion.div>
        </div>
      </div>

      {/* Sticky Info Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 md:gap-4 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 text-sm text-gray-700 flex-shrink-0">
              <Calendar className="w-4 h-4 text-smgh-green" />
              <span className="hidden sm:inline font-medium">{formatDate(event.date)}</span>
              <span className="sm:hidden font-medium">{new Date(event.date).toLocaleDateString()}</span>
            </div>
            {event.time && (
              <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
            )}
            {event.time && (
              <div className="flex items-center gap-2 text-sm text-gray-700 flex-shrink-0">
                <Clock className="w-4 h-4 text-smgh-green" />
                <span className="font-medium">{event.time}</span>
              </div>
            )}
            <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
            <div className="flex items-center gap-2 text-sm text-gray-700 flex-shrink-0">
              <MapPin className="w-4 h-4 text-smgh-green" />
              <span className="font-medium">{event.venue}, {event.city}</span>
            </div>
            <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
            <div className="flex items-center gap-2 text-sm flex-shrink-0">
              <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
              <span className="font-medium text-gray-600">{sc.label}</span>
            </div>
            <div className="ml-auto flex-shrink-0">
              <Link to="/donate">
                <Button size="sm" className="bg-smgh-red hover:bg-smgh-red-dark text-white rounded-full shadow-sm">
                  <Heart className="w-3.5 h-3.5 mr-1.5" /> Donate
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Timer — shown below sticky bar for upcoming events */}
      {isUpcoming && (
        <div className="max-w-6xl mx-auto px-4 pt-6">
          <CountdownTimer targetDate={new Date(event.date)} />
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-8 bg-gray-100 p-1 rounded-xl h-auto flex-wrap gap-1">
                <TabsTrigger value="overview" className="rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="artists" className="rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Artists <span className="ml-1 text-xs opacity-60">({event.artists.length})</span>
                </TabsTrigger>
                <TabsTrigger value="gallery" className="rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Gallery <span className="ml-1 text-xs opacity-60">({event.galleryItems.length})</span>
                </TabsTrigger>
                <TabsTrigger value="videos" className="rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Videos <span className="ml-1 text-xs opacity-60">({youtubeUrls.length})</span>
                </TabsTrigger>
                <TabsTrigger value="guests" className="rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Guests <span className="ml-1 text-xs opacity-60">({event.guests.length})</span>
                </TabsTrigger>
                <TabsTrigger value="merch" className="rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <ShoppingBag className="w-4 h-4 mr-1" /> Merch
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <motion.div variants={item}>
                  {/* Description */}
                  {event.description && (
                    <div className="prose prose-lg max-w-none mb-10">
                      <div dangerouslySetInnerHTML={{ __html: event.description }} className="text-gray-700 leading-relaxed [&_p]:mb-4 [&_p:first-child]:text-lg [&_p:first-child]:font-medium" />
                    </div>
                  )}

                  {/* Event Stats — Enhanced with Attending/Attended */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
                    {[
                      { icon: Users, label: isCompleted ? 'Attended' : 'Attending', value: localAttendanceCount },
                      { icon: Calendar, label: 'Year', value: new Date(event.date).getFullYear() },
                      { icon: Music, label: 'Artists', value: event.artists.length },
                      { icon: ImageIcon, label: 'Photos', value: event.galleryItems.length },
                      { icon: Video, label: 'Videos', value: youtubeUrls.length },
                      { icon: Star, label: 'Guests', value: event.guests.length },
                    ].map(stat => (
                      <Card key={stat.label} className="border-gray-100 shadow-sm">
                        <CardContent className="p-4 text-center">
                          <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.label === 'Attending' ? 'text-smgh-red' : stat.label === 'Guests' ? 'text-amber-500' : 'text-smgh-green'}`} />
                          <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                          <p className="text-xs text-gray-500">{stat.label}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Testimonials */}
                  {event.testimonials.length > 0 && (
                    <div className="mb-10">
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Quote className="w-5 h-5 text-smgh-green" /> What People Said
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {event.testimonials.map(t => (
                          <motion.div key={t.id} variants={item} className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <Quote className="w-6 h-6 text-smgh-green/20 mb-3" />
                            <p className="text-gray-600 italic leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                              {t.photo ? (
                                <img src={t.photo} alt={t.author} className="w-10 h-10 rounded-full object-cover ring-2 ring-smgh-green/10" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-smgh-green/10 flex items-center justify-center text-smgh-green font-bold text-sm ring-2 ring-smgh-green/10">
                                  {t.author.charAt(0)}
                                </div>
                              )}
                              <div>
                                <span className="font-medium text-gray-900 text-sm">{t.author}</span>
                                <p className="text-gray-400 text-xs">Event Attendee</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {event.tags && (
                    <div className="flex flex-wrap gap-2">
                      {event.tags.split(',').map(tag => (
                        <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200">#{tag.trim()}</Badge>
                      ))}
                    </div>
                  )}
                </motion.div>
              </TabsContent>

              {/* Artists Tab */}
              <TabsContent value="artists">
                {event.artists.length > 0 ? (
                  <motion.div variants={container} initial="hidden" animate="show">
                    <div className="grid sm:grid-cols-2 gap-5">
                      {event.artists.sort((a, b) => a.sortOrder - b.sortOrder).map(ea => (
                        <motion.div key={ea.artist.id} variants={item}>
                          <Link to="/artists">
                            <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-smgh-green/20 cursor-pointer group overflow-hidden">
                              <CardContent className="p-0">
                                <div className="flex items-start gap-5 p-5">
                                  <div className="relative flex-shrink-0">
                                    <img
                                      src={ea.artist.image || `https://picsum.photos/seed/${ea.artist.id}/300/300`}
                                      alt={ea.artist.name}
                                      className="w-20 h-20 rounded-2xl object-cover ring-4 ring-smgh-green/10 group-hover:ring-smgh-green/20 transition-all"
                                    />
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-smgh-green rounded-full flex items-center justify-center">
                                      <Music className="w-3 h-3 text-white" />
                                    </div>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-smgh-green transition-colors">{ea.artist.name}</h3>
                                    {ea.artist.location && (
                                      <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{ea.artist.location}</p>
                                    )}
                                    {ea.artist.bio && <p className="text-gray-600 text-sm mt-2 line-clamp-3 leading-relaxed">{ea.artist.bio}</p>}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">No artists listed for this event</p>
                    <p className="text-gray-400 text-sm mt-1">Artists will be announced soon</p>
                  </div>
                )}
              </TabsContent>

              {/* Gallery Tab - Masonry Grid */}
              <TabsContent value="gallery">
                {event.galleryItems.length > 0 ? (
                  <motion.div variants={container} initial="hidden" animate="show">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      {event.galleryItems.map((gi, idx) => (
                        <motion.div
                          key={gi.id}
                          variants={item}
                          className="break-inside-avoid rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer relative bg-gray-100"
                          onClick={() => { setLightboxIdx(idx); setLightboxImg({ url: gi.url, title: gi.title }) }}
                        >
                          <img
                            src={gi.thumbnail || gi.url}
                            alt={gi.title || 'Gallery'}
                            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-white text-sm font-medium">
                              <ExternalLink className="w-4 h-4" /> View
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">No photos available for this event</p>
                    <p className="text-gray-400 text-sm mt-1">Check back after the event</p>
                  </div>
                )}
              </TabsContent>

              {/* Videos Tab */}
              <TabsContent value="videos">
                {youtubeUrls.length > 0 ? (
                  <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
                        <iframe
                          key={activeVideoIdx}
                          src={getYoutubeEmbed(youtubeUrls[activeVideoIdx])}
                          className="w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    </div>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
                      {youtubeUrls.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveVideoIdx(idx)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${
                            idx === activeVideoIdx
                              ? 'bg-smgh-green text-white shadow-lg shadow-smgh-green/20'
                              : 'bg-white border border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                          }`}
                        >
                          <div className="relative w-28 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={getYoutubeThumb(url)} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Youtube className={`w-5 h-5 ${idx === activeVideoIdx ? 'text-white' : 'text-red-500'}`} />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium truncate ${idx === activeVideoIdx ? 'text-white' : 'text-gray-700'}`}>
                              Video {idx + 1}
                            </p>
                            <p className={`text-xs mt-0.5 ${idx === activeVideoIdx ? 'text-white/70' : 'text-gray-400'}`}>
                              {idx === activeVideoIdx ? 'Now playing' : 'Click to play'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Youtube className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">No videos available for this event</p>
                    <p className="text-gray-400 text-sm mt-1">Subscribe to our YouTube channel for updates</p>
                  </div>
                )}
              </TabsContent>

              {/* Guests Tab */}
              <TabsContent value="guests">
                {event.guests.length > 0 ? (
                  <motion.div variants={container} initial="hidden" animate="show">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {event.guests.sort((a, b) => a.sortOrder - b.sortOrder).map(guest => (
                        <motion.div key={guest.id} variants={item}>
                          <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                            <CardContent className="p-0">
                              <div className="relative">
                                <div className="h-20 bg-gradient-to-r from-smgh-green/10 to-smgh-red/10" />
                                <div className="px-5 pb-5">
                                  <div className="-mt-8 mb-3 relative inline-block">
                                    <img
                                      src={guest.photo || `https://picsum.photos/seed/guest-${guest.id}/200/200`}
                                      alt={guest.name}
                                      className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white shadow-md"
                                    />
                                  </div>
                                  <h3 className="font-bold text-gray-900">{guest.name}</h3>
                                  {guest.title && (
                                    <Badge className="bg-smgh-green/10 text-smgh-green hover:bg-smgh-green/20 mt-1 border-0 text-xs">
                                      <Mic className="w-3 h-3 mr-1" /> {guest.title}
                                    </Badge>
                                  )}
                                  {guest.description && (
                                    <p className="text-gray-600 text-sm mt-3 leading-relaxed">{guest.description}</p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Star className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">No guests announced yet</p>
                    <p className="text-gray-400 text-sm mt-1">Special guests will be revealed soon</p>
                  </div>
                )}
              </TabsContent>

              {/* Merchandise Tab */}
              <TabsContent value="merch">
                {merchLoading ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map(i => (
                      <div key={i}>
                        <Card className="border-gray-100 shadow-sm overflow-hidden">
                          <CardContent className="p-0">
                            <Skeleton className="aspect-square w-full" />
                            <div className="p-4 space-y-2">
                              <Skeleton className="h-5 w-3/4" />
                              <Skeleton className="h-5 w-1/3" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                ) : merchandise.length > 0 ? (
                  <motion.div variants={container} initial="hidden" animate="show">
                    <div className="flex items-center gap-2 mb-6">
                      <ShoppingBag className="w-5 h-5 text-smgh-green" />
                      <h3 className="text-lg font-bold text-gray-900">
                        Official Event Merchandise
                      </h3>
                      <Badge className="bg-smgh-green/10 text-smgh-green border-0 text-xs">
                        {merchandise.length} item{merchandise.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {merchandise.map(product => (
                        <MerchProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="w-10 h-10 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium text-lg">No merchandise available for this event</p>
                    <p className="text-gray-400 text-sm mt-1">Check back later — new items may be added soon!</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

          </div>

          {/* Right Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            {/* Attendance Counter + RSVP Card */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className={`p-6 text-white ${isCompleted ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-smgh-green to-emerald-500'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{isCompleted ? 'People Who Attended' : 'Attendance'}</h3>
                    <p className="text-white/80 text-sm">{isCompleted ? 'Total turnout' : 'People planning to attend'}</p>
                  </div>
                </div>
                <motion.p
                  key={localAttendanceCount}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="text-4xl font-bold mb-1"
                >
                  {localAttendanceCount}
                </motion.p>
                <p className="text-white/70 text-xs mb-4">
                  {isCompleted
                    ? (localAttendanceCount === 0 ? 'No attendance recorded' : localAttendanceCount === 1 ? 'person attended' : 'people attended')
                    : (localAttendanceCount === 0 ? 'Be the first to RSVP!' : localAttendanceCount === 1 ? 'person attending' : 'people attending')
                  }
                </p>
                {!isCompleted && event.ticketPrice ? (
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 mb-4">
                    <Ticket className="w-4 h-4" />
                    <span className="text-sm font-medium">Ticket: ₵{event.ticketPrice.toFixed(2)}</span>
                  </div>
                ) : null}
                {!isCompleted && (
                  <Button
                    onClick={() => setRsvpOpen(true)}
                    className="w-full bg-white text-smgh-green hover:bg-white/90 font-bold rounded-xl shadow-md"
                  >
                    <UserPlus className="w-4 h-4 mr-2" /> Attend This Event
                  </Button>
                )}
              </div>
            </Card>

            {/* Donate Card */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="bg-gradient-to-br from-smgh-red to-smgh-red-dark p-6 text-white">
                <Heart className="w-8 h-8 mb-3 opacity-80" />
                <h3 className="text-lg font-bold mb-2">Support This Mission</h3>
                <p className="text-white/80 text-sm mb-4 leading-relaxed">
                  Your donation helps us support mothers, widows, and the less privileged in Ghana.
                </p>
                <Link to="/donate">
                  <Button className="w-full bg-white text-smgh-red hover:bg-white/90 font-bold rounded-xl shadow-md">
                    <Heart className="w-4 h-4 mr-2" /> Donate Now
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Event Info Card */}
            <Card className="border-gray-100 shadow-sm">
              <CardContent className="p-5">
                <h4 className="font-semibold text-gray-900 mb-4 text-sm">Event Details</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-smgh-green/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-smgh-green" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-medium text-gray-900 text-sm">{formatDate(event.date)}</p>
                    </div>
                  </div>
                  {event.time && (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-smgh-green/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-smgh-green" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Time</p>
                        <p className="font-medium text-gray-900 text-sm">{event.time}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-smgh-green/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-smgh-green" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Venue</p>
                      <p className="font-medium text-gray-900 text-sm">{event.venue}</p>
                      <p className="text-gray-500 text-xs">{event.city}{event.address ? `, ${event.address}` : ''}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Card */}
            <Card className="border-gray-100 shadow-sm">
              <CardContent className="p-5">
                <h4 className="font-semibold text-gray-900 mb-4 text-sm">Share This Event</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Facebook className="w-4 h-4" /> Facebook
                  </button>
                  <button
                    onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(event.title)}`, '_blank')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    <Twitter className="w-4 h-4" /> Twitter
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <Button onClick={handleShare} variant="outline" className="w-full mt-3 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 text-sm">
                  <Share2 className="w-4 h-4 mr-2" /> More Options
                </Button>
              </CardContent>
            </Card>

            {/* Map Placeholder */}
            <Card className="border-gray-100 shadow-sm overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center relative">
                <MapPin className="w-10 h-10 text-gray-300" />
                <div className="absolute bottom-2 left-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
                  <p className="text-xs text-gray-500">📍 {event.venue}, {event.city}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Related Events — always at the bottom, after sidebar */}
        {relatedEvents.length > 0 && (
          <motion.div variants={item} className="mt-10 pt-10 border-t border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">More Events</h2>
              <Link to="/events">
                <Button variant="ghost" className="text-smgh-green hover:text-smgh-green-dark">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedEvents.map(re => (
                <Link key={re.id} to={`/events/${re.slug}`}>
                  <Card className="group overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100 cursor-pointer">
                    <CardContent className="p-0">
                      <div className="relative aspect-[9/16] overflow-hidden">
                        <img src={re.bannerImage || `https://picsum.photos/seed/${re.slug}/600/1066`} alt={re.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-3 left-3">
                          <Badge className="bg-white/90 text-gray-800 text-xs backdrop-blur-sm border-0">
                            {new Date(re.date).getFullYear()}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 group-hover:text-smgh-green transition-colors line-clamp-1">{re.title}</h3>
                        <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{re.venue}, {re.city}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImg && event && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxImg(null)}
          >
            <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10" onClick={e => { e.stopPropagation(); setLightboxImg(null) }}>
              <X className="w-5 h-5" />
            </button>
            {event.galleryItems.length > 1 && (
              <>
                <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10" onClick={e => { e.stopPropagation(); handleLightboxPrev() }}>
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10" onClick={e => { e.stopPropagation(); handleLightboxNext() }}>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
              {lightboxIdx + 1} / {event.galleryItems.length}
              {lightboxImg.title && <span className="ml-2 text-white/60">• {lightboxImg.title}</span>}
            </div>
            <img src={lightboxImg.url} alt={lightboxImg.title || 'Gallery'} className="max-w-[92vw] sm:max-w-[90vw] max-h-[80vh] sm:max-h-[85vh] object-contain" onClick={e => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* RSVP Modal */}
      <RSVPModal
        eventId={event.id}
        eventTitle={event.title}
        isOpen={rsvpOpen}
        onClose={() => setRsvpOpen(false)}
        onSuccess={handleRsvpSuccess}
      />
    </motion.div>
  )
}
