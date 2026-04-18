'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Calendar, MapPin, ChevronRight } from 'lucide-react'

interface Event {
  id: string
  title: string
  date: string
  venue: string
  city: string
  description: string | null
  status: string
}

export default function EventsTimeline() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [events, setEvents] = useState<Event[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/events?status=completed&limit=20')
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(() => {})
  }, [])

  const completedEvents = events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <section id="events" className="py-20 md:py-32 relative overflow-hidden" ref={ref}>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-smgh-gold/30 to-transparent" />
      <div className="absolute bottom-1/3 left-0 w-80 h-80 bg-smgh-gold/3 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-smgh-gold text-sm font-semibold uppercase tracking-widest mb-4 block">
            Our Journey
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Events <span className="text-gradient-gold">Timeline</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            A journey of worship, praise, and celebration of motherhood spanning over 8 years
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Center line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-smgh-gold/50 via-smgh-gold/20 to-transparent" />

          <div className="space-y-8 md:space-y-12">
            {completedEvents.map((event, index) => {
              const isLeft = index % 2 === 0
              const eventDate = new Date(event.date)
              const year = eventDate.getFullYear()

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`relative flex items-start gap-6 ${
                    isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                  } flex-col md:flex-row`}
                >
                  {/* Content Card */}
                  <div className={`flex-1 ${isLeft ? 'md:text-right' : 'md:text-left'}`}>
                    <div
                      className="glass rounded-2xl p-6 hover:border-smgh-gold/30 transition-all duration-300 cursor-pointer group"
                      onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-smgh-gold font-bold text-2xl">{year}</span>
                      </div>
                      <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-smgh-gold transition-colors">
                        {event.title}
                      </h3>
                      <div className={`flex flex-col gap-1 text-sm text-gray-400 mb-3 ${isLeft ? 'md:items-end' : 'md:items-start'}`}>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {event.venue}, {event.city}
                        </span>
                      </div>
                      {expandedId === event.id && event.description && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-gray-300 text-sm leading-relaxed"
                        >
                          {event.description}
                        </motion.p>
                      )}
                      <button className="flex items-center gap-1 text-smgh-gold text-sm mt-2 group-hover:gap-2 transition-all">
                        {expandedId === event.id ? 'Show less' : 'Read more'}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Center Dot */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full gradient-gold items-center justify-center z-10 mt-8">
                    <div className="w-2 h-2 rounded-full bg-black" />
                  </div>

                  {/* Spacer */}
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
