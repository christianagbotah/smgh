'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from '@/lib/router'
import {
  Heart, Users, DollarSign, MapPin, ArrowRight, Quote, HandHeart,
  Search, ClipboardCheck, Package, Eye, Calendar, ArrowDown,
  ChevronDown, ChevronUp, Building2, GraduationCap, Gift, Briefcase
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface FoundationRecord {
  id: string
  year: number
  description: string
  amountRaised: number | null
  amountSpent: number | null
  beneficiariesCount: number | null
  locations: string | null
  galleryItems?: { id: string; url: string; thumbnail: string | null; title: string | null }[]
}

interface Beneficiary {
  id: string
  name: string
  story: string | null
  photo: string | null
  category: string | null
  location: string | null
  yearHelped: number | null
}

interface FoundationGalleryItem {
  id: string
  title: string | null
  url: string
  thumbnail: string | null
  category: string | null
  year: number | null
}

function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const animated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true
          const duration = 2000
          const steps = 60
          const stepValue = value / steps
          let current = 0
          const interval = setInterval(() => {
            current += stepValue
            if (current >= value) {
              setDisplayValue(value)
              clearInterval(interval)
            } else {
              setDisplayValue(Math.floor(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])

  return (
    <div ref={ref}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </div>
  )
}

export default function FoundationPage() {
  const [records, setRecords] = useState<FoundationRecord[]>([])
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [galleryItems, setGalleryItems] = useState<FoundationGalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedYear, setExpandedYear] = useState<number | null>(null)
  const [expandedBeneficiary, setExpandedBeneficiary] = useState<string | null>(null)
  const [galleryFilter, setGalleryFilter] = useState<string>('all')

  useEffect(() => {
    Promise.all([
      fetch('/api/foundation').then(r => r.json()),
      fetch('/api/beneficiaries').then(r => r.json()),
      fetch('/api/gallery?category=foundation&limit=50').then(r => r.json()),
    ]).then(([recs, bens, gallery]) => {
      setRecords(recs.records || recs)
      setBeneficiaries(bens)
      setGalleryItems(gallery)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const totalBeneficiaries = records.reduce((sum, r) => sum + (r.beneficiariesCount || 0), 0)
  const totalRaised = records.reduce((sum, r) => sum + (r.amountRaised || 0), 0)
  const totalSpent = records.reduce((sum, r) => sum + (r.amountSpent || 0), 0)
  const yearsActive = records.length > 0 ? new Date().getFullYear() - Math.min(...records.map(r => r.year)) + 1 : 0

  const filteredGallery = galleryFilter === 'all' ? galleryItems : galleryItems.filter(g => g.year?.toString() === galleryFilter)
  const galleryYears = [...new Set(galleryItems.map(g => g.year).filter(Boolean))].sort((a, b) => (b || 0) - (a || 0))

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  const howItWorks = [
    { icon: Search, title: 'Identify', desc: 'We identify widows, single mothers, and the less privileged in communities across Ghana through local church networks and community leaders.' },
    { icon: HandHeart, title: 'Raise Funds', desc: 'Through our annual worship night events, individual donations, and corporate sponsorships, we raise funds to support our programs.' },
    { icon: Package, title: 'Distribute', desc: 'We distribute food items, clothing, educational materials, and provide skill training and micro-loans to beneficiaries.' },
    { icon: Eye, title: 'Follow Up', desc: 'Our team conducts regular follow-ups to ensure beneficiaries are thriving and to identify additional support needs.' },
  ]

  const getInvolved = [
    { icon: Heart, title: 'Donate', desc: 'Make a one-time or recurring donation to support our programs and help change lives.', action: '/donate', actionLabel: 'Donate Now', color: 'bg-smgh-red hover:bg-smgh-red-dark', textColor: 'text-white' },
    { icon: Users, title: 'Volunteer', desc: 'Join our team of dedicated volunteers who make our outreach programs possible.', action: '/contact', actionLabel: 'Contact Us', color: 'bg-smgh-green hover:bg-smgh-green-dark', textColor: 'text-white' },
    { icon: Building2, title: 'Partner', desc: 'Corporate organizations and churches can partner with us to expand our reach and impact.', action: '/donate?mode=partner', actionLabel: 'Become a Partner', color: 'bg-smgh-gold hover:bg-yellow-500', textColor: 'text-black' },
  ]

  const getCategoryIcon = (cat: string | null) => {
    switch (cat) {
      case 'widow': return <Heart className="w-4 h-4" />
      case 'single-mother': return <Users className="w-4 h-4" />
      case 'pastor-wife': return <GraduationCap className="w-4 h-4" />
      default: return <Gift className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Skeleton className="h-[50vh] w-full" />
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Hero Section */}
      <section className="relative py-28 md:py-36 overflow-hidden bg-smgh-dark">
        <div className="absolute inset-0 bg-gradient-to-br from-smgh-green-dark/40 via-smgh-dark to-smgh-red-dark/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(46,125,50,0.15),transparent_50%)]" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/70 text-sm mb-6 backdrop-blur-sm border border-white/5">
            <Heart className="w-4 h-4 text-smgh-red" /> SMGH Foundation
          </motion.div>
          <motion.h1 variants={item} className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Changing Lives,<br /><span className="text-gradient-green">One Mother at a Time</span>
          </motion.h1>
          <motion.p variants={item} className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Through the SMGH Foundation, we provide food, clothing, education, skill training, and micro-loans to widows, single mothers, and the less privileged across Ghana.
          </motion.p>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="relative -mt-16 z-10 max-w-5xl mx-auto px-4">
        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Total Beneficiaries', value: totalBeneficiaries, color: 'text-smgh-green', bg: 'bg-white' },
            { icon: DollarSign, label: 'Total Raised', value: totalRaised, prefix: '₵', color: 'text-smgh-red', bg: 'bg-white' },
            { icon: Briefcase, label: 'Total Invested', value: totalSpent, prefix: '₵', color: 'text-smgh-gold', bg: 'bg-white' },
            { icon: Calendar, label: 'Years Active', value: yearsActive, color: 'text-smgh-green-dark', bg: 'bg-white' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl p-6 shadow-xl shadow-black/10 border border-gray-100 text-center hover:shadow-2xl transition-shadow`}>
              <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
              <div className="text-2xl md:text-3xl font-bold text-gray-900">
                <AnimatedCounter value={stat.value} prefix={stat.prefix || ''} />
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* About Foundation */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={item} className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-smgh-green/10 text-smgh-green border-0 mb-4">About Us</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Foundation&apos;s Mission</h2>
              <p className="text-gray-600 leading-relaxed mb-4 text-justify">
                The SMGH Foundation was established in 2017 alongside the first Sweet Mothers Ghana worship night, with full charitable operations beginning in 2021. Our mission is rooted in the biblical principle of caring for widows and the less privileged.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6 text-justify">
                We believe that every mother deserves dignity, support, and the opportunity to provide for her family. Through our programs, we empower women to become self-sufficient, break the cycle of poverty, and build better futures for their children.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-smgh-green font-medium">
                  <div className="w-2 h-2 rounded-full bg-smgh-green" /> Founded 2017
                </div>
                <div className="flex items-center gap-2 text-smgh-red font-medium">
                  <div className="w-2 h-2 rounded-full bg-smgh-red" /> Full Operations 2021
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://picsum.photos/seed/foundation-about/600/500"
                  alt="SMGH Foundation"
                  className="w-full aspect-[3/4] object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-xl border border-gray-100">
                <p className="text-2xl font-bold text-smgh-green">{totalBeneficiaries}+</p>
                <p className="text-xs text-gray-500">Lives Changed</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Yearly Impact Timeline */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={item} className="text-center mb-14">
            <Badge className="bg-smgh-red/10 text-smgh-red border-0 mb-4">Our Journey</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Yearly Impact Records</h2>
            <p className="text-gray-600 max-w-xl mx-auto">Track our progress and see how your support has made a difference each year</p>
            <div className="w-16 h-1 bg-smgh-green mx-auto rounded-full mt-4" />
          </motion.div>

          <div className="space-y-4">
            {records.sort((a, b) => b.year - a.year).map((rec, idx) => {
              const locations: string[] = rec.locations ? JSON.parse(rec.locations) : []
              const isExpanded = expandedYear === rec.year
              const isLeft = idx % 2 === 0
              return (
                <motion.div key={rec.id} variants={item}>
                  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <button
                      onClick={() => setExpandedYear(isExpanded ? null : rec.year)}
                      className="w-full p-6 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl gradient-green flex items-center justify-center text-white font-bold text-lg shadow-md shadow-smgh-green/20">
                          {rec.year.toString().slice(-2)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{rec.year}</h3>
                          <p className="text-gray-500 text-sm line-clamp-1 max-w-lg">{rec.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-6 text-sm">
                          {rec.beneficiariesCount && (
                            <span className="text-smgh-green font-semibold">{rec.beneficiariesCount} beneficiaries</span>
                          )}
                          {rec.amountRaised && (
                            <span className="text-gray-500">₵{rec.amountRaised.toLocaleString()} raised</span>
                          )}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                        </div>
                      </div>
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 border-t border-gray-100 pt-6">
                            <p className="text-gray-700 leading-relaxed mb-6">{rec.description}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                              {rec.amountRaised && (
                                <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                                  <p className="text-sm text-gray-500 mb-1">Raised</p>
                                  <p className="text-xl font-bold text-smgh-green">₵{rec.amountRaised.toLocaleString()}</p>
                                </div>
                              )}
                              {rec.amountSpent && (
                                <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
                                  <p className="text-sm text-gray-500 mb-1">Invested</p>
                                  <p className="text-xl font-bold text-smgh-red">₵{rec.amountSpent.toLocaleString()}</p>
                                </div>
                              )}
                              {rec.beneficiariesCount && (
                                <div className="bg-yellow-50 rounded-xl p-4 text-center border border-yellow-100">
                                  <p className="text-sm text-gray-500 mb-1">Beneficiaries</p>
                                  <p className="text-xl font-bold text-smgh-gold">{rec.beneficiariesCount}</p>
                                </div>
                              )}
                              {locations.length > 0 && (
                                <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                                  <p className="text-sm text-gray-500 mb-1">Locations</p>
                                  <p className="text-xl font-bold text-blue-600">{locations.length}</p>
                                </div>
                              )}
                            </div>
                            {locations.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-6">
                                <span className="text-sm text-gray-500 font-medium">Areas covered:</span>
                                {locations.map((loc, i) => (
                                  <Badge key={i} variant="secondary" className="bg-gray-100 text-gray-600 text-xs border-0 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />{loc}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {rec.galleryItems && rec.galleryItems.length > 0 && (
                              <div>
                                <p className="text-sm text-gray-500 font-medium mb-3">Photos from {rec.year}</p>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                                  {rec.galleryItems.slice(0, 8).map(gi => (
                                    <div key={gi.id} className="rounded-lg sm:rounded-xl overflow-hidden bg-gray-100">
                                      <img src={gi.thumbnail || gi.url} alt={gi.title || ''} className="w-full h-auto object-cover hover:scale-105 transition-transform" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={item} className="text-center mb-14">
            <Badge className="bg-smgh-green/10 text-smgh-green border-0 mb-4">Process</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-xl mx-auto">Our systematic approach to supporting mothers and the less privileged</p>
            <div className="w-16 h-1 bg-smgh-green mx-auto rounded-full mt-4" />
          </motion.div>
          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((step, idx) => (
              <motion.div key={step.title} variants={item} className="relative text-center">
                {idx < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-smgh-green/30 to-transparent" />
                )}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-smgh-green/10 to-smgh-green/5 border border-smgh-green/20 flex items-center justify-center mx-auto mb-4 relative">
                  <step.icon className="w-8 h-8 text-smgh-green" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-smgh-green text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">{idx + 1}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed text-justify">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficiary Stories */}
      {beneficiaries.length > 0 && (
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <motion.div variants={item} className="text-center mb-14">
              <Badge className="bg-smgh-red/10 text-smgh-red border-0 mb-4">Impact Stories</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Stories of Transformation</h2>
              <p className="text-gray-600 max-w-xl mx-auto">Real lives changed through your support and generosity</p>
              <div className="w-16 h-1 bg-smgh-red mx-auto rounded-full mt-4" />
            </motion.div>
            <div className="grid md:grid-cols-2 gap-6">
              {beneficiaries.map(b => {
                const isExpanded = expandedBeneficiary === b.id
                return (
                  <motion.div key={b.id} variants={item}>
                    <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden h-full">
                      <CardContent className="p-0">
                        <div className="flex gap-5 p-6">
                          <img
                            src={b.photo || `https://picsum.photos/seed/benef-${b.id}/200/200`}
                            alt={b.name}
                            className="w-20 h-20 rounded-2xl object-cover ring-2 ring-smgh-green/10 flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-gray-900 text-lg">{b.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                              <span className="inline-flex items-center gap-1 capitalize text-smgh-green font-medium">
                                {getCategoryIcon(b.category)} {b.category?.replace('-', ' ')}
                              </span>
                              {b.location && <span>• {b.location}</span>}
                              {b.yearHelped && <span>• {b.yearHelped}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="px-6 pb-5">
                          <p className="text-gray-600 text-sm leading-relaxed text-justify">
                            {b.story && (isExpanded ? b.story : `${b.story.slice(0, 180)}...`)}
                          </p>
                          {b.story && b.story.length > 180 && (
                            <button
                              onClick={() => setExpandedBeneficiary(isExpanded ? null : b.id)}
                              className="text-smgh-green text-sm font-medium mt-2 hover:text-smgh-green-dark transition-colors"
                            >
                              {isExpanded ? 'Show Less' : 'Read Full Story →'}
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Get Involved */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={item} className="text-center mb-14">
            <Badge className="bg-smgh-gold/20 text-yellow-700 border-0 mb-4">Get Involved</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How You Can Help</h2>
            <p className="text-gray-600 max-w-xl mx-auto">Every contribution counts in our mission to support mothers and transform communities</p>
            <div className="w-16 h-1 bg-smgh-gold mx-auto rounded-full mt-4" />
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {getInvolved.map(opt => (
              <motion.div key={opt.title} variants={item}>
                <Card className="border-gray-100 shadow-sm hover:shadow-lg transition-all h-full text-center overflow-hidden">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-5">
                      <opt.icon className="w-8 h-8 text-smgh-green" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{opt.title}</h3>
                    <p className="text-gray-600 text-sm mb-6 leading-relaxed text-justify">{opt.desc}</p>
                    <Link to={opt.action}>
                      <Button className={`${opt.color} ${opt.textColor} rounded-xl shadow-md w-full`}>
                        {opt.actionLabel}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Foundation Gallery */}
      {galleryItems.length > 0 && (
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <motion.div variants={item} className="text-center mb-10">
              <Badge className="bg-smgh-green/10 text-smgh-green border-0 mb-4">Gallery</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Foundation Activities</h2>
              <p className="text-gray-600 max-w-xl mx-auto">See the impact of our outreach programs firsthand</p>
              <div className="w-16 h-1 bg-smgh-green mx-auto rounded-full mt-4" />
            </motion.div>

            {galleryYears.length > 1 && (
              <div className="flex items-center gap-2 justify-center mb-8 flex-wrap">
                <button
                  onClick={() => setGalleryFilter('all')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${galleryFilter === 'all' ? 'bg-smgh-green text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                >
                  All Years
                </button>
                {galleryYears.map(y => (
                  <button
                    key={y}
                    onClick={() => setGalleryFilter(y.toString())}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${galleryFilter === y.toString() ? 'bg-smgh-green text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredGallery.map(gi => (
                <motion.div key={gi.id} variants={item} className="rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer relative bg-gray-100">
                  <img src={gi.thumbnail || gi.url} alt={gi.title || 'Foundation gallery'} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end p-3 rounded-2xl">
                    {gi.title && <p className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">{gi.title}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={item} className="bg-gradient-to-br from-smgh-dark to-smgh-green-dark rounded-3xl p-10 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,214,0,0.08),transparent_50%)]" />
            <div className="relative">
              <Heart className="w-12 h-12 text-smgh-red mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Make a Difference Today</h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
                Your generous donation helps us continue our mission of supporting mothers and the less privileged. Every cedi counts.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/donate">
                  <Button size="lg" className="bg-smgh-red hover:bg-smgh-red-dark text-white px-10 py-6 rounded-full shadow-lg shadow-smgh-red/25 text-lg">
                    <Heart className="w-5 h-5 mr-2" /> Donate Now
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" className="bg-transparent border border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-8 py-6 rounded-full text-lg">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  )
}
