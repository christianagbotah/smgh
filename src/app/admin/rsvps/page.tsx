'use client'

import { useState, useEffect, useMemo } from 'react'
import { Users, Search, Trash2, Mail, Phone, MessageSquare, Calendar, ChevronDown, ChevronUp, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { fetchJSON, fetchWrite, ensureArray } from '@/lib/fetch-helpers'
import { useConfirm } from '@/hooks/useConfirm'
import PageLoadingOverlay from '@/components/admin/PageLoadingOverlay'

interface RSVPEvent {
  id: string
  title: string
  slug: string
  date: string
}

interface RSVP {
  id: string
  eventId: string
  name: string
  email: string | null
  phone: string | null
  guests: number
  message: string | null
  createdAt: string
  event: RSVPEvent
}

interface EventOption {
  id: string
  title: string
  date: string
  rsvpCount?: number
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const avatarColors = [
  'bg-smgh-green/20 text-smgh-green-lighter',
  'bg-smgh-red/20 text-smgh-red-light',
  'bg-smgh-gold/20 text-smgh-gold',
  'bg-blue-500/20 text-blue-400',
  'bg-purple-500/20 text-purple-400',
  'bg-pink-500/20 text-pink-400',
  'bg-orange-500/20 text-orange-400',
  'bg-teal-500/20 text-teal-400',
]

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

export default function AdminRSVPs() {
  const [rsvps, setRsvps] = useState<RSVP[]>([])
  const [events, setEvents] = useState<EventOption[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const fetchRSVPs = () => {
    setLoading(true)
    const url = eventFilter === 'all'
      ? '/api/events/rsvp'
      : `/api/events/rsvp?eventId=${eventFilter}`
    fetchJSON(url)
      .then(data => { setRsvps(ensureArray(data)); setLoading(false) })
      .catch(() => { setLoading(false) })
  }

  const fetchEvents = () => {
    fetchJSON('/api/events?limit=50')
      .then(data => setEvents(ensureArray(data)))
      .catch(() => {})
  }

  useEffect(() => { fetchEvents(); fetchRSVPs() }, [])

  // Re-fetch RSVPs when filter changes
  useEffect(() => { fetchRSVPs() }, [eventFilter])

  const filteredRSVPs = useMemo(() => {
    if (!search.trim()) return rsvps
    const q = search.toLowerCase().trim()
    return rsvps.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.email && r.email.toLowerCase().includes(q)) ||
      (r.phone && r.phone.includes(q))
    )
  }, [rsvps, search])

  const stats = useMemo(() => {
    const totalRSVPs = rsvps.length
    const totalGuests = rsvps.reduce((sum, r) => sum + r.guests, 0)
    const eventsWithRSVPs = new Set(rsvps.map(r => r.eventId)).size
    return { totalRSVPs, totalGuests, eventsWithRSVPs }
  }, [rsvps])

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete RSVP',
      description: 'Are you sure you want to delete this RSVP? This action cannot be undone.',
      variant: 'danger',
      confirmText: 'Delete',
    })
    if (!ok) return
    setDeleting(true)
    try {
      const result = await fetchWrite(`/api/events/rsvp?id=${id}`, { method: 'DELETE' })
      if (result.ok) {
        toast({ title: 'RSVP deleted successfully' })
        fetchRSVPs()
        setExpandedId(null)
      } else {
        toast({ title: 'Failed to delete RSVP', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to delete RSVP', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  // Build event filter options from events that have RSVPs
  const eventOptions = useMemo(() => {
    const eventIdsWithRSVPs = new Set(rsvps.map(r => r.eventId))
    return events.filter(e => eventIdsWithRSVPs.has(e.id))
  }, [events, rsvps])

  return (
    <>
    <PageLoadingOverlay visible={deleting} message="Deleting..." />
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">RSVPs</h1>
          <p className="text-gray-400 text-sm">Manage event attendance registrations</p>
        </div>
        <Button
          onClick={fetchRSVPs}
          variant="outline"
          className="border-gray-700 text-gray-300 hover:text-white"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-smgh-green/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-smgh-green" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total RSVPs</p>
              <p className="text-white text-2xl font-bold">{loading ? '—' : stats.totalRSVPs}</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-smgh-gold/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-smgh-gold" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total Guests</p>
              <p className="text-white text-2xl font-bold">{loading ? '—' : stats.totalGuests}</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Events with RSVPs</p>
              <p className="text-white text-2xl font-bold">{loading ? '—' : stats.eventsWithRSVPs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Event Filter */}
        <div className="relative">
          <select
            value={eventFilter}
            onChange={e => setEventFilter(e.target.value)}
            className="appearance-none w-full sm:w-64 px-4 py-2.5 pr-10 rounded-xl bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-smgh-green"
          >
            <option value="all" className="bg-[#1a1a1a]">All Events</option>
            {eventOptions.map(ev => (
              <option key={ev.id} value={ev.id} className="bg-[#1a1a1a]">
                {ev.title}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-gray-700 text-white placeholder:text-gray-500 text-sm"
          />
        </div>
      </div>

      {/* RSVP List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/5 rounded w-1/4" />
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredRSVPs.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No RSVPs found</p>
          <p className="text-gray-500 text-sm mt-1">
            {search ? 'Try adjusting your search terms' : 'RSVPs will appear here when people register for events'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRSVPs.map(rsvp => {
            const isExpanded = expandedId === rsvp.id
            const avatarClass = getAvatarColor(rsvp.name)
            const initials = getInitials(rsvp.name)

            return (
              <div
                key={rsvp.id}
                className={`glass rounded-xl overflow-hidden transition-all ${isExpanded ? 'ring-1 ring-smgh-green/20' : ''}`}
              >
                {/* Main Row */}
                <div
                  className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : rsvp.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${avatarClass}`}>
                      {initials}
                    </div>

                    {/* Name & Event */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-medium text-sm">{rsvp.name}</h3>
                        {rsvp.guests > 1 && (
                          <span className="px-2 py-0.5 rounded-full bg-smgh-green/10 text-smgh-green-lighter text-xs font-medium">
                            +{rsvp.guests - 1} guest{rsvp.guests > 2 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {rsvp.event.title}
                        </span>
                        <span className="text-gray-600">·</span>
                        <span>{formatDate(rsvp.event.date)}</span>
                      </div>
                    </div>

                    {/* Contact info (desktop) */}
                    <div className="hidden md:flex items-center gap-4 text-sm text-gray-400">
                      {rsvp.email && (
                        <span className="flex items-center gap-1.5 max-w-[200px] truncate">
                          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{rsvp.email}</span>
                        </span>
                      )}
                      {rsvp.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                          {rsvp.phone}
                        </span>
                      )}
                    </div>

                    {/* Guests count */}
                    <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-300 flex-shrink-0">
                      <Users className="w-3.5 h-3.5 text-gray-500" />
                      <span className="font-medium">{rsvp.guests}</span>
                    </div>

                    {/* Expand/Collapse */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-gray-500 text-xs hidden lg:block">
                        {formatDateTime(rsvp.createdAt)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Message preview (mobile-friendly) */}
                  {rsvp.message && !isExpanded && (
                    <div className="mt-2 ml-14 flex items-start gap-1.5">
                      <MessageSquare className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-400 text-xs truncate">{rsvp.message}</p>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="border-t border-gray-800 pt-4">
                      <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        {/* Contact details */}
                        <div className="space-y-3">
                          <h4 className="text-gray-300 text-xs font-semibold uppercase tracking-wider">Contact Info</h4>
                          <div className="space-y-2">
                            {rsvp.email && (
                              <div className="flex items-center gap-2.5 text-sm">
                                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">Email</p>
                                  <a href={`mailto:${rsvp.email}`} className="text-smgh-green-lighter hover:underline text-sm">
                                    {rsvp.email}
                                  </a>
                                </div>
                              </div>
                            )}
                            {rsvp.phone && (
                              <div className="flex items-center gap-2.5 text-sm">
                                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">Phone</p>
                                  <a href={`tel:${rsvp.phone}`} className="text-smgh-green-lighter hover:underline text-sm">
                                    {rsvp.phone}
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Event details */}
                        <div className="space-y-3">
                          <h4 className="text-gray-300 text-xs font-semibold uppercase tracking-wider">Event Details</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2.5 text-sm">
                              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs">Event</p>
                                <p className="text-white text-sm">{rsvp.event.title}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5 text-sm">
                              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                                <Users className="w-3.5 h-3.5 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs">Party Size</p>
                                <p className="text-white text-sm">
                                  {rsvp.guests} {rsvp.guests === 1 ? 'guest' : 'guests'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Message */}
                      {rsvp.message && (
                        <div className="mb-4">
                          <h4 className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">Message</h4>
                          <div className="bg-white/5 rounded-xl p-3 border border-gray-800">
                            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{rsvp.message}</p>
                          </div>
                        </div>
                      )}

                      {/* Timestamps & Actions */}
                      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                        <p className="text-gray-500 text-xs">
                          Registered {formatDateTime(rsvp.createdAt)}
                        </p>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); handleDelete(rsvp.id) }}
                            className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Results count */}
          <div className="pt-3 text-center">
            <p className="text-gray-500 text-xs">
              Showing {filteredRSVPs.length} of {rsvps.length} RSVP{rsvps.length !== 1 ? 's' : ''}
              {search && <> matching &quot;{search}&quot;</>}
            </p>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
