'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, Save, X, Music, MapPin, Star, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useConfirm } from '@/hooks/useConfirm'
import PageLoadingOverlay from '@/components/admin/PageLoadingOverlay'
import MediaPicker from '@/components/MediaPicker'
import { fetchJSON, fetchWrite, ensureArray } from '@/lib/fetch-helpers'

interface Artist {
  id: string
  name: string
  location: string | null
  bio: string | null
  image: string | null
  featured: boolean
}

const emptyForm = { name: '', location: '', bio: '', image: '', featured: false }

export default function AdminArtists() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const fetchArtists = () => {
    fetchJSON('/api/artists')
      .then(data => { setArtists(ensureArray(data)); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchArtists() }, [])

  const filtered = artists.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.location || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    if (!form.name) { toast({ title: 'Name is required', variant: 'destructive' }); return }
    setSaving(true)
    try {
      const { ok, data } = await fetchWrite('/api/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!ok) { toast({ title: data?.error || 'Failed', variant: 'destructive' }); return }
      toast({ title: 'Artist added' })
      setShowForm(false)
      setForm(emptyForm)
      fetchArtists()
    } catch {
      toast({ title: 'Failed to add artist', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (artist: Artist) => {
    setEditForm({
      name: artist.name,
      location: artist.location || '',
      bio: artist.bio || '',
      image: artist.image || '',
      featured: artist.featured,
    })
    setEditing(artist.id)
  }

  const handleUpdate = async () => {
    if (!editing) return
    if (!editForm.name) { toast({ title: 'Name is required', variant: 'destructive' }); return }
    setSaving(true)
    try {
      const { ok, data } = await fetchWrite('/api/artists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing, ...editForm }),
      })
      if (!ok) { toast({ title: data?.error || 'Failed', variant: 'destructive' }); return }
      toast({ title: 'Artist updated' })
      setEditing(null)
      fetchArtists()
    } catch {
      toast({ title: 'Failed to update', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Artist',
      description: 'Are you sure you want to delete this artist? This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      const { ok } = await fetchWrite(`/api/artists?id=${id}`, { method: 'DELETE' })
      if (!ok) { toast({ title: 'Failed to delete', variant: 'destructive' }); return }
      toast({ title: 'Deleted' })
      fetchArtists()
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' })
    }
  }

  const toggleFeatured = async (artist: Artist) => {
    try {
      const { ok } = await fetchWrite('/api/artists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: artist.id, featured: !artist.featured }),
      })
      if (!ok) { toast({ title: 'Failed to update', variant: 'destructive' }); return }
      toast({ title: artist.featured ? 'Removed from featured' : 'Marked as featured' })
      fetchArtists()
    } catch {
      toast({ title: 'Failed to update', variant: 'destructive' })
    }
  }

  return (
    <div>
      <PageLoadingOverlay visible={saving} message="Saving..." />
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Artists</h1>
          <p className="text-gray-400 text-sm">Manage gospel artists and performers</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant="success">
          <Plus className="w-4 h-4 mr-2" />
          Add Artist
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search artists by name or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
        />
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="glass rounded-xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">New Artist</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Input placeholder="Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="bg-white/5 border-gray-700 text-white" />
            <Input placeholder="Location" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="bg-white/5 border-gray-700 text-white" />
            <div className="md:col-span-2">
              <textarea placeholder="Bio" value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:border-smgh-green resize-none" />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-gray-300 text-sm mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))}
                  className="rounded border-gray-600"
                />
                <Star className="w-4 h-4 text-smgh-gold" /> Featured Artist
              </label>
            </div>
            <MediaPicker
              value={form.image}
              onChange={(url) => setForm(p => ({ ...p, image: url }))}
              label="Artist Photo"
              previewHeight="h-24"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleCreate} variant="success">Save</Button>
            <Button onClick={() => setShowForm(false)} variant="outline" className="border-gray-700 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30">Cancel</Button>
          </div>
        </div>
      )}

      {/* Artists List */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="glass rounded-xl p-4 animate-pulse h-20" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <Music className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">{search ? 'No artists match your search' : 'No artists yet. Add your first artist!'}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(artist => (
            <div key={artist.id} className="glass rounded-xl p-4">
              {editing === artist.id ? (
                <div className="space-y-3">
                  <Input placeholder="Name *" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="bg-white/5 border-gray-700 text-white" />
                  <Input placeholder="Location" value={editForm.location} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))} className="bg-white/5 border-gray-700 text-white" />
                  <textarea placeholder="Bio" value={editForm.bio} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:border-smgh-green resize-none" />
                  <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                    <input type="checkbox" checked={editForm.featured} onChange={e => setEditForm(p => ({ ...p, featured: e.target.checked }))} className="rounded border-gray-600" />
                    <Star className="w-4 h-4 text-smgh-gold" /> Featured Artist
                  </label>
                  <MediaPicker
                    value={editForm.image}
                    onChange={(url) => setEditForm(p => ({ ...p, image: url }))}
                    label="Artist Photo"
                    previewHeight="h-24"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdate} variant="success"><Save className="w-3 h-3 mr-1" />Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(null)} className="border-gray-700 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"><X className="w-3 h-3 mr-1" />Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  {artist.image ? (
                    <img src={artist.image} alt={artist.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-700" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Music className="w-6 h-6 text-purple-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-white font-medium">{artist.name}</h3>
                      {artist.featured && <span className="px-2 py-0.5 rounded-full bg-smgh-gold/10 text-smgh-gold text-xs flex items-center gap-1"><Star className="w-3 h-3" />Featured</span>}
                    </div>
                    {artist.location && <p className="text-gray-400 text-sm flex items-center gap-1"><MapPin className="w-3 h-3" />{artist.location}</p>}
                    {artist.bio && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{artist.bio}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => toggleFeatured(artist)} className={`p-2 rounded-lg transition-colors ${artist.featured ? 'text-smgh-gold hover:bg-smgh-gold/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`} title={artist.featured ? 'Remove from featured' : 'Mark as featured'}><Star className="w-4 h-4" /></button>
                    <button onClick={() => startEdit(artist)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(artist.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
