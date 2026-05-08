'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, Save, Calendar, MapPin, Clock, Youtube, Users, MessageSquare, Image as ImageIcon, ChevronDown, ChevronUp, X, ExternalLink, FileText, QrCode, Download, Upload, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useConfirm } from '@/hooks/useConfirm'
import PageLoadingOverlay from '@/components/admin/PageLoadingOverlay'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MediaPicker from '@/components/MediaPicker'
import RichTextEditor from '@/components/RichTextEditor'
import QRCode from 'qrcode'
import { fetchJSON, fetchWrite, ensureArray, safeJSONParse } from '@/lib/fetch-helpers'

interface EventArtist { artistId: string; sortOrder: number; artist?: { id: string; name: string } }
interface EventGuest { name: string; title?: string; photo?: string; description?: string; sortOrder: number }
interface EventTestimonial { quote: string; author: string; photo?: string }
interface EventData {
  id: string; title: string; slug: string; date: string; time: string | null
  venue: string; city: string; address: string | null; description: string | null
  bannerImage: string | null; status: string; tags: string | null; youtubeUrls: string | null
  programOutlineUrl: string | null
  artists?: EventArtist[]; guests?: EventGuest[]; testimonials?: EventTestimonial[]
  galleryItems?: { id: string; url: string; thumbnail?: string | null; title?: string | null }[]
}

interface ArtistOption { id: string; name: string }

const emptyForm = {
  title: '', slug: '', date: '', time: '', venue: '', city: '', address: '',
  description: '', bannerImage: '', status: 'upcoming', tags: '',
  youtubeUrls: '', programOutlineUrl: '',
  artists: [] as EventArtist[], guests: [] as EventGuest[],
  testimonials: [] as EventTestimonial[],
}

export default function AdminEvents() {
  const [events, setEvents] = useState<EventData[]>([])
  const [artists, setArtists] = useState<ArtistOption[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const fetchEvents = () => {
    fetch('/api/events?limit=50')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => { setEvents(ensureArray(data)); setLoading(false) })
      .catch(() => { setEvents([]); setLoading(false) })
  }

  const fetchArtists = () => {
    fetch('/api/artists')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => setArtists(ensureArray(data)))
      .catch(() => setArtists([]))
  }

  useEffect(() => { fetchEvents(); fetchArtists() }, [])

  // Generate QR code for program outline
  const generateQR = async (eventSlug: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
      const programUrl = `${baseUrl}/#/events/${eventSlug}/program`
      const qr = await QRCode.toDataURL(programUrl, {
        width: 1024,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      })
      setQrDataUrl(qr)
    } catch (err) {
      console.error('QR generation failed:', err)
    }
  }

  // Upload PDF file
  const handlePdfUpload = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      toast({ title: 'Please select a PDF file', variant: 'destructive' })
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: 'File size must be under 50MB', variant: 'destructive' })
      return
    }
    setUploadingPdf(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', `Program outline for ${form.title || 'event'}`)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      updateForm('programOutlineUrl', data.url)
      toast({ title: 'PDF uploaded successfully' })
      // Generate QR code with the slug
      if (form.slug) {
        generateQR(form.slug)
      }
    } catch {
      toast({ title: 'Failed to upload PDF', variant: 'destructive' })
    } finally {
      setUploadingPdf(false)
    }
  }

  // Download QR code as PNG
  const downloadQR = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.download = `${form.slug || 'event'}-program-qr.png`
    link.href = qrDataUrl
    link.click()
    toast({ title: 'QR code downloaded' })
  }

  // Update QR when slug changes
  useEffect(() => {
    if (form.programOutlineUrl && form.slug) {
      generateQR(form.slug)
    } else {
      setQrDataUrl(null)
    }
  }, [form.programOutlineUrl, form.slug])

  const handleSave = async () => {
    if (!form.title || !form.date || !form.venue || !form.city) {
      toast({ title: 'Title, date, venue, and city are required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const youtubeArr = form.youtubeUrls.split('\n').filter(Boolean)
      const body = {
        ...form,
        youtubeUrls: JSON.stringify(youtubeArr),
        date: form.date,
      }

      if (editingId) {
        const { ok } = await fetchWrite('/api/events', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...body }),
        })
        if (ok) {
          toast({ title: 'Event updated' })
          setEditingId(null)
          setForm(emptyForm)
          fetchEvents()
        } else {
          toast({ title: 'Failed to update event', variant: 'destructive' })
        }
      } else {
        const { ok } = await fetchWrite('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (ok) {
          toast({ title: 'Event created' })
          setForm(emptyForm)
          setShowCreateForm(false)
          fetchEvents()
        } else {
          toast({ title: 'Failed to create event', variant: 'destructive' })
        }
      }
    } catch {
      toast({ title: 'Failed to save event', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Event',
      description: 'Are you sure you want to delete this event and all associated data? This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      const { ok: success } = await fetchWrite(`/api/events?id=${id}`, { method: 'DELETE' })
      if (success) {
        toast({ title: 'Event deleted' })
        if (editingId === id) { setEditingId(null); setForm(emptyForm) }
        if (expandedId === id) setExpandedId(null)
        fetchEvents()
      } else {
        toast({ title: 'Failed to delete event', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' })
    }
  }

  const startEdit = async (event: EventData) => {
    // If clicking edit on an already-being-edited event, close it
    if (editingId === event.id) {
      setEditingId(null)
      setForm(emptyForm)
      return
    }
    try {
      setEditingId(event.id)
      setExpandedId(event.id)
      // Fetch full event with relations
      const fullEvent = await fetchJSON(`/api/events?slug=${event.slug}`).catch(() => null)
      const data = fullEvent && !fullEvent.error ? (Array.isArray(fullEvent) ? fullEvent[0] : fullEvent) : event

      setForm({
        title: data.title || '',
        slug: data.slug || '',
        date: (data.date || '').split('T')[0],
        time: data.time || '',
        venue: data.venue || '',
        city: data.city || '',
        address: data.address || '',
        description: data.description || '',
        bannerImage: data.bannerImage || '',
        status: data.status || 'upcoming',
        tags: data.tags || '',
        youtubeUrls: safeJSONParse(data.youtubeUrls, []).join('\n'),
        programOutlineUrl: data.programOutlineUrl || '',
        artists: ensureArray(data.artists).map((a: any) => ({
          artistId: a.artistId || a.artist?.id || '',
          sortOrder: a.sortOrder || 0,
        })),
        guests: ensureArray(data.guests).map((g: any) => ({
          name: g.name || '',
          title: g.title || '',
          photo: g.photo || '',
          description: g.description || '',
          sortOrder: g.sortOrder || 0,
        })),
        testimonials: ensureArray(data.testimonials).map((t: any) => ({
          quote: t.quote || '',
          author: t.author || '',
          photo: t.photo || '',
        })),
      })
    } catch (err) {
      console.error('startEdit error:', err)
      toast({ title: 'Failed to load event for editing', variant: 'destructive' })
      setEditingId(null)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const updateForm = (key: string, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const toggleArtist = (artistId: string) => {
    const exists = form.artists.find(a => a.artistId === artistId)
    if (exists) {
      updateForm('artists', form.artists.filter(a => a.artistId !== artistId))
    } else {
      updateForm('artists', [...form.artists, { artistId, sortOrder: form.artists.length }])
    }
  }

  // Shared edit form component
  const renderEditForm = (isInline: boolean) => (
    <div className="glass rounded-2xl p-6 max-h-[80vh] overflow-y-auto admin-scrollbar border-smgh-green/20 border animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">{editingId ? 'Edit Event' : 'New Event'}</h3>
        {!isInline && (
          <button onClick={() => { setShowCreateForm(false); setForm(emptyForm); setEditingId(null) }} className="text-gray-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <Tabs defaultValue="basic">
        <TabsList className="bg-white/5 p-1 mb-6 w-full flex-wrap gap-1">
          <TabsTrigger value="basic" className="data-[state=active]:bg-white/10 text-gray-400 data-[state=active]:text-white rounded-lg">Basic Info</TabsTrigger>
          <TabsTrigger value="details" className="data-[state=active]:bg-white/10 text-gray-400 data-[state=active]:text-white rounded-lg">Details</TabsTrigger>
          <TabsTrigger value="artists" className="data-[state=active]:bg-white/10 text-gray-400 data-[state=active]:text-white rounded-lg">
            Artists <span className="ml-1 text-xs opacity-60">({form.artists.length})</span>
          </TabsTrigger>
          <TabsTrigger value="people" className="data-[state=active]:bg-white/10 text-gray-400 data-[state=active]:text-white rounded-lg">
            Guests & Testimonials
          </TabsTrigger>
          <TabsTrigger value="media" className="data-[state=active]:bg-white/10 text-gray-400 data-[state=active]:text-white rounded-lg">Media & Videos</TabsTrigger>
          <TabsTrigger value="program" className="data-[state=active]:bg-white/10 text-gray-400 data-[state=active]:text-white rounded-lg">
            Program Outline
            {form.programOutlineUrl && <span className="ml-1 w-2 h-2 rounded-full bg-smgh-green inline-block" />}
          </TabsTrigger>
        </TabsList>

        {/* Basic Info */}
        <TabsContent value="basic">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Title *</label>
              <Input placeholder="Event title *" value={form.title} onChange={e => updateForm('title', e.target.value)} className="bg-white/5 border-gray-700 text-white" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Slug (auto-generated)</label>
              <Input placeholder="event-slug" value={form.slug} onChange={e => updateForm('slug', e.target.value)} className="bg-white/5 border-gray-700 text-white" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Date *</label>
              <Input type="date" value={form.date} onChange={e => updateForm('date', e.target.value)} className="bg-white/5 border-gray-700 text-white" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Venue *</label>
              <Input placeholder="Venue *" value={form.venue} onChange={e => updateForm('venue', e.target.value)} className="bg-white/5 border-gray-700 text-white" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">City *</label>
              <Input placeholder="City *" value={form.city} onChange={e => updateForm('city', e.target.value)} className="bg-white/5 border-gray-700 text-white" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Status</label>
              <select value={form.status} onChange={e => updateForm('status', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-700 text-white focus:outline-none focus:border-smgh-green">
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Tags (comma-separated)</label>
              <Input placeholder="worship-night, mother-day" value={form.tags} onChange={e => updateForm('tags', e.target.value)} className="bg-white/5 border-gray-700 text-white" />
            </div>
          </div>
        </TabsContent>

        {/* Details */}
        <TabsContent value="details">
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Time</label>
              <Input placeholder="e.g. 17:00" value={form.time} onChange={e => updateForm('time', e.target.value)} className="bg-white/5 border-gray-700 text-white max-w-xs" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Address</label>
              <Input placeholder="Full address" value={form.address} onChange={e => updateForm('address', e.target.value)} className="bg-white/5 border-gray-700 text-white" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Description</label>
              <RichTextEditor
                value={form.description}
                onChange={(html) => updateForm('description', html)}
                placeholder="Describe the event..."
                minHeight="min-h-[300px]"
              />
            </div>
            <MediaPicker
              value={form.bannerImage}
              onChange={(url) => updateForm('bannerImage', url)}
              label="Banner Image"
              previewHeight="h-40"
            />
          </div>
        </TabsContent>

        {/* Artists */}
        <TabsContent value="artists">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-smgh-green" />
                Select Artists
                <Badge variant="secondary" className="bg-white/10 text-gray-400 text-xs border-0">
                  {form.artists.length} selected
                </Badge>
              </h4>
            </div>
            <div className="grid md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto admin-scrollbar">
              {artists.map(ar => {
                const isSelected = form.artists.some(a => a.artistId === ar.id)
                return (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() => toggleArtist(ar.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                      isSelected ? 'bg-smgh-green/10 border border-smgh-green/30' : 'bg-white/5 border border-gray-700 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-smgh-green border-smgh-green' : 'border-gray-500'
                    }`}>
                      {isSelected && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? 'text-smgh-green-light' : 'text-gray-300'}`}>{ar.name}</span>
                  </button>
                )
              })}
            </div>
            {artists.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">No artists found. Add artists in the Artists section first.</p>
            )}
          </div>
        </TabsContent>

        {/* Guests & Testimonials */}
        <TabsContent value="people">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-smgh-gold" />
                Invited Guests
                <Badge variant="secondary" className="bg-white/10 text-gray-400 text-xs border-0">
                  {form.guests.length}
                </Badge>
              </h4>
              <button type="button" onClick={() => updateForm('guests', [...form.guests, { name: '', title: 'Guest Speaker', photo: '', description: '', sortOrder: form.guests.length }])} className="text-smgh-green text-sm hover:text-smgh-green-light flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Guest
              </button>
            </div>
            <div className="space-y-3">
              {form.guests.map((g, idx) => (
                <div key={idx} className="glass rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">Guest #{idx + 1}</span>
                    <button type="button" onClick={() => updateForm('guests', form.guests.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <Input placeholder="Guest name *" value={g.name} onChange={e => {
                      const updated = [...form.guests]; updated[idx] = { ...g, name: e.target.value }; updateForm('guests', updated)
                    }} className="bg-white/5 border-gray-700 text-white" />
                    <select value={g.title || 'Guest Speaker'} onChange={e => {
                      const updated = [...form.guests]; updated[idx] = { ...g, title: e.target.value }; updateForm('guests', updated)
                    }} className="px-4 py-3 rounded-xl border border-gray-700 text-white text-sm focus:outline-none focus:border-smgh-green">
                      <option value="Guest Speaker">Guest Speaker</option>
                      <option value="Special Guest">Special Guest</option>
                      <option value="Guest of Honor">Guest of Honor</option>
                      <option value="MC">MC</option>
                      <option value="Guest Artist">Guest Artist</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <MediaPicker
                    value={g.photo || ''}
                    onChange={(url) => {
                      const updated = [...form.guests]; updated[idx] = { ...g, photo: url }; updateForm('guests', updated)
                    }}
                    label="Guest Photo"
                    previewHeight="h-16"
                  />
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block">Description</label>
                    <Input placeholder="Brief description" value={g.description || ''} onChange={e => {
                      const updated = [...form.guests]; updated[idx] = { ...g, description: e.target.value }; updateForm('guests', updated)
                    }} className="bg-white/5 border-gray-700 text-white" />
                  </div>
                </div>
              ))}
            </div>
            {form.guests.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-6 border border-dashed border-gray-700 rounded-xl">No guests added yet</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-smgh-red" />
                Testimonials
                <Badge variant="secondary" className="bg-white/10 text-gray-400 text-xs border-0">
                  {form.testimonials.length}
                </Badge>
              </h4>
              <button type="button" onClick={() => updateForm('testimonials', [...form.testimonials, { quote: '', author: '', photo: '' }])} className="text-smgh-green text-sm hover:text-smgh-green-light flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Testimonial
              </button>
            </div>
            <div className="space-y-3">
              {form.testimonials.map((t, idx) => (
                <div key={idx} className="glass rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">Testimonial #{idx + 1}</span>
                    <button type="button" onClick={() => updateForm('testimonials', form.testimonials.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block">Quote *</label>
                    <Textarea placeholder="What people said about the event..." value={t.quote} onChange={e => {
                      const updated = [...form.testimonials]; updated[idx] = { ...t, quote: e.target.value }; updateForm('testimonials', updated)
                    }} rows={3} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:border-smgh-green resize-none text-sm" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-500 text-xs mb-1 block">Author *</label>
                      <Input placeholder="Author name *" value={t.author} onChange={e => {
                        const updated = [...form.testimonials]; updated[idx] = { ...t, author: e.target.value }; updateForm('testimonials', updated)
                      }} className="bg-white/5 border-gray-700 text-white" />
                    </div>
                    <MediaPicker
                      value={t.photo || ''}
                      onChange={(url) => {
                        const updated = [...form.testimonials]; updated[idx] = { ...t, photo: url }; updateForm('testimonials', updated)
                      }}
                      label="Author Photo"
                      previewHeight="h-10"
                    />
                  </div>
                </div>
              ))}
            </div>
            {form.testimonials.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-6 border border-dashed border-gray-700 rounded-xl">No testimonials added yet</p>
            )}
          </div>
        </TabsContent>

        {/* Media & Videos */}
        <TabsContent value="media">
          <div className="space-y-6">
            <div>
              <h4 className="text-white font-medium text-sm flex items-center gap-2 mb-3">
                <ImageIcon className="w-4 h-4 text-smgh-green" /> Banner Image
              </h4>
              <MediaPicker
                value={form.bannerImage}
                onChange={(url) => updateForm('bannerImage', url)}
                previewHeight="h-40"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium text-sm flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-red-500" /> YouTube Videos
                  <Badge variant="secondary" className="bg-white/10 text-gray-400 text-xs border-0">
                    {form.youtubeUrls.split('\n').filter(Boolean).length} videos
                  </Badge>
                </h4>
                <button type="button" onClick={() => updateForm('youtubeUrls', form.youtubeUrls + '\n')} className="text-smgh-green text-sm hover:text-smgh-green-light flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add Video
                </button>
              </div>
              <div className="space-y-2">
                {form.youtubeUrls.split('\n').map((url, idx, arr) => {
                  if (idx === arr.length - 1 && url === '') return null
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <Youtube className="w-4 h-4 text-red-400" />
                      </div>
                      <Input placeholder="https://www.youtube.com/watch?v=..." value={url} onChange={e => {
                        const urls = [...form.youtubeUrls.split('\n')]; urls[idx] = e.target.value; updateForm('youtubeUrls', urls.join('\n'))
                      }} className="bg-white/5 border-gray-700 text-white text-sm font-mono" />
                      <button type="button" onClick={() => {
                        const urls = form.youtubeUrls.split('\n'); urls.splice(idx, 1); updateForm('youtubeUrls', urls.join('\n'))
                      }} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
                {form.youtubeUrls.split('\n').filter(Boolean).length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4 border border-dashed border-gray-700 rounded-xl">No videos added. Click &quot;Add Video&quot; to add one.</p>
                )}
              </div>
            </div>

            {editingId && (
              <div>
                <h4 className="text-white font-medium text-sm flex items-center gap-2 mb-3">
                  <ImageIcon className="w-4 h-4 text-smgh-green" /> Event Gallery
                  <Badge variant="secondary" className="bg-white/10 text-gray-400 text-xs border-0">
                    {events.find(e => e.id === editingId)?.galleryItems?.length || 0} photos
                  </Badge>
                </h4>
                <p className="text-gray-500 text-xs mb-3">Manage gallery items in the Gallery section. Use category &quot;event&quot; and select this event.</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {(events.find(e => e.id === editingId)?.galleryItems || []).slice(0, 8).map(gi => (
                    <div key={gi.id} className="aspect-square rounded-lg overflow-hidden">
                      <img src={gi.thumbnail || gi.url} alt={gi.title || ''} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Program Outline */}
        <TabsContent value="program">
          <div className="space-y-6">
            {/* PDF Upload Section */}
            <div>
              <h4 className="text-white font-medium text-sm flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-smgh-green" />
                Program Outline PDF
              </h4>
              <p className="text-gray-500 text-xs mb-4">
                Upload the event program outline as a PDF. Once uploaded, a QR code will be generated automatically that links to the public program page. Attendees can scan the QR code to view or download the program.
              </p>

              {form.programOutlineUrl ? (
                <div className="glass rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-red-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">PDF Uploaded</p>
                        <p className="text-gray-500 text-xs font-mono truncate max-w-[250px]">{form.programOutlineUrl}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={form.programOutlineUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white h-8 px-2">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </a>
                      <Button size="sm" variant="ghost" onClick={() => updateForm('programOutlineUrl', '')} className="text-gray-400 hover:text-red-400 h-8 px-2">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Replace file */}
                  <div>
                    <label className="block">
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-600 hover:border-smgh-green/50 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-sm">Replace PDF file</span>
                      </div>
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={e => { if (e.target.files?.[0]) handlePdfUpload(e.target.files[0]); e.target.value = '' }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="block">
                  <div className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-gray-600 hover:border-smgh-green/50 cursor-pointer transition-all ${uploadingPdf ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Upload className="w-10 h-10 text-gray-500 mb-3" />
                    <p className="text-white text-sm font-medium mb-1">
                      {uploadingPdf ? 'Uploading...' : 'Upload PDF Program Outline'}
                    </p>
                    <p className="text-gray-500 text-xs">PDF files only, max 50MB</p>
                    {uploadingPdf && (
                      <div className="mt-3 w-48 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-smgh-green rounded-full animate-pulse" style={{ width: '60%' }} />
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handlePdfUpload(e.target.files[0]); e.target.value = '' }}
                  />
                </label>
              )}
            </div>

            {/* QR Code Section */}
            {form.programOutlineUrl && qrDataUrl && (
              <div className="glass rounded-xl p-6">
                <h4 className="text-white font-medium text-sm flex items-center gap-2 mb-4">
                  <QrCode className="w-4 h-4 text-smgh-gold" />
                  QR Code for Program Outline
                </h4>
                <p className="text-gray-500 text-xs mb-4">
                  Scan this QR code or download it for printing. It links directly to the public program outline page where attendees can view and download the PDF.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* QR Code Display */}
                  <div className="bg-white p-4 rounded-2xl shadow-lg">
                    <img
                      src={qrDataUrl}
                      alt="QR Code for program outline"
                      className="w-48 h-48 sm:w-56 sm:h-56"
                    />
                  </div>

                  {/* QR Code Info */}
                  <div className="flex-1 space-y-3">
                    <div className="bg-white/5 rounded-xl p-4 space-y-2">
                      <p className="text-gray-400 text-xs">Links to:</p>
                      <p className="text-white text-sm font-mono break-all">
                        {process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/#/events/{form.slug}/program
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-gray-500">Resolution</p>
                        <p className="text-white font-medium">1024 × 1024px</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-gray-500">Error Correction</p>
                        <p className="text-white font-medium">High (30%)</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-gray-500">Format</p>
                        <p className="text-white font-medium">PNG (Print-ready)</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-gray-500">Event</p>
                        <p className="text-white font-medium truncate">{form.title || '—'}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={downloadQR} variant="success" size="sm" className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Download QR Code
                      </Button>
                      <a href={form.programOutlineUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:text-white">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Preview Page
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!form.programOutlineUrl && (
              <div className="text-center py-8 border border-dashed border-gray-700 rounded-xl">
                <QrCode className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Upload a PDF above to generate a QR code</p>
                <p className="text-gray-600 text-xs mt-1">The QR code will link to the public program outline page</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-800">
        <Button onClick={handleSave} disabled={saving} variant="success">
          {saving ? 'Saving...' : <><Save className="w-3 h-3 mr-1" /> {editingId ? 'Update Event' : 'Create Event'}</>}
        </Button>
        <Button onClick={cancelEdit} variant="outline" className="border-gray-700 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30">
          Cancel
        </Button>
      </div>
    </div>
  )

  return (
    <div>
      <PageLoadingOverlay visible={saving} message="Saving..." />
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Events</h1>
          <p className="text-gray-400 text-sm">Manage worship night events</p>
        </div>
        <Button onClick={() => { setShowCreateForm(!showCreateForm); if (showCreateForm) { setForm(emptyForm); setEditingId(null) } }} variant="success">
          <Plus className="w-4 h-4 mr-2" />
          {showCreateForm ? 'Cancel' : 'Add Event'}
        </Button>
      </div>

      {/* Create Form at top (only for new events) */}
      {showCreateForm && !editingId && (
        <div className="mb-6">
          {renderEditForm(false)}
        </div>
      )}

      {/* Events List with inline editing */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="glass rounded-xl p-4 animate-pulse h-20" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => {
            const isEditing = editingId === event.id
            const isExpanded = expandedId === event.id

            return (
              <div key={event.id}>
                <div className={`glass rounded-xl overflow-hidden transition-all ${isEditing ? 'ring-1 ring-smgh-green/30' : ''} ${isExpanded ? 'bg-white/[0.03]' : ''}`}>
                  {/* Event Card Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : event.id)}
                            className="text-gray-500 hover:text-gray-300 mr-1"
                          >
                            {isExpanded
                              ? <ChevronUp className="w-4 h-4" />
                              : <ChevronDown className="w-4 h-4" />
                            }
                          </button>
                          <h3 className="text-white font-medium truncate">{event.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            event.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                            event.status === 'upcoming' ? 'bg-smgh-green/10 text-smgh-green' :
                            'bg-red-500/10 text-red-400'
                          }`}>
                            {event.status}
                          </span>
                          <Badge variant="secondary" className="bg-white/5 text-gray-400 text-xs border-0">
                            {new Date(event.date).getFullYear()}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(event.date).toLocaleDateString()}</span>
                          {event.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.time}</span>}
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue}, {event.city}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-4">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(event)} className={`text-gray-400 h-8 px-2 ${isEditing ? 'text-smgh-green' : 'hover:text-white'}`}>
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(event.id)} className="text-gray-400 hover:text-red-400 h-8 px-2">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Quick View (when not editing) */}
                  {isExpanded && !isEditing && (
                    <div className="px-4 pb-4 pt-0 border-t border-gray-800">
                      <div className="pt-3 space-y-3">
                        {/* Description preview */}
                        {event.description && (
                          <p className="text-gray-400 text-sm line-clamp-3">{event.description.replace(/<[^>]*>/g, '')}</p>
                        )}
                        {/* Quick stats */}
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          {event.artists && event.artists.length > 0 && (
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.artists.length} artist{event.artists.length !== 1 ? 's' : ''}</span>
                          )}
                          {event.guests && event.guests.length > 0 && (
                            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{event.guests.length} guest{event.guests.length !== 1 ? 's' : ''}</span>
                          )}
                          {event.galleryItems && event.galleryItems.length > 0 && (
                            <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" />{event.galleryItems.length} photo{event.galleryItems.length !== 1 ? 's' : ''}</span>
                          )}
                          {event.programOutlineUrl && (
                            <span className="flex items-center gap-1"><FileText className="w-3 h-3 text-red-400" />Program outline</span>
                          )}
                          {event.tags && (
                            <span className="text-gray-500">Tags: {event.tags}</span>
                          )}
                        </div>
                        {/* Banner thumbnail */}
                        {event.bannerImage && (
                          <div className="mt-2">
                            <img src={event.bannerImage} alt={event.title} className="max-w-xs h-32 rounded-lg object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Inline Edit Form (appears directly under this event card) */}
                {isEditing && (
                  <div className="mt-3 ml-2 mr-2">
                    {renderEditForm(true)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
