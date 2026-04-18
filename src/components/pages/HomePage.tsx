'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from '@/lib/router'
import {
  Calendar, Heart, Users, Music, ArrowRight, Clock, MapPin, Star,
  ChevronRight, ChevronLeft, Quote, HandHeart, Gift, MapPinned,
  Play, Youtube, Facebook, Instagram, Send, Timer, TrendingUp,
  Baby, Church, Sparkles, Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import HeroSlider from '@/components/HeroSlider'
import { useToast } from '@/hooks/use-toast'

interface Event {
  id: string
  title: string
  slug: string
  date: string
  time: string | null
  venue: string
  city: string
  bannerImage: string | null
  status: string
}

interface GalleryItem {
  id: string
  url: string
  thumbnail: string | null
  title: string | null
  year: number | null
}

interface Artist {
  id: string
  name: string
  location: string | null
  bio: string | null
  image: string | null
  featured: boolean
}

interface Testimonial {
  id: string
  quote: string
  author: string
  photo: string | null
  event: { title: string; date: string; slug: string }
}

interface FoundationRecord {
  year: number
  amountRaised: number | null
  beneficiariesCount: number | null
  description: string
}

interface Slide {
  url: string
  alt?: string
}

// Animated section wrapper
function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Counting animation hook
function useCountUp(end: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasStarted = useRef(false)

  useEffect(() => {
    if (!startOnView) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true
          const startTime = Date.now()
          const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * end))
            if (progress < 1) requestAnimationFrame(animate)
          }
          animate()
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration, startOnView])

  return { count, ref }
}

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([])
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [heroSlides, setHeroSlides] = useState<Slide[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [foundation, setFoundation] = useState<FoundationRecord[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    Promise.all([
      fetch('/api/events?limit=20').then(r => r.json()),
      fetch('/api/gallery?limit=12&category=event').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
      fetch('/api/artists').then(r => r.json()),
      fetch('/api/testimonials').then(r => r.json()),
      fetch('/api/foundation').then(r => r.json()),
    ]).then(([eventsData, galleryData, settingsData, artistsData, testimonialsData, foundationData]) => {
      setEvents(eventsData)
      setGallery(galleryData)
      setSettings(settingsData)
      setArtists(artistsData.filter((a: Artist) => a.featured))
      setTestimonials(Array.isArray(testimonialsData) ? testimonialsData : [])
      const fd = (foundationData as any).records || []
      setFoundation(fd)

      // Parse hero slider images from settings
      const heroImages = settingsData.hero_slider_images
      if (heroImages) {
        try {
          const parsed = JSON.parse(heroImages)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setHeroSlides(parsed.map((url: string) => ({ url, alt: 'SMGH' })))
          }
        } catch { /* ignore */ }
      }

      // Fallback: use event banners if no hero images set
      if (!heroImages) {
        const banners = eventsData
          .filter((e: Event) => e.bannerImage)
          .reverse()
          .slice(0, 5)
          .map((e: Event) => ({ url: e.bannerImage!, alt: e.title }))
        setHeroSlides(banners)
      }

      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Auto-rotate testimonials
  useEffect(() => {
    if (testimonials.length <= 1) return
    const timer = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [testimonials.length])

  const upcomingEvents = events.filter(e => e.status === 'upcoming')
  const completedEvents = events.filter(e => e.status === 'completed')
  const latestEvent = upcomingEvents[0] || completedEvents[0]

  const totalBeneficiaries = foundation.reduce((sum, r) => sum + (r.beneficiariesCount || 0), 0)
  const totalRaised = foundation.reduce((sum, r) => sum + (r.amountRaised || 0), 0)

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  // Countdown timer for next event
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  useEffect(() => {
    if (!upcomingEvents[0]) return
    const target = new Date(upcomingEvents[0].date).getTime()
    const tick = () => {
      const now = Date.now()
      const diff = Math.max(0, target - now)
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcomingEvents[0]?.date])

  const statEvents = useCountUp(completedEvents.length, 1800)
  const statBeneficiaries = useCountUp(totalBeneficiaries, 2200)
  const statRaised = useCountUp(Math.round(totalRaised / 1000), 2500)

  const heroContent = (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <img src="/images/logo/smgh-logo.png" alt="Sweet Mothers Ghana" className="h-20 md:h-24 mx-auto drop-shadow-2xl" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="mb-8"
      >
        <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 text-white/90 text-sm backdrop-blur-sm border border-white/20">
          <Star className="w-4 h-4 text-yellow-400" />
          {settings.site_tagline || 'Celebrating Mothers Since 2017'}
        </span>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg"
      >
        Sweet Mothers
        <span className="block text-green-400">Ghana</span>
      </motion.h1>
      {settings.hero_description && settings.hero_description !== '<p></p>' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-10 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: settings.hero_description }}
        />
      ) : (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          To Honour and Support Mothers &mdash; especially single mothers, widows, and the less privileged. Join us for our annual worship night celebration.
        </motion.p>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <Link to="/events">
          <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-base rounded-full shadow-lg shadow-green-600/30 transition-all hover:scale-105">
            Explore Events <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
        <Link to="/donate">
          <Button size="lg" className="bg-transparent border-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-white px-8 py-6 text-base rounded-full transition-all hover:scale-105">
            <Heart className="w-4 h-4 mr-2" /> Donate Now
          </Button>
        </Link>
      </motion.div>
    </>
  )

  if (loading) {
    return (
      <div className="min-h-[90vh] bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <img src="/images/logo/smgh-logo.png" alt="SMGH" className="h-20 mx-auto mb-6 animate-pulse brightness-0 invert" />
          <div className="flex items-center justify-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 rounded-full bg-green-400 animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 rounded-full bg-green-400 animate-bounce" />
          </div>
          <p className="text-gray-500 text-sm mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* ─── HERO SLIDER ─── */}
      <HeroSlider slides={heroSlides} interval={5000}>
        {heroContent}
      </HeroSlider>

      {/* ─── STATS SECTION ─── */}
      <section className="relative -mt-10 md:-mt-12 z-20 max-w-6xl mx-auto px-4">
        <AnimatedSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Calendar, label: 'Events Held', value: statEvents.count, suffix: '+', color: 'text-green-600', bg: 'bg-green-50', ref: statEvents.ref },
              { icon: Users, label: 'Beneficiaries', value: statBeneficiaries.count, suffix: '+', color: 'text-red-600', bg: 'bg-red-50' },
              { icon: TrendingUp, label: 'Raised (₵)', value: statRaised.count, suffix: 'K+', color: 'text-yellow-600', bg: 'bg-yellow-50', ref: statRaised.ref },
              { icon: Music, label: 'Gospel Artists', value: artists.length || 2, suffix: '+', color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-lg shadow-black/5 border border-gray-100 text-center hover:shadow-xl transition-shadow duration-300">
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-3`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <p ref={(stat as any).ref} className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}{stat.suffix}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ─── ABOUT / MISSION SECTION ─── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" /> Who We Are
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                Our <span className="text-green-600">Mission</span>
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                A faith-based movement dedicated to celebrating mothers and uplifting those in need across Ghana
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: HandHeart,
                title: settings.mission_card_1_title || 'Honour Mothers',
                description: settings.mission_card_1_desc || 'We celebrate the incredible love, sacrifice, and resilience of mothers through our annual worship night events held every Mother\'s Day. Since 2017, thousands have gathered to honour the irreplaceable role mothers play in our families, communities, and nation. It is a night of worship, prayer, and heartfelt appreciation.',
                color: 'bg-green-50 text-green-600 border-green-100',
              },
              {
                icon: Gift,
                title: settings.mission_card_2_title || 'Support the Needy',
                description: settings.mission_card_2_desc || 'Through the SMGH Foundation, we provide direct support to less privileged widows, single mothers, and rural pastors\' wives across Ghana. Our outreach includes cash donations, food items, clothing, school supplies for children, and other essential consumables distributed to beneficiaries in multiple communities.',
                color: 'bg-red-50 text-red-600 border-red-100',
              },
              {
                icon: Church,
                title: settings.mission_card_3_title || 'Worship & Praise',
                description: settings.mission_card_3_desc || 'Each Sweet Mothers Ghana event is a powerful night of worship featuring anointed gospel artists including Minister Bob and Minister Debby. These worship experiences have drawn thousands into deep encounters with God, creating lasting memories and spiritual transformation for attendees from across Ghana.',
                color: 'bg-purple-50 text-purple-600 border-purple-100',
              },
            ].map((item, idx) => (
              <AnimatedSection key={item.title} delay={idx * 0.15}>
                <div className={`rounded-2xl p-8 border ${item.color} hover:shadow-lg transition-all duration-300 h-full`}>
                  <div className={`w-14 h-14 rounded-xl ${item.color.split(' ')[0]} flex items-center justify-center mb-5`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <div className="text-gray-600 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: item.description }} />
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VISIONARY MESSAGE ─── */}
      <section className="py-24 px-4 bg-gradient-to-br from-gray-50 to-green-50/30">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="md:flex items-center gap-12">
              <div className="md:w-1/2 mb-8 md:mb-0">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img src="/images/team/robert-essuon.jpg" alt="Minister Bobby Essuon - Founder" className="w-full aspect-[3/4] sm:aspect-[3/4] md:aspect-[3/4] object-cover object-top" />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-green-900/90 to-transparent p-4 sm:p-6">
                    <p className="text-white font-bold text-base sm:text-xl">{settings.visionary_name || 'Minister Bobby Essuon'}</p>
                    <p className="text-green-200 text-xs sm:text-sm">Founder &amp; Visionary, Sweet Mothers Ghana</p>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2">
                <span className="text-green-600 font-semibold text-xs sm:text-sm uppercase tracking-wider">A Word From The Visionary</span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4 sm:mb-6">
                  Welcome to<br />
                  <span className="text-green-600">Sweet Mothers Ghana</span>
                </h2>
                {settings.visionary_message && settings.visionary_message.trim() !== '' && settings.visionary_message !== '<p></p>' ? (
                  <div className="text-gray-600 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: settings.visionary_message }} />
                ) : (
                  <>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      The love of God has led us to show that same Love, Care and Appreciation to our dear mothers and to encourage them to keep up with the task God has entrusted into their hands. Motherhood as you and I know, is not one of those regular responsibilities out there. Right from the inception of pregnancy to nurturing the child to become a responsible figure in the society.
                    </p>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      We don&apos;t just stop there, we also have a great passion for those of them who are finding it difficult to take care of their wards due to one reason and the other. Some are single parenting probably because they have lost their husbands, others due to broken homes etc. We see the need to assist such mothers as well so as to push harder and bring their children up properly.
                    </p>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      This is why we have the <strong className="text-green-700">SWEET MOTHERS FOUNDATION</strong> where we raise funds to support mothers who are in very heart-breaking situations.
                    </p>
                    <p className="text-gray-500 italic text-sm">
                      We therefore welcome you to join us in fighting for these mothers and their children. Thank you. <span className="text-green-700 font-medium">~{settings.visionary_name || 'Minister Bobby Essuon'}.</span>
                    </p>
                  </>
                )}
                <div className="flex gap-4 mt-8">
                  <Link to="/foundation">
                    <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-600 hover:text-white rounded-full px-6 transition-all">
                      SMGH Foundation
                    </Button>
                  </Link>
                  <Link to="/team">
                    <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-full px-6 transition-all">
                      Meet the Team
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── COUNTDOWN TO NEXT EVENT ─── */}
      {upcomingEvents.length > 0 && (
        <section className="py-20 px-4 bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          </div>
          <div className="max-w-6xl mx-auto relative z-10">
            <AnimatedSection>
              <div className="text-center mb-10">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-medium mb-4">
                  <Timer className="w-4 h-4" /> Counting Down
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {upcomingEvents[0].title}
                </h2>
                <p className="text-green-100">{formatDate(upcomingEvents[0].date)} &bull; {upcomingEvents[0].venue}, {upcomingEvents[0].city}</p>
              </div>
              <div className="flex justify-center gap-4 md:gap-8 mb-10">
                {[
                  { value: countdown.days, label: 'Days' },
                  { value: countdown.hours, label: 'Hours' },
                  { value: countdown.minutes, label: 'Minutes' },
                  { value: countdown.seconds, label: 'Seconds' },
                ].map(item => (
                  <div key={item.label} className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 md:p-6 min-w-[70px] md:min-w-[100px] border border-white/20">
                    <p className="text-3xl md:text-5xl font-bold text-white">{String(item.value).padStart(2, '0')}</p>
                    <p className="text-green-100 text-xs md:text-sm mt-1 uppercase tracking-wider">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to={`/events/${upcomingEvents[0].slug}`}>
                  <Button size="lg" className="bg-white text-green-700 hover:bg-gray-100 px-8 py-6 text-base rounded-full shadow-lg font-semibold transition-all hover:scale-105">
                    <Calendar className="w-4 h-4 mr-2" /> Event Details
                  </Button>
                </Link>
                <Link to="/donate">
                  <Button size="lg" className="bg-transparent border border-white/40 text-white hover:bg-white/20 hover:border-white/60 px-8 py-6 text-base rounded-full transition-all">
                    <Heart className="w-4 h-4 mr-2" /> Support This Event
                  </Button>
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ─── FEATURED / LATEST EVENT ─── */}
      {!upcomingEvents.length && latestEvent && (
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {latestEvent.status === 'upcoming' ? 'Upcoming Event' : 'Latest Event'}
                </h2>
                <div className="w-16 h-1 bg-green-600 mx-auto rounded-full" />
              </div>
              <div className="relative rounded-3xl overflow-hidden bg-white shadow-xl shadow-black/5 border border-gray-100">
                <div className="md:flex">
                  <div className="md:w-1/2 h-56 sm:h-64 md:h-auto">
                    <img
                      src={latestEvent.bannerImage || '/images/events/2024/banner.jpg'}
                      alt={latestEvent.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium w-fit mb-4 ${
                      latestEvent.status === 'upcoming' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {latestEvent.status === 'upcoming' ? '\u25CF Coming Soon' : '\u25CF Completed'}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{latestEvent.title}</h3>
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span>{formatDate(latestEvent.date)}</span>
                      </div>
                      {latestEvent.time && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4 text-green-600" />
                          <span>{latestEvent.time}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <span>{latestEvent.venue}, {latestEvent.city}</span>
                      </div>
                    </div>
                    <Link to={`/events/${latestEvent.slug}`}>
                      <Button className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 transition-all">
                        View Details <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ─── TESTIMONIALS CAROUSEL ─── */}
      {testimonials.length > 0 && (
        <section className="py-24 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-12">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-red-700 text-sm font-medium mb-4">
                  <Quote className="w-4 h-4" /> Testimonials
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                  What People <span className="text-red-600">Say</span>
                </h2>
                <p className="text-gray-600 max-w-xl mx-auto">Hear from attendees and supporters of Sweet Mothers Ghana events</p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="relative max-w-3xl mx-auto">
                <div className="relative bg-gradient-to-br from-gray-50 to-green-50/30 rounded-3xl p-8 md:p-12 border border-gray-100 min-h-[220px] flex flex-col justify-center">
                  <Quote className="absolute top-6 left-8 w-10 h-10 text-green-200" />

                  {/* Fade transition for testimonials */}
                  <div className="relative">
                    {testimonials.map((t, idx) => (
                      <div
                        key={t.id}
                        className={`transition-all duration-700 ${
                          idx === currentTestimonial ? 'opacity-100 relative' : 'opacity-0 absolute inset-0'
                        }`}
                      >
                        <p className="text-gray-700 text-lg md:text-xl leading-relaxed italic mb-6 pt-8">
                          &ldquo;{t.quote}&rdquo;
                        </p>
                        <div className="flex items-center gap-3">
                          {t.photo ? (
                            <img
                              src={t.photo}
                              alt={t.author}
                              className="w-12 h-12 rounded-full object-cover border-2 border-green-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-200">
                              <span className="text-green-700 font-bold text-sm">
                                {t.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{t.author}</p>
                            <p className="text-gray-500 text-sm">{t.event?.title || 'SMGH Event'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Navigation dots */}
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentTestimonial(prev => (prev - 1 + testimonials.length) % testimonials.length)}
                      className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    {testimonials.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentTestimonial(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                          idx === currentTestimonial ? 'bg-green-600 w-6' : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                    <button
                      onClick={() => setCurrentTestimonial(prev => (prev + 1) % testimonials.length)}
                      className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ─── FEATURED ARTISTS ─── */}
      {artists.length > 0 && (
        <section className="py-24 px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 right-10 w-64 h-64 border border-white rounded-full" />
            <div className="absolute bottom-10 left-10 w-48 h-48 border border-white rounded-full" />
          </div>
          <div className="max-w-6xl mx-auto relative z-10">
            <AnimatedSection>
              <div className="text-center mb-12">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-green-300 text-sm font-medium mb-4">
                  <Music className="w-4 h-4" /> Featured Artists
                </span>
                <h2 className="text-3xl md:text-5xl font-bold mb-4">
                  Gospel <span className="text-green-400">Ministers</span>
                </h2>
                <p className="text-gray-400 max-w-xl mx-auto">Anointed gospel artists who have blessed the SMGH stage with powerful ministrations</p>
              </div>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {artists.map((artist, idx) => (
                <AnimatedSection key={artist.id} delay={idx * 0.15}>
                  <div className="group bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-green-400/30 transition-all duration-300 hover:shadow-2xl hover:shadow-green-900/20">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={artist.image || '/images/artists/minister-bob.jpg'}
                        alt={artist.name}
                        className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-bold text-white">{artist.name}</h3>
                        {artist.location && (
                          <p className="text-green-300 text-sm flex items-center gap-1 mt-1">
                            <MapPinned className="w-3.5 h-3.5" /> {artist.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                        {artist.bio || 'Anointed gospel minister featured at Sweet Mothers Ghana worship nights.'}
                      </p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link to="/artists">
                <Button className="bg-transparent border border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-full px-8 transition-all">
                  View All Artists <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── PAST EVENTS GRID ─── */}
      {completedEvents.length > 0 && (
        <section className="py-24 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-12">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-medium mb-4">
                  <Calendar className="w-4 h-4" /> Our History
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Our Events</h2>
                <p className="text-gray-600 max-w-xl mx-auto">Eight years of worship, celebration, and impact across Ghana</p>
                <div className="w-16 h-1 bg-red-600 mx-auto rounded-full mt-4" />
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedEvents.slice(0, 6).map(event => (
                  <Link key={event.id} to={`/events/${event.slug}`}>
                    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer h-full">
                      <div className="relative aspect-video overflow-hidden">
                        <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                            {new Date(event.date).getFullYear()}
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="font-bold text-white text-lg leading-tight drop-shadow">{event.title}</h3>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="w-3.5 h-3.5" />
                          {event.venue}, {event.city}
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-gray-400 text-xs">{formatDate(event.date).split(',').slice(0, 2).join(',')}</span>
                          <span className="text-green-600 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                            View <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-10">
                <Link to="/events">
                  <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-600 hover:text-white rounded-full px-8 transition-all">
                    View All Events <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ─── FOUNDATION IMPACT TIMELINE ─── */}
      {foundation.length > 0 && (
        <section className="py-24 px-4 bg-gradient-to-br from-red-50 via-white to-green-50">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-16">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-red-700 text-sm font-medium mb-4">
                  <Heart className="w-4 h-4" /> Our Impact
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                  Foundation <span className="text-red-600">Impact</span>
                </h2>
                <p className="text-gray-600 max-w-xl mx-auto">Year after year, the SMGH Foundation expands its reach and deepens its impact on mothers and families in need across Ghana</p>
              </div>
            </AnimatedSection>

            <div className="relative">
              {/* Center timeline line */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-300 via-red-300 to-green-300 -translate-x-1/2" />

              <div className="space-y-8 md:space-y-0">
                {foundation.map((record, idx) => (
                  <AnimatedSection key={`${record.year}-${idx}`} delay={idx * 0.15}>
                    <div className={`md:flex items-center gap-8 mb-8 ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                      <div className={`md:w-1/2 ${idx % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                        <div className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-100 inline-block max-w-md hover:shadow-xl transition-shadow ${idx % 2 === 0 ? 'md:ml-auto' : ''}`}>
                          <div className={`flex items-center gap-3 mb-3 ${idx % 2 === 0 ? 'md:justify-end' : ''}`}>
                            <span className="text-3xl font-bold text-green-700">{record.year}</span>
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed mb-4">
                            {record.description}
                          </p>
                          <div className="flex gap-4 flex-wrap">
                            {record.beneficiariesCount && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                                <Users className="w-3.5 h-3.5" /> {record.beneficiariesCount} beneficiaries
                              </span>
                            )}
                            {record.amountRaised && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-medium">
                                <TrendingUp className="w-3.5 h-3.5" /> ₵{record.amountRaised.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Timeline dot */}
                      <div className="hidden md:flex w-6 h-6 rounded-full bg-green-500 border-4 border-white shadow-lg z-10 mx-auto flex-shrink-0" />
                      <div className="md:w-1/2 hidden md:block" />
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>

            <div className="text-center mt-12">
              <Link to="/foundation">
                <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8 transition-all hover:scale-105 shadow-lg shadow-red-600/20">
                  Learn More About Our Foundation <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── GALLERY PREVIEW ─── */}
      {gallery.length > 0 && (
        <section className="py-24 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-12">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 text-purple-700 text-sm font-medium mb-4">
                  <Globe className="w-4 h-4" /> Moments
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Gallery</h2>
                <p className="text-gray-600">Captured moments from our events and outreach programs across Ghana</p>
                <div className="w-16 h-1 bg-red-600 mx-auto rounded-full mt-4" />
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {gallery.slice(0, 8).map((gi, idx) => (
                  <div key={gi.id} className={`relative rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer bg-gray-200 ${idx === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
                    <img
                      src={gi.thumbnail || gi.url}
                      alt={gi.title || 'Gallery'}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end p-4">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-medium">{gi.title}</p>
                        {gi.year && <p className="text-gray-300 text-xs">{gi.year}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-10">
                <Link to="/gallery">
                  <Button variant="outline" className="border-red-600 text-red-700 hover:bg-red-600 hover:text-white rounded-full px-8 transition-all">
                    View Full Gallery <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ─── NEWSLETTER & SOCIAL ─── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Newsletter */}
            <AnimatedSection>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 md:p-10 border border-green-100 h-full">
                <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-5">
                  <Send className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Stay Updated</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Subscribe to our newsletter and never miss an event update, foundation outreach report, or worship highlight. Join hundreds of supporters who stay connected with the SMGH family through regular updates delivered straight to your inbox.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const form = e.target as HTMLFormElement
                    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value
                    if (email) {
                      fetch('/api/newsletter', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email }),
                      })
                      form.reset()
                      toast({ title: 'Thank you for subscribing!', description: 'You will receive our latest updates and event notifications.' })
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="email"
                    name="email"
                    placeholder="Your email address"
                    required
                    className="flex-1 px-4 py-3 rounded-xl bg-white border border-green-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                  />
                  <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 rounded-xl transition-all">
                    Subscribe
                  </Button>
                </form>
              </div>
            </AnimatedSection>

            {/* Social Media */}
            <AnimatedSection delay={0.15}>
              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-3xl p-8 md:p-10 border border-red-100 h-full">
                <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center mb-5">
                  <Globe className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Connect With Us</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Follow Sweet Mothers Ghana across all social media platforms for behind-the-scenes content, live event streams, inspiring stories from our foundation outreach, and daily inspiration from our ministry.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: Facebook, label: 'Facebook', url: settings.facebook_url || 'https://facebook.com/sweetmothersgh', color: 'bg-blue-600 hover:bg-blue-700', desc: 'Like our page for event updates and photos' },
                    { icon: Youtube, label: 'YouTube', url: settings.youtube_url || 'https://youtube.com/@sweetmothersgh', color: 'bg-red-600 hover:bg-red-700', desc: 'Watch worship highlights and full event videos' },
                    { icon: Instagram, label: 'Instagram', url: settings.instagram_url || 'https://instagram.com/sweetmothersgh', color: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700', desc: 'Follow us for daily inspiration and event moments' },
                  ].map(social => (
                    <a
                      key={social.label}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-3 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all group"
                    >
                      <div className={`w-10 h-10 rounded-lg ${social.color} text-white flex items-center justify-center flex-shrink-0 transition-colors`}>
                        <social.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{social.label}</p>
                        <p className="text-gray-500 text-xs truncate">{social.desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── FOUNDATION CTA ─── */}
      <section className="py-24 px-4 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="/images/events/2021/gallery-3.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/80" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <AnimatedSection>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 backdrop-blur-sm mb-6">
              <Heart className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Support Our Mission</h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-4 leading-relaxed">
              SMGH Foundation was established in 2017 to provide support to less privileged widows and rural pastors&apos; wives. We make donations in cash, food stuffs and other consumables to bring hope and relief to those who need it most.
            </p>
            <p className="text-gray-400 text-sm max-w-xl mx-auto mb-10">
              Full operations started from 2021, even though some donations were made annually from 2017 to 2020. Your generous contribution helps us reach more mothers and families every year.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/donate">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-base rounded-full shadow-lg shadow-red-600/25 transition-all hover:scale-105">
                  <Heart className="w-4 h-4 mr-2" /> Donate Now
                </Button>
              </Link>
              <Link to="/foundation">
                <Button size="lg" className="bg-transparent border border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-8 py-6 text-base rounded-full transition-all">
                  Learn About Our Foundation
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  )
}
