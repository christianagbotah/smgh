'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Calendar, MapPin, Clock, Ticket, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Event {
  id: string
  title: string
  date: string
  venue: string
  city: string
  description: string | null
  status: string
}

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = targetDate.getTime() - new Date().getTime()
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        })
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  return (
    <div className="flex gap-4">
      {[
        { v: timeLeft.days, l: 'Days' },
        { v: timeLeft.hours, l: 'Hours' },
        { v: timeLeft.minutes, l: 'Min' },
        { v: timeLeft.seconds, l: 'Sec' },
      ].map(b => (
        <div key={b.l} className="text-center">
          <div className="gradient-teal rounded-xl w-14 h-14 md:w-16 md:h-16 flex items-center justify-center mb-1">
            <span className="text-xl md:text-2xl font-bold text-black">
              {String(b.v).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">{b.l}</span>
        </div>
      ))}
    </div>
  )
}

export default function UpcomingEvents() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    fetch('/api/events?status=upcoming&limit=5')
      .then(res => res.json())
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  if (events.length === 0) return null

  const nextEvent = events[0]
  const eventDate = new Date(nextEvent.date)

  return (
    <section className="py-20 md:py-32 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#101010] via-smgh-navy/30 to-[#101010]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-smgh-teal/5 rounded-full blur-3xl" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-smgh-teal text-sm font-semibold uppercase tracking-widest mb-4 block">
            Coming Up Next
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            Upcoming <span className="text-gradient-teal">Event</span>
          </h2>
        </motion.div>

        {/* Main Event Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass rounded-3xl p-8 md:p-12 relative overflow-hidden"
        >
          {/* Decorative glow */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-smgh-teal/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-smgh-gold/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-smgh-teal/10 text-smgh-teal text-xs font-medium mb-4">
                  <span className="w-2 h-2 rounded-full bg-smgh-teal animate-pulse" />
                  Upcoming
                </span>
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                  {nextEvent.title}
                </h3>
                <div className="flex flex-col gap-2 text-gray-300 mb-6">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-smgh-teal" />
                    {eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-smgh-teal" />
                    5:00 PM
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-smgh-teal" />
                    {nextEvent.venue}, {nextEvent.city}
                  </span>
                </div>
                {nextEvent.description && (
                  <p className="text-gray-400 mb-6">{nextEvent.description}</p>
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button className="gradient-teal text-black font-semibold">
                    <Ticket className="w-4 h-4 mr-2" />
                    Register Now
                  </Button>
                  <a
                    href="https://wa.link/jdnvkt"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="border-smgh-teal/50 text-smgh-teal hover:bg-smgh-teal/10">
                      Contact Us
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-gray-500 text-sm uppercase tracking-wider mb-4">Countdown</p>
                <CountdownTimer targetDate={eventDate} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
