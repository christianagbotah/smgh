'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, Save, Users, CheckCircle, XCircle, Mail, Phone, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import MediaPicker from '@/components/MediaPicker'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useConfirm } from '@/hooks/useConfirm'
import PageLoadingOverlay from '@/components/admin/PageLoadingOverlay'
import { fetchJSON, fetchWrite, ensureArray } from '@/lib/fetch-helpers'

interface TeamMember {
  id: string; name: string; role: string; photo: string | null; bio: string | null
  email: string | null; phone: string | null; socialLinks: string | null
  category: string; sortOrder: number; active: boolean
}

const emptyForm = {
  name: '', role: '', photo: '', bio: '', email: '', phone: '',
  socialLinks: { facebook: '', instagram: '', youtube: '', twitter: '' },
  category: 'leadership' as string, sortOrder: 0, active: true,
}

export default function AdminTeam() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const fetchMembers = () => {
    fetchJSON('/api/team')
      .then(data => { setMembers(ensureArray(data)); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchMembers() }, [])

  const handleSave = async () => {
    if (!form.name || !form.role) {
      toast({ title: 'Name and role are required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const socialLinks = JSON.stringify(form.socialLinks)
      const body = {
        name: form.name,
        role: form.role,
        photo: form.photo || null,
        bio: form.bio || null,
        email: form.email || null,
        phone: form.phone || null,
        socialLinks,
        category: form.category,
        sortOrder: parseInt(String(form.sortOrder)) || 0,
        active: form.active,
      }

      if (editing) {
        const { ok } = await fetchWrite('/api/team', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing, ...body }),
        })
        if (!ok) { toast({ title: 'Failed to update member', variant: 'destructive' }); return }
        toast({ title: 'Member updated' })
        setEditing(null)
      } else {
        const { ok } = await fetchWrite('/api/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!ok) { toast({ title: 'Failed to create member', variant: 'destructive' }); return }
        toast({ title: 'Member created' })
      }
      setDialogOpen(false)
      setForm(emptyForm)
      fetchMembers()
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Team Member',
      description: 'Are you sure you want to delete this team member? This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      const { ok } = await fetchWrite(`/api/team?id=${id}`, { method: 'DELETE' })
      if (!ok) { toast({ title: 'Failed to delete', variant: 'destructive' }); return }
      toast({ title: 'Deleted' })
      fetchMembers()
    } catch {
      toast({ title: 'Failed', variant: 'destructive' })
    }
  }

  const openDialog = (member?: TeamMember) => {
    if (member) {
      setEditing(member.id)
      let socialLinks = { facebook: '', instagram: '', youtube: '', twitter: '' }
      if (member.socialLinks) {
        try { socialLinks = { ...socialLinks, ...JSON.parse(member.socialLinks) } } catch { /* ignore */ }
      }
      setForm({
        name: member.name,
        role: member.role,
        photo: member.photo || '',
        bio: member.bio || '',
        email: member.email || '',
        phone: member.phone || '',
        socialLinks,
        category: member.category,
        sortOrder: member.sortOrder,
        active: member.active,
      })
    } else {
      setEditing(null)
      setForm(emptyForm)
    }
    setDialogOpen(true)
  }

  const categories = ['leadership', 'volunteer', 'partner']
  const filteredMembers = filterCategory === 'all' ? members : members.filter(m => m.category === filterCategory)

  const categoryBadgeColors: Record<string, string> = {
    leadership: 'bg-smgh-green/10 text-smgh-green',
    volunteer: 'bg-smgh-red/10 text-smgh-red',
    partner: 'bg-yellow-500/10 text-yellow-400',
  }

  return (
    <div>
      <PageLoadingOverlay visible={saving} message="Saving..." />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Members</h1>
          <p className="text-gray-400 text-sm">Manage team members, volunteers, and partners</p>
        </div>
        <Button onClick={() => openDialog()} variant="success">
          <Plus className="w-4 h-4 mr-2" />Add Member
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {categories.map(cat => (
          <div key={cat} className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${
                cat === 'leadership' ? 'bg-smgh-green' :
                cat === 'volunteer' ? 'bg-smgh-red' : 'bg-yellow-400'
              }`} />
              <span className="text-gray-400 text-xs capitalize">{cat}</span>
            </div>
            <p className="text-xl font-bold text-white">{members.filter(m => m.category === cat).length}</p>
          </div>
        ))}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-gray-400 text-xs">Total</span>
          </div>
          <p className="text-xl font-bold text-white">{members.length}</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterCategory === 'all' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          All ({members.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filterCategory === cat ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {cat} ({members.filter(m => m.category === cat).length})
          </button>
        ))}
      </div>

      {/* Members List */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="glass rounded-xl p-4 animate-pulse h-20" />)}</div>
      ) : filteredMembers.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No team members found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map(m => (
            <div key={m.id} className="glass rounded-xl p-4 hover:border-gray-600 transition-colors">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                {m.photo ? (
                  <img src={m.photo} alt={m.name} className="w-12 h-12 rounded-xl object-cover ring-2 ring-smgh-green/10 flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-smgh-green/10 flex items-center justify-center text-smgh-green font-bold text-sm flex-shrink-0">
                    {m.name.charAt(0)}
                  </div>
                )}

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-white font-medium truncate">{m.name}</h3>
                    <Badge variant="secondary" className={`${categoryBadgeColors[m.category] || 'bg-gray-500/10 text-gray-400'} text-xs border-0 capitalize`}>
                      {m.category}
                    </Badge>
                    {!m.active && (
                      <Badge variant="secondary" className="bg-gray-800 text-gray-500 text-xs border-0">inactive</Badge>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">{m.role}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    {m.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{m.email}</span>}
                    {m.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{m.phone}</span>}
                    {m.socialLinks && (
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3" />social links</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openDialog(m)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) { setForm(emptyForm); setEditing(null) }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-gray-800 text-white admin-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-white">{editing ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
            <DialogDescription className="text-gray-400">Fill in the details below. Fields marked * are required.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            {/* Photo Upload */}
            <MediaPicker
              value={form.photo}
              onChange={(url) => setForm(p => ({ ...p, photo: url }))}
              label="Photo"
              previewHeight="h-20"
            />

            {/* Name & Role */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Name *</label>
                <Input placeholder="Full name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="bg-white/5 border-gray-700 text-white" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Role *</label>
                <Input placeholder="e.g. Event Coordinator" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="bg-white/5 border-gray-700 text-white" />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <Input type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="bg-white/5 border-gray-700 text-white" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone
                </label>
                <Input placeholder="+233 XX XXX XXXX" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="bg-white/5 border-gray-700 text-white" />
              </div>
            </div>

            {/* Category, Sort Order, Active */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] [&>option]:bg-[#1a1a1a] [&>option]:text-white border border-gray-700 text-white focus:outline-none focus:border-smgh-green">
                  {categories.map(c => <option key={c} value={c} className="bg-[#1a1a1a]">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Sort Order</label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} className="bg-white/5 border-gray-700 text-white" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Status</label>
                <button
                  onClick={() => setForm(p => ({ ...p, active: !p.active }))}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${form.active ? 'bg-smgh-green/10 border-smgh-green/30 text-smgh-green' : 'bg-white/5 border-gray-700 text-gray-400'}`}
                >
                  {form.active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {form.active ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Bio</label>
              <textarea
                value={form.bio}
                onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:border-smgh-green resize-none text-sm"
                placeholder="Brief biography..."
              />
            </div>

            {/* Social Links */}
            <div>
              <label className="text-gray-400 text-xs mb-2 block flex items-center gap-1">
                <Globe className="w-3 h-3" /> Social Links
              </label>
              <div className="grid md:grid-cols-2 gap-3">
                <Input placeholder="Facebook URL" value={form.socialLinks.facebook} onChange={e => setForm(p => ({ ...p, socialLinks: { ...p.socialLinks, facebook: e.target.value } }))} className="bg-white/5 border-gray-700 text-white" />
                <Input placeholder="Instagram URL" value={form.socialLinks.instagram} onChange={e => setForm(p => ({ ...p, socialLinks: { ...p.socialLinks, instagram: e.target.value } }))} className="bg-white/5 border-gray-700 text-white" />
                <Input placeholder="YouTube URL" value={form.socialLinks.youtube} onChange={e => setForm(p => ({ ...p, socialLinks: { ...p.socialLinks, youtube: e.target.value } }))} className="bg-white/5 border-gray-700 text-white" />
                <Input placeholder="Twitter/X URL" value={form.socialLinks.twitter} onChange={e => setForm(p => ({ ...p, socialLinks: { ...p.socialLinks, twitter: e.target.value } }))} className="bg-white/5 border-gray-700 text-white" />
              </div>
            </div>
          </div>

          {/* Dialog Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-800">
            <Button onClick={handleSave} disabled={saving} variant="success" className="flex-1">
              {saving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" />{editing ? 'Update Member' : 'Create Member'}</>}
            </Button>
            <Button onClick={() => { setDialogOpen(false); setForm(emptyForm); setEditing(null) }} variant="outline" className="border-gray-700 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
