'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from '@/lib/router'
import {
  Users, Award, Heart, Facebook, Instagram, Globe, Mail,
  Phone, Twitter, Linkedin, ExternalLink, Briefcase, HandHeart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface TeamMember {
  id: string
  name: string
  role: string
  photo: string | null
  bio: string | null
  email: string | null
  phone: string | null
  socialLinks: string | null
  category: string
  sortOrder: number
  active: boolean
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/team')
      .then(r => r.json())
      .then(data => {
        setMembers(data.filter((m: TeamMember) => m.active))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const leadership = members.filter(m => m.category === 'leadership').sort((a, b) => a.sortOrder - b.sortOrder)
  const volunteers = members.filter(m => m.category === 'volunteer').sort((a, b) => a.sortOrder - b.sortOrder)
  const partners = members.filter(m => m.category === 'partner')

  const displayMembers = filter === 'all' ? members : filter === 'leadership' ? leadership : filter === 'volunteer' ? volunteers : partners

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="w-4 h-4" />
      case 'instagram': return <Instagram className="w-4 h-4" />
      case 'twitter': return <Twitter className="w-4 h-4" />
      case 'youtube': return <Globe className="w-4 h-4" />
      case 'linkedin': return <Linkedin className="w-4 h-4" />
      default: return <Globe className="w-4 h-4" />
    }
  }

  const parseSocialLinks = (linksStr: string | null): Record<string, string> => {
    if (!linksStr) return {}
    try { return JSON.parse(linksStr) } catch { return {} }
  }

  const filterBtns = [
    { key: 'all', label: 'All', count: members.length },
    { key: 'leadership', label: 'Leadership', count: leadership.length },
    { key: 'volunteer', label: 'Volunteers', count: volunteers.length },
    { key: 'partner', label: 'Partners', count: partners.length },
  ]

  if (loading) {
    return (
      <div className="min-h-screen">
        <Skeleton className="h-[40vh] w-full" />
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />)}
          </div>
          <Skeleton className="h-64 rounded-3xl" />
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Hero */}
      <section className="relative py-28 md:py-36 overflow-hidden bg-smgh-dark">
        <div className="absolute inset-0 bg-gradient-to-br from-smgh-green-dark/30 via-smgh-dark to-smgh-red-dark/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(46,125,50,0.12),transparent_50%)]" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/70 text-sm mb-6 backdrop-blur-sm border border-white/5">
            <Users className="w-4 h-4 text-smgh-green-light" /> The SMGH Team
          </motion.div>
          <motion.h1 variants={item} className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Meet the People<br /><span className="text-gradient-green">Behind the Vision</span>
          </motion.h1>
          <motion.p variants={item} className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            A dedicated team of passionate individuals committed to honouring mothers and transforming lives across Ghana.
          </motion.p>
          <motion.div variants={item} className="flex items-center justify-center gap-8 mt-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{members.length}</p>
              <p className="text-gray-500 text-sm">Team Members</p>
            </div>
            <div className="w-px h-10 bg-gray-700" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{leadership.length}</p>
              <p className="text-gray-500 text-sm">Leaders</p>
            </div>
            <div className="w-px h-10 bg-gray-700" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{volunteers.length}</p>
              <p className="text-gray-500 text-sm">Volunteers</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filter */}
      <section className="py-6 px-4 bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {filterBtns.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                filter === f.key
                  ? 'bg-smgh-green text-white shadow-sm shadow-smgh-green/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </section>

      {/* Leadership (featured prominently) */}
      {(filter === 'all' || filter === 'leadership') && leadership.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div variants={item} className="text-center mb-12">
              <Badge className="bg-smgh-green/10 text-smgh-green border-0 mb-4">Leadership</Badge>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Leadership Team</h2>
              <p className="text-gray-600">The visionaries and coordinators driving SMGH forward</p>
              <div className="w-16 h-1 bg-smgh-green mx-auto rounded-full mt-4" />
            </motion.div>

            {/* Visionary (Founder) - Featured */}
            {leadership[0] && (
              <motion.div variants={item} className="mb-10">
                <Card className="overflow-hidden border-0 shadow-xl">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-br from-smgh-green-dark to-smgh-green p-8 md:p-12 text-white">
                      <div className="md:flex items-center gap-10">
                        <div className="mb-6 md:mb-0 md:w-1/3 flex justify-center">
                          <div className="relative">
                            <img
                              src={leadership[0].photo || `https://picsum.photos/seed/${leadership[0].id}/400/500`}
                              alt={leadership[0].name}
                              className="w-36 h-48 sm:w-44 sm:h-56 md:w-52 md:h-64 rounded-3xl object-cover ring-4 ring-white/20 shadow-2xl"
                            />
                            <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-smgh-gold rounded-full flex items-center justify-center shadow-lg">
                              <Award className="w-6 h-6 text-black" />
                            </div>
                          </div>
                        </div>
                        <div className="md:w-2/3">
                          <Badge className="bg-smgh-gold text-black text-xs font-bold border-0 mb-4 px-3 py-1">
                            Founder & Visionary
                          </Badge>
                          <h3 className="text-3xl md:text-4xl font-bold mb-2">{leadership[0].name}</h3>
                          <p className="text-white/70 text-sm mb-4 font-medium">{leadership[0].role}</p>
                          <p className="text-white/90 leading-relaxed mb-6 text-[15px]">{leadership[0].bio}</p>
                          <div className="flex flex-wrap items-center gap-4">
                            {leadership[0].email && (
                              <a href={`mailto:${leadership[0].email}`} className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors">
                                <Mail className="w-4 h-4" /> {leadership[0].email}
                              </a>
                            )}
                            {leadership[0].phone && (
                              <a href={`tel:${leadership[0].phone}`} className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors">
                                <Phone className="w-4 h-4" /> {leadership[0].phone}
                              </a>
                            )}
                            {Object.entries(parseSocialLinks(leadership[0].socialLinks)).filter(([, v]) => v).map(([k, v]) => (
                              <a key={k} href={v as string} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all">
                                {getSocialIcon(k)}
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Other Leadership */}
            {leadership.length > 1 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leadership.slice(1).map(m => {
                  const socials = parseSocialLinks(m.socialLinks)
                  return (
                    <motion.div key={m.id} variants={item}>
                      <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all h-full overflow-hidden group">
                        <CardContent className="p-0">
                          <div className="h-20 bg-gradient-to-r from-smgh-green/10 to-smgh-green/5" />
                          <div className="px-6 pb-6">
                            <div className="-mt-10 mb-4 relative inline-block">
                              <img
                                src={m.photo || `https://picsum.photos/seed/${m.id}/300/300`}
                                alt={m.name}
                                className="w-20 h-24 rounded-2xl object-cover ring-4 ring-white shadow-md"
                              />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg group-hover:text-smgh-green transition-colors">{m.name}</h3>
                            <p className="text-smgh-green text-sm font-medium mb-3">{m.role}</p>
                            {m.bio && <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">{m.bio}</p>}
                            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                              {m.email && (
                                <a href={`mailto:${m.email}`} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-smgh-green/10 flex items-center justify-center text-gray-400 hover:text-smgh-green transition-colors">
                                  <Mail className="w-3.5 h-3.5" />
                                </a>
                              )}
                              {Object.entries(socials).filter(([, v]) => v).map(([k, v]) => (
                                <a key={k} href={v as string} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-smgh-green/10 flex items-center justify-center text-gray-400 hover:text-smgh-green transition-colors">
                                  {getSocialIcon(k)}
                                </a>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Volunteers */}
      {(filter === 'all' || filter === 'volunteer') && volunteers.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <motion.div variants={item} className="text-center mb-12">
              <Badge className="bg-smgh-red/10 text-smgh-red border-0 mb-4">Volunteers</Badge>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Volunteers</h2>
              <p className="text-gray-600">The dedicated volunteers who make every event possible</p>
              <div className="w-16 h-1 bg-smgh-red mx-auto rounded-full mt-4" />
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {volunteers.map(m => (
                <motion.div key={m.id} variants={item}>
                  <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-5 p-6">
                        <img
                          src={m.photo || `https://picsum.photos/seed/${m.id}/200/200`}
                          alt={m.name}
                          className="w-16 h-20 rounded-2xl object-cover ring-2 ring-smgh-green/10 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-gray-900 truncate">{m.name}</h3>
                          <p className="text-smgh-green text-sm font-medium">{m.role}</p>
                          {m.bio && <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-relaxed">{m.bio}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Partners / Sponsors */}
      {(filter === 'all' || filter === 'partner') && partners.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div variants={item} className="text-center mb-12">
              <Badge className="bg-smgh-gold/20 text-yellow-700 border-0 mb-4">Partnership</Badge>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Partners & Sponsors</h2>
              <p className="text-gray-600">Organizations that support our mission</p>
              <div className="w-16 h-1 bg-smgh-gold mx-auto rounded-full mt-4" />
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6">
              {partners.map(m => (
                <motion.div key={m.id} variants={item}>
                  <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all text-center">
                    <CardContent className="p-6">
                      {m.photo ? (
                        <img src={m.photo} alt={m.name} className="w-20 h-20 rounded-xl object-contain mx-auto mb-4" />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-smgh-green/10 to-smgh-gold/10 flex items-center justify-center mx-auto mb-4">
                          <Heart className="w-8 h-8 text-smgh-green" />
                        </div>
                      )}
                      <h3 className="font-bold text-gray-900">{m.name}</h3>
                      <p className="text-gray-500 text-sm mt-1">{m.role}</p>
                      {m.bio && <p className="text-gray-400 text-xs mt-2">{m.bio}</p>}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Join Our Team CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div variants={item}>
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-smgh-green-dark to-smgh-green p-10 md:p-14 text-white text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(255,214,0,0.06),transparent_50%)]" />
                  <div className="relative">
                    <HandHeart className="w-12 h-12 mx-auto mb-6 text-smgh-gold" />
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Join Our Team</h2>
                    <p className="text-white/80 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
                      We are always looking for passionate individuals to join our mission. Whether you want to volunteer, partner, or support in other ways, there is a place for you.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Link to="/contact">
                        <Button size="lg" className="bg-white text-smgh-green-dark hover:bg-white/90 px-8 py-6 rounded-full shadow-lg text-lg font-bold">
                          <HandHeart className="w-5 h-5 mr-2" /> Volunteer With Us
                        </Button>
                      </Link>
                      <Link to="/donate">
                        <Button size="lg" className="bg-transparent border border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-8 py-6 rounded-full text-lg">
                          Support Our Mission
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </motion.div>
  )
}
