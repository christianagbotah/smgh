'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Trash2, Edit3, Save, Eye, EyeOff, FileText,
  ExternalLink, GripVertical, X, ChevronDown, ChevronUp,
  Image as ImageIcon, ArrowUpDown, Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useConfirm } from '@/hooks/useConfirm'
import PageLoadingOverlay from '@/components/admin/PageLoadingOverlay'
import RichTextEditor from '@/components/RichTextEditor'
import MediaPicker from '@/components/MediaPicker'
import { fetchJSON, fetchWrite, ensureArray } from '@/lib/fetch-helpers'

interface CustomPage {
  id: string
  slug: string
  title: string
  content: string
  bannerImage: string | null
  status: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

const emptyForm = {
  title: '',
  slug: '',
  content: '',
  bannerImage: '',
  status: 'draft' as 'draft' | 'published',
  sortOrder: 0,
}

export default function AdminCustomPages() {
  const [pages, setPages] = useState<CustomPage[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const fetchPages = useCallback(() => {
    fetchJSON('/api/custom-pages')
      .then(data => {
        setPages(ensureArray(data))
        setLoading(false)
      })
      .catch(() => {
        toast({ title: 'Failed to load pages', variant: 'destructive' })
        setLoading(false)
      })
  }, [toast])

  useEffect(() => {
    fetchPages()
  }, [fetchPages])

  const filteredPages = pages.filter(p => filter === 'all' || p.status === filter)

  const handleSave = async () => {
    if (!form.title || !form.slug) {
      toast({ title: 'Title and slug are required', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      if (editing) {
        const { ok, data } = await fetchWrite(`/api/custom-pages/${editing}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!ok) {
          toast({ title: data?.error || 'Failed to update page', variant: 'destructive' })
          return
        }
        toast({ title: 'Page updated' })
        setEditing(null)
      } else {
        const { ok, data } = await fetchWrite('/api/custom-pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!ok) {
          toast({ title: data?.error || 'Failed to create page', variant: 'destructive' })
          return
        }
        toast({ title: 'Page created' })
        setShowForm(false)
      }
      setForm(emptyForm)
      fetchPages()
    } catch {
      toast({ title: 'Failed to save page', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Page',
      description: 'Are you sure you want to delete this page? This cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      const { ok } = await fetchWrite(`/api/custom-pages/${id}`, { method: 'DELETE' })
      if (!ok) {
        toast({ title: 'Failed to delete page', variant: 'destructive' })
        return
      }
      toast({ title: 'Page deleted' })
      fetchPages()
      if (editing === id) {
        setEditing(null)
        setShowForm(false)
        setForm(emptyForm)
      }
    } catch {
      toast({ title: 'Failed to delete page', variant: 'destructive' })
    }
  }

  const handleToggleStatus = async (page: CustomPage) => {
    const newStatus = page.status === 'published' ? 'draft' : 'published'
    try {
      const { ok } = await fetchWrite(`/api/custom-pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (ok) {
        toast({ title: `Page ${newStatus === 'published' ? 'published' : 'unpublished'}` })
        fetchPages()
      } else {
        toast({ title: 'Failed to update status', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' })
    }
  }

  const startEdit = async (page: CustomPage) => {
    // Fetch full page data including content
    try {
      const data = await fetchJSON(`/api/custom-pages/${page.id}`)
      setEditing(page.id)
      setForm({
        title: data.title,
        slug: data.slug,
        content: data.content || '',
        bannerImage: data.bannerImage || '',
        status: data.status,
        sortOrder: data.sortOrder,
      })
      setShowForm(true)
    } catch {
      toast({ title: 'Failed to load page', variant: 'destructive' })
    }
  }

  const updateForm = (key: string, value: string | number) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleTitleChange = (title: string) => {
    updateForm('title', title)
    if (!editing) {
      updateForm('slug', generateSlug(title))
    }
  }

  return (
    <div>
      <PageLoadingOverlay visible={saving} message="Saving..." />
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Custom Pages</h1>
          <p className="text-gray-400 text-sm">Create and manage custom pages for your website</p>
        </div>
        <Button
          onClick={() => {
            if (showForm && !editing) {
              setShowForm(false)
              setForm(emptyForm)
            } else {
              setForm(emptyForm)
              setEditing(null)
              setShowForm(true)
            }
          }}
          variant="success"
        >
          <Plus className="w-4 h-4 mr-2" />
          {showForm && !editing ? 'Cancel' : 'New Page'}
        </Button>
      </div>

      {/* Editor Form */}
      {showForm && (
        <div className="glass rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-smgh-green" />
            {editing ? 'Edit Page' : 'Create New Page'}
          </h3>

          <div className="space-y-5">
            {/* Title & Slug Row */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Title *</label>
                <Input
                  placeholder="Page title"
                  value={form.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  className="bg-white/5 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Slug *</label>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 text-sm flex-shrink-0">/</span>
                  <Input
                    placeholder="page-slug"
                    value={form.slug}
                    onChange={e => updateForm('slug', e.target.value)}
                    className="bg-white/5 border-gray-700 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Status & Sort Order */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Status</label>
                <select
                  value={form.status}
                  onChange={e => updateForm('status', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-smgh-green"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Sort Order</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.sortOrder}
                  onChange={e => updateForm('sortOrder', parseInt(e.target.value) || 0)}
                  className="bg-white/5 border-gray-700 text-white"
                />
              </div>
            </div>

            {/* Banner Image */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Banner Image</label>
              <MediaPicker
                value={form.bannerImage}
                onChange={url => updateForm('bannerImage', url)}
                label=""
                previewHeight="h-36"
              />
            </div>

            {/* Content */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Page Content</label>
              <RichTextEditor
                value={form.content}
                onChange={html => updateForm('content', html)}
                placeholder="Write your page content here..."
                minHeight="min-h-[350px]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-800">
            <Button onClick={handleSave} disabled={saving} variant="success">
              {saving ? 'Saving...' : (
                <>
                  <Save className="w-3 h-3 mr-1" />
                  {editing ? 'Update Page' : 'Create Page'}
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                setShowForm(false)
                setEditing(null)
                setForm(emptyForm)
              }}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6 w-fit">
        {[
          { key: 'all' as const, label: 'All', count: pages.length },
          { key: 'published' as const, label: 'Published', count: pages.filter(p => p.status === 'published').length },
          { key: 'draft' as const, label: 'Drafts', count: pages.filter(p => p.status === 'draft').length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === tab.key
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
            <span className="text-xs opacity-60">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Pages List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : filteredPages.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-1">
            {filter === 'all' ? 'No custom pages yet' : `No ${filter} pages`}
          </p>
          <p className="text-gray-500 text-sm">
            {filter === 'all'
              ? 'Click "New Page" to create your first custom page.'
              : 'Try changing the filter to see more pages.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPages.map(page => (
            <div
              key={page.id}
              className="glass rounded-xl overflow-hidden hover:border-gray-600 transition-all"
            >
              {/* Row */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Left - Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-white font-medium truncate">{page.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        page.status === 'published'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {page.status}
                      </span>
                      <Badge variant="secondary" className="bg-white/5 text-gray-400 text-xs border-0">
                        <GripVertical className="w-3 h-3 mr-1" />
                        {page.sortOrder}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1 text-xs font-mono">
                        /{page.slug}
                      </span>
                      {page.bannerImage && (
                        <span className="flex items-center gap-1 text-xs">
                          <ImageIcon className="w-3 h-3" />
                          Has banner
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs">
                        <Calendar className="w-3 h-3" />
                        {new Date(page.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {/* Preview excerpt */}
                    {expandedId === page.id && (
                      <div className="mt-3 pt-3 border-t border-gray-700/50">
                        <p className="text-gray-400 text-xs line-clamp-2 whitespace-pre-wrap">
                          {page.content.replace(/<[^>]*>/g, '').slice(0, 200) || 'No content'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right - Actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedId(expandedId === page.id ? null : page.id)}
                      className="text-gray-400 hover:text-white"
                      title={expandedId === page.id ? 'Collapse' : 'Preview'}
                    >
                      {expandedId === page.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                    {page.status === 'published' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`/#/${page.slug}`, '_blank')}
                        className="text-gray-400 hover:text-white"
                        title="View page"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleStatus(page)}
                      className={`${
                        page.status === 'published'
                          ? 'text-green-400 hover:text-yellow-400'
                          : 'text-yellow-400 hover:text-green-400'
                      }`}
                      title={page.status === 'published' ? 'Unpublish' : 'Publish'}
                    >
                      {page.status === 'published' ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(page)}
                      className="text-gray-400 hover:text-white"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(page.id)}
                      className="text-gray-400 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
