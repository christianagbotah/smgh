'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from '@/lib/router'
import { Calendar, MapPin, Filter, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  tags: string | null
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')

  useEffect(() => {
    fetch('/api/events?limit=50')
      .then(async r => {
        if (!r.ok) throw new Error(`API returned ${r.status}`)
        return r.json()
      })
      .then(data => {
        setEvents(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch events:', err)
        setEvents([])
        setLoading(false)
      })
  }, [])

  const years = ['all', ...Array.from(new Set(events.map(e => new Date(e.date).getFullYear()))).sort((a, b) => b - a)]

  const filtered = events.filter(e => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false
    if (yearFilter !== 'all' && new Date(e.date).getFullYear() !== parseInt(yearFilter)) return false
    return true
  })

  const upcoming = filtered.filter(e => e.status === 'upcoming')
  const completed = filtered.filter(e => e.status === 'completed')

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Hero */}
      <section className="relative bg-smgh-dark py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-smgh-green-dark/50 to-smgh-dark" />
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <motion.h1 variants={item} className="text-4xl md:text-5xl font-bold text-white mb-4">Our Events</motion.h1>
          <motion.p variants={item} className="text-gray-400 text-lg max-w-2xl mx-auto">
            Eight years of worship, celebration, and community impact across Ghana
          </motion.p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 px-4 bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Filter className="w-4 h-4" /> Filter:
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'upcoming', 'completed'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  statusFilter === s
                    ? 'bg-smgh-green text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s === 'all' ? 'All Events' : s === 'upcoming' ? 'Upcoming' : 'Completed'}
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
                  yearFilter === y
                    ? 'bg-smgh-red text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {y === 'all' ? 'All Years' : y}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl aspect-[3/4] animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Upcoming — single hero card when 1 event, grid for multiple */}
              {upcoming.length > 0 && (
                <div className="mb-16">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-smgh-green rounded-full animate-pulse" /> Upcoming Events
                  </h2>
                  {upcoming.length === 1 ? (
                    /* ── Single upcoming event: full-width hero card ── */
                    <motion.div key={upcoming[0].id} variants={item}>
                      <Link to={`/events/${upcoming[0].slug}`}>
                        <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer">
                          <div className="flex flex-col md:flex-row">
                            {/* Image side */}
                            <div className="relative w-full md:w-[380px] lg:w-[440px] flex-shrink-0">
                              <div className="aspect-[3/4] md:h-full md:aspect-auto overflow-hidden">
                                <img
                                  src={upcoming[0].bannerImage || `https://picsum.photos/seed/${upcoming[0].slug}/600/800`}
                                  alt={upcoming[0].title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                              <div className="absolute top-4 left-4">
                                <span className="px-3 py-1.5 bg-smgh-green text-white text-xs font-semibold rounded-full animate-pulse shadow-lg">
                                  ● Upcoming
                                </span>
                              </div>
                            </div>
                            {/* Content side */}
                            <div className="flex-1 p-6 md:p-8 lg:p-10 flex flex-col justify-center">
                              <h3 className="font-bold text-gray-900 group-hover:text-smgh-green transition-colors text-xl md:text-2xl lg:text-3xl">{upcoming[0].title}</h3>
                              <div className="space-y-2.5 mt-5">
                                <div className="flex items-center gap-2.5 text-gray-600 text-sm">
                                  <div className="w-8 h-8 rounded-lg bg-smgh-green/10 flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-4 h-4 text-smgh-green" />
                                  </div>
                                  {new Date(upcoming[0].date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                                {upcoming[0].time && (
                                  <div className="flex items-center gap-2.5 text-gray-600 text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-smgh-green/10 flex items-center justify-center flex-shrink-0">
                                      <span className="text-smgh-green text-sm">⏰</span>
                                    </div>
                                    {upcoming[0].time}
                                  </div>
                                )}
                                <div className="flex items-center gap-2.5 text-gray-600 text-sm">
                                  <div className="w-8 h-8 rounded-lg bg-smgh-green/10 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-4 h-4 text-smgh-green" />
                                  </div>
                                  {upcoming[0].venue}, {upcoming[0].city}
                                </div>
                              </div>
                              <div className="mt-6">
                                <span className="inline-flex items-center gap-1.5 bg-smgh-green text-white px-5 py-2.5 rounded-full font-medium text-sm group-hover:bg-smgh-green-dark transition-all shadow-md shadow-smgh-green/20">
                                  View Details <ArrowRight className="w-4 h-4" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ) : (
                    /* ── Multiple upcoming events: grid ── */
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {upcoming.map(event => (
                        <motion.div key={event.id} variants={item}>
                          <Link to={`/events/${event.slug}`}>
                            <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 cursor-pointer h-full flex flex-col">
                              <div className="relative aspect-[3/4] overflow-hidden">
                                <img
                                  src={event.bannerImage || `https://picsum.photos/seed/${event.slug}/600/800`}
                                  alt={event.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-3 left-3">
                                  <span className="px-3 py-1 bg-smgh-green text-white text-xs font-semibold rounded-full animate-pulse">
                                    ● Upcoming
                                  </span>
                                </div>
                              </div>
                              <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-gray-900 group-hover:text-smgh-green transition-colors text-lg">{event.title}</h3>
                                <div className="space-y-1.5 mt-3 flex-1">
                                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                                  </div>
                                  {event.time && (
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                      <span className="w-3.5 h-3.5 text-smgh-green text-xs">⏰</span>
                                      {event.time}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {event.venue}, {event.city}
                                  </div>
                                </div>
                                <div className="mt-4">
                                  <span className="text-smgh-green font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                    View Details <ArrowRight className="w-3.5 h-3.5" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Completed */}
              {completed.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full" /> Past Events
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completed.map(event => (
                      <motion.div key={event.id} variants={item}>
                        <Link to={`/events/${event.slug}`}>
                          <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 cursor-pointer h-full flex flex-col">
                            <div className="relative aspect-[3/4] overflow-hidden">
                              <img
                                src={event.bannerImage || `https://picsum.photos/seed/${event.slug}/600/800`}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute top-3 left-3">
                                <span className="px-3 py-1 bg-gray-800 text-white text-xs font-medium rounded-full">
                                  {new Date(event.date).getFullYear()}
                                </span>
                              </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                              <h3 className="font-bold text-gray-900 group-hover:text-smgh-green transition-colors">{event.title}</h3>
                              <div className="flex items-center gap-2 text-gray-500 text-sm mt-2">
                                <MapPin className="w-3.5 h-3.5" />
                                {event.venue}, {event.city}
                              </div>
                              <div className="mt-auto pt-4">
                                <span className="text-gray-500 font-medium text-sm flex items-center gap-1 group-hover:text-smgh-green group-hover:gap-2 transition-all">
                                  View Details <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {filtered.length === 0 && (
                <div className="text-center py-20">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400">No events found</h3>
                  <p className="text-gray-400 mt-2">Try adjusting your filters</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </motion.div>
  )
}
