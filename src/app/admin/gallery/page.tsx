'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Plus, Trash2, Edit3, Search, Filter, Images, Video, X, Check,
  ChevronDown, Download, Upload, ImageOff, GripVertical
} from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import MediaPicker from '@/components/MediaPicker'
import MultiMediaPicker from '@/components/MultiMediaPicker'

// ─── Types ───────────────────────────────────────────────────────────────────

interface GalleryItem {
  id: string
  title: string | null
  description: string | null
  type: string
  url: string
  thumbnail: string | null
  year: number | null
  category: string | null
  eventId: string | null
  createdAt?: string
}

interface EventOption {
  id: string
  title: string
}

type CategoryOption = 'all' | 'event' | 'foundation' | 'general' | 'team' | 'media'
type TypeOption = 'all' | 'image' | 'video'

interface FormState {
  title: string
  description: string
  url: string
  type: string
  year: string
  category: string
  eventId: string
}

const CATEGORIES: { value: CategoryOption; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'event', label: 'Event' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'general', label: 'General' },
  { value: 'team', label: 'Team' },
  { value: 'media', label: 'Media' },
]

const CATEGORY_OPTIONS = CATEGORIES.filter(c => c.value !== 'all')

const emptyForm: FormState = {
  title: '',
  description: '',
  url: '',
  type: 'image',
  year: new Date().getFullYear().toString(),
  category: 'general',
  eventId: '',
}

// ─── SortableGalleryItem ────────────────────────────────────────────────────

function SortableGalleryItem({ item, isSelected, isVideo, onToggleSelect, onEdit, onDelete }: {
  item: GalleryItem
  isSelected: boolean
  isVideo: boolean
  onToggleSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.7 : 1,
    position: 'relative' as const,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all ${
        isSelected
          ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-[#0a0a0a]'
          : 'hover:ring-1 hover:ring-gray-600'
      }`}
      onClick={onToggleSelect}
    >
      {/* Thumbnail */}
      <div className="aspect-square relative bg-gray-800">
        {isVideo ? (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <Video className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        ) : (
          <img
            src={item.thumbnail || item.url}
            alt={item.title || 'Gallery item'}
            className="w-full h-full object-cover"
            onError={(e) => {
              const el = e.target as HTMLImageElement
              el.style.display = 'none'
              const parent = el.parentElement
              if (parent && !parent.querySelector('.img-fallback')) {
                const fb = document.createElement('div')
                fb.className = 'img-fallback flex items-center justify-center w-full h-full bg-gray-800'
                fb.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
                parent.appendChild(fb)
              }
            }}
          />
        )}

        {/* Checkbox overlay (top-left) */}
        <div
          className={`absolute top-2 left-2 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all z-10 ${
            isSelected
              ? 'bg-green-500 border-green-500'
              : 'bg-black/40 border-white/30 opacity-0 group-hover:opacity-100'
          }`}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>

        {/* Type badge (top-right) */}
        {isVideo && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-purple-500/80 text-white text-[10px] font-medium z-10">
            VIDEO
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200">
          <div className="absolute inset-0 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {/* Top row: year & category badges */}
            <div className="flex items-center justify-end gap-1.5">
              {item.year && (
                <Badge variant="secondary" className="bg-black/60 text-white text-[10px] border-0 backdrop-blur-sm">
                  {item.year}
                </Badge>
              )}
              {item.category && (
                <Badge variant="secondary" className="bg-black/60 text-gray-300 text-[10px] border-0 backdrop-blur-sm capitalize">
                  {item.category}
                </Badge>
              )}
            </div>

            {/* Bottom row: title + actions */}
            <div>
              <p className="text-white text-sm font-medium truncate mb-2">
                {item.title || 'Untitled'}
              </p>
              <div className="flex items-center gap-1.5">
                {/* Drag handle */}
                <button
                  {...attributes}
                  {...listeners}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors backdrop-blur-sm cursor-grab active:cursor-grabbing"
                  title="Drag to reorder"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </button>
                {/* Edit button */}
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit() }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/15 text-white text-xs hover:bg-white/25 transition-colors backdrop-blur-sm"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
                {/* Delete button */}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete() }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs hover:bg-red-500/30 transition-colors backdrop-blur-sm"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminGallery() {
  const { toast } = useToast()
  const { confirm } = useConfirm()

  // Data
  const [items, setItems] = useState<GalleryItem[]>([])
  const [events, setEvents] = useState<EventOption[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterYear, setFilterYear] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<CategoryOption>('all')
  const [filterType, setFilterType] = useState<TypeOption>('all')

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Dialog
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  // Multi-upload
  const [multiUploadOpen, setMultiUploadOpen] = useState(false)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [autoSavingUrls, setAutoSavingUrls] = useState(false)

  // Batch operations
  const [batchCategoryOpen, setBatchCategoryOpen] = useState(false)
  const [batchYearOpen, setBatchYearOpen] = useState(false)
  const [batchCategory, setBatchCategory] = useState('')
  const [batchYear, setBatchYear] = useState('')
  const [batchUpdating, setBatchUpdating] = useState(false)

  // Drag-and-drop reorder
  const [savingOrder, setSavingOrder] = useState(false)

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // ─── Data Fetching ────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/gallery?limit=200')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: 'Failed to load gallery items', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events?limit=50')
      const data = await res.json()
      setEvents(Array.isArray(data) ? data : [])
    } catch {
      // Silent fail - events dropdown is optional
    }
  }, [])

  useEffect(() => {
    fetchItems()
    fetchEvents()
  }, [fetchItems, fetchEvents])

  // ─── Computed Values ──────────────────────────────────────────────────────

  const uniqueYears = useMemo(() => {
    const years = items
      .map(i => i.year)
      .filter((y): y is number => y != null)
    return Array.from(new Set(years)).sort((a, b) => b - a)
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (
          !item.title?.toLowerCase().includes(q) &&
          !item.description?.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      // Year filter
      if (filterYear !== 'all' && item.year?.toString() !== filterYear) {
        return false
      }
      // Category filter
      if (filterCategory !== 'all' && item.category !== filterCategory) {
        return false
      }
      // Type filter
      if (filterType !== 'all' && item.type !== filterType) {
        return false
      }
      return true
    })
  }, [items, searchQuery, filterYear, filterCategory, filterType])

  const stats = useMemo(() => {
    const images = items.filter(i => i.type === 'image').length
    const videos = items.filter(i => i.type === 'video').length
    return { total: items.length, images, videos }
  }, [items])

  const selectedCount = selectedIds.size
  const allFilteredSelected = filteredItems.length > 0 && filteredItems.every(i => selectedIds.has(i.id))

  // ─── Selection Handlers ───────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(filteredItems.map(i => i.id)))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  // ─── CRUD Handlers ────────────────────────────────────────────────────────

  const openCreateForm = () => {
    setEditingItem(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEditForm = (item: GalleryItem) => {
    setEditingItem(item)
    setForm({
      title: item.title || '',
      description: item.description || '',
      url: item.url || '',
      type: item.type || 'image',
      year: item.year?.toString() || '',
      category: item.category || 'general',
      eventId: item.eventId || '',
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.url) {
      toast({ title: 'Image URL is required', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      if (editingItem) {
        // Update
        const body: Record<string, unknown> = { id: editingItem.id }
        if (form.title !== (editingItem.title || '')) body.title = form.title
        if (form.description !== (editingItem.description || '')) body.description = form.description
        if (form.url !== (editingItem.url || '')) body.url = form.url
        if (form.type !== (editingItem.type || 'image')) body.type = form.type
        if (form.year !== (editingItem.year?.toString() || '')) body.year = form.year ? parseInt(form.year) : null
        if (form.category !== (editingItem.category || 'general')) body.category = form.category
        if (form.eventId !== (editingItem.eventId || '')) body.eventId = form.eventId || null

        const res = await fetch('/api/gallery', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Update failed')
        toast({ title: 'Gallery item updated' })
      } else {
        // Create
        const formData = new FormData()
        formData.append('title', form.title)
        formData.append('description', form.description)
        formData.append('url', form.url)
        formData.append('type', form.type)
        if (form.year) formData.append('year', form.year)
        formData.append('category', form.category)
        if (form.eventId) formData.append('eventId', form.eventId)

        const res = await fetch('/api/gallery', { method: 'POST', body: formData })
        if (!res.ok) throw new Error('Create failed')
        toast({ title: 'Gallery item created' })
      }

      setFormOpen(false)
      setEditingItem(null)
      fetchItems()
    } catch {
      toast({
        title: editingItem ? 'Failed to update item' : 'Failed to create item',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Item',
      description: 'Are you sure you want to delete this item? This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/gallery?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast({ title: 'Item deleted' })
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      fetchItems()
    } catch {
      toast({ title: 'Failed to delete item', variant: 'destructive' })
    }
  }

  // ─── Multi-Upload Handler ─────────────────────────────────────────────────

  const handleMultiUploadUrls = async (urls: string[]) => {
    if (urls.length === 0) return

    setAutoSavingUrls(true)
    let success = 0
    let failed = 0

    for (const url of urls) {
      try {
        const formData = new FormData()
        formData.append('url', url)
        formData.append('type', 'image')
        formData.append('year', new Date().getFullYear().toString())
        formData.append('category', 'general')

        const res = await fetch('/api/gallery', { method: 'POST', body: formData })
        if (res.ok) {
          success++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    setAutoSavingUrls(false)
    setMultiUploadOpen(false)
    setUploadedUrls([])

    if (success > 0) {
      toast({
        title: `${success} image${success > 1 ? 's' : ''} added to gallery`,
        ...(failed > 0 && { description: `${failed} failed to add` }),
      })
      fetchItems()
    } else {
      toast({
        title: 'Failed to add images',
        variant: 'destructive',
      })
    }
  }

  // ─── Batch Operations ─────────────────────────────────────────────────────

  const handleBatchDelete = async () => {
    if (selectedCount === 0) return
    const ok = await confirm({
      title: 'Delete Selected Items',
      description: `Are you sure you want to delete ${selectedCount} selected item${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!ok) return

    let success = 0
    let failed = 0

    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/gallery?id=${id}`, { method: 'DELETE' })
        if (res.ok) success++
        else failed++
      } catch {
        failed++
      }
    }

    setSelectedIds(new Set())
    toast({
      title: `${success} item${success > 1 ? 's' : ''} deleted`,
      ...(failed > 0 && { description: `${failed} failed to delete` }),
    })
    fetchItems()
  }

  const handleBatchUpdate = async (field: 'category' | 'year', value: string) => {
    if (selectedCount === 0) return

    setBatchUpdating(true)
    let success = 0
    let failed = 0

    for (const id of selectedIds) {
      try {
        const body: Record<string, unknown> = { id }
        if (field === 'category') body.category = value
        else body.year = value ? parseInt(value) : null

        const res = await fetch('/api/gallery', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) success++
        else failed++
      } catch {
        failed++
      }
    }

    setBatchUpdating(false)
    setBatchCategoryOpen(false)
    setBatchYearOpen(false)
    setSelectedIds(new Set())
    toast({
      title: `${success} item${success > 1 ? 's' : ''} updated`,
      ...(failed > 0 && { description: `${failed} failed to update` }),
    })
    fetchItems()
  }

  // ─── Drag-and-Drop Handler ────────────────────────────────────────────────

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    // Only allow reorder when no filters are active
    if (hasActiveFilters) return

    const newItems = arrayMove(items, items.findIndex(i => i.id === active.id), items.findIndex(i => i.id === over.id))
    setItems(newItems) // optimistic update

    // Persist the new order
    setSavingOrder(true)
    try {
      const res = await fetch('/api/gallery/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: newItems.map(i => i.id) }),
      })
      if (!res.ok) throw new Error('Reorder failed')
      toast({ title: 'Order updated' })
    } catch {
      toast({ title: 'Failed to save order', variant: 'destructive' })
      fetchItems() // revert
    } finally {
      setSavingOrder(false)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterYear('all')
    setFilterCategory('all')
    setFilterType('all')
  }

  const hasActiveFilters = searchQuery || filterYear !== 'all' || filterCategory !== 'all' || filterType !== 'all'

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageLoadingOverlay visible={saving || autoSavingUrls || batchUpdating || savingOrder} message={saving ? 'Saving...' : autoSavingUrls ? 'Uploading images...' : batchUpdating ? 'Updating items...' : 'Saving order...'} />

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gallery</h1>
          <p className="text-gray-400 text-sm">Manage photos and videos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => { setMultiUploadOpen(true); setUploadedUrls([]) }}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:text-white hover:bg-white/10"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button onClick={openCreateForm} variant="success">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* ─── Stats Bar ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
            <Images className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Items</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Images className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.images}</p>
            <p className="text-xs text-gray-500">Images</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Video className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.videos}</p>
            <p className="text-xs text-gray-500">Videos</p>
          </div>
        </div>
      </div>

      {/* ─── Filters & Search ───────────────────────────────────────────── */}
      <div className="glass rounded-xl p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-gray-700 text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Year filter */}
          <div className="relative">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-green-500/50 cursor-pointer"
            >
              <option value="all">All Years</option>
              {uniqueYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          </div>

          {/* Category filter */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as CategoryOption)}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-green-500/50 cursor-pointer"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          </div>

          {/* Type filter */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as TypeOption)}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-green-500/50 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-3.5 h-3.5 inline mr-1" />
              Clear
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Saving order indicator */}
          {savingOrder && (
            <span className="text-xs text-amber-400 flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
              Saving order...
            </span>
          )}

          {/* Count badge */}
          <Badge variant="secondary" className="bg-white/10 text-gray-300 border-0">
            {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* ─── Batch Operations Bar ───────────────────────────────────────── */}
      {selectedCount > 0 && (
        <div className="glass rounded-xl p-3 flex flex-wrap items-center gap-3 border-green-500/30">
          <span className="text-sm text-green-400 font-medium flex items-center gap-2">
            <Check className="w-4 h-4" />
            {selectedCount} selected
          </span>
          <div className="flex-1" />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={allFilteredSelected ? deselectAll : selectAll}
              className="text-gray-300 hover:text-white hover:bg-white/10"
            >
              {allFilteredSelected ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setBatchCategory(''); setBatchCategoryOpen(true) }}
              className="text-gray-300 hover:text-white hover:bg-white/10"
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              Set Category
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setBatchYear(''); setBatchYearOpen(true) }}
              className="text-gray-300 hover:text-white hover:bg-white/10"
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              Set Year
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleBatchDelete}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete ({selectedCount})
            </Button>
          </div>
        </div>
      )}

      {/* ─── Gallery Grid ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Images className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-1">
            {hasActiveFilters ? 'No matching items' : 'No gallery items yet'}
          </h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm">
            {hasActiveFilters
              ? 'Try adjusting your filters or search query to find what you\'re looking for.'
              : 'Start building your gallery by adding photos and videos.'}
          </p>
          {!hasActiveFilters && (
            <div className="flex items-center gap-3">
              <Button onClick={openCreateForm} variant="success">
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </Button>
              <Button
                onClick={() => { setMultiUploadOpen(true); setUploadedUrls([]) }}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:text-white hover:bg-white/10"
              >
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload
              </Button>
            </div>
          )}
        </div>
      ) : hasActiveFilters ? (
        /* Filtered view: non-sortable grid */
        <div className="space-y-3">
          <p className="text-gray-500 text-xs flex items-center gap-1.5">
            <Filter className="w-3 h-3" />
            Filters active — drag-to-reorder is disabled. Clear filters to enable reordering.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredItems.map(item => {
              const isSelected = selectedIds.has(item.id)
              const isVideo = item.type === 'video'

              return (
                <div
                  key={item.id}
                  className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                    isSelected
                      ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-[#0a0a0a]'
                      : 'hover:ring-1 hover:ring-gray-600'
                  }`}
                  onClick={() => toggleSelect(item.id)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-square relative bg-gray-800">
                    {isVideo ? (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                          <Video className="w-6 h-6 text-gray-400" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.thumbnail || item.url}
                        alt={item.title || 'Gallery item'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const el = e.target as HTMLImageElement
                          el.style.display = 'none'
                          const parent = el.parentElement
                          if (parent && !parent.querySelector('.img-fallback')) {
                            const fb = document.createElement('div')
                            fb.className = 'img-fallback flex items-center justify-center w-full h-full bg-gray-800'
                            fb.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
                            parent.appendChild(fb)
                          }
                        }}
                      />
                    )}

                    {/* Checkbox overlay (top-left) */}
                    <div
                      className={`absolute top-2 left-2 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all z-10 ${
                        isSelected
                          ? 'bg-green-500 border-green-500'
                          : 'bg-black/40 border-white/30 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>

                    {/* Type badge (top-right) */}
                    {isVideo && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-purple-500/80 text-white text-[10px] font-medium z-10">
                        VIDEO
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200">
                      <div className="absolute inset-0 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {/* Top row: year & category badges */}
                        <div className="flex items-center justify-end gap-1.5">
                          {item.year && (
                            <Badge variant="secondary" className="bg-black/60 text-white text-[10px] border-0 backdrop-blur-sm">
                              {item.year}
                            </Badge>
                          )}
                          {item.category && (
                            <Badge variant="secondary" className="bg-black/60 text-gray-300 text-[10px] border-0 backdrop-blur-sm capitalize">
                              {item.category}
                            </Badge>
                          )}
                        </div>

                        {/* Bottom row: title + actions */}
                        <div>
                          <p className="text-white text-sm font-medium truncate mb-2">
                            {item.title || 'Untitled'}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditForm(item) }}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/15 text-white text-xs hover:bg-white/25 transition-colors backdrop-blur-sm"
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs hover:bg-red-500/30 transition-colors backdrop-blur-sm"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Unfiltered view: sortable grid with drag-and-drop */
        <div className="space-y-3">
          <p className="text-gray-500 text-xs flex items-center gap-1.5">
            <GripVertical className="w-3 h-3" />
            Drag images to reorder their display position
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredItems.map(i => i.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredItems.map(item => (
                  <SortableGalleryItem
                    key={item.id}
                    item={item}
                    isSelected={selectedIds.has(item.id)}
                    isVideo={item.type === 'video'}
                    onToggleSelect={() => toggleSelect(item.id)}
                    onEdit={() => openEditForm(item)}
                    onDelete={() => handleDelete(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* ─── Add/Edit Dialog ────────────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={(open) => {
        setFormOpen(open)
        if (!open) { setEditingItem(null); setForm(emptyForm) }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-gray-800 text-white admin-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingItem ? 'Edit Gallery Item' : 'Add Gallery Item'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingItem ? 'Update the gallery item details below.' : 'Fill in the details to add a new gallery item.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Title */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Title</label>
              <Input
                placeholder="Enter title..."
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white/5 border-gray-700 text-white"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Description</label>
              <Textarea
                placeholder="Enter description (optional)..."
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="bg-white/5 border-gray-700 text-white resize-none"
              />
            </div>

            {/* Image Picker */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Image / Video URL</label>
              <MediaPicker
                value={form.url}
                onChange={(url) => setForm(prev => ({ ...prev, url }))}
                previewHeight="h-32"
              />
            </div>

            {/* Type + Year row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Type</label>
                <div className="relative">
                  <select
                    value={form.type}
                    onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full appearance-none px-3 py-2.5 rounded-xl bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-green-500/50 cursor-pointer"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Year</label>
                <Input
                  type="number"
                  placeholder="e.g. 2024"
                  value={form.year}
                  onChange={(e) => setForm(prev => ({ ...prev, year: e.target.value }))}
                  className="bg-white/5 border-gray-700 text-white"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Category</label>
              <div className="relative">
                <select
                  value={form.category}
                  onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full appearance-none px-3 py-2.5 rounded-xl bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-green-500/50 cursor-pointer"
                >
                  {CATEGORY_OPTIONS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Link to Event */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Link to Event (optional)</label>
              <div className="relative">
                <select
                  value={form.eventId}
                  onChange={(e) => setForm(prev => ({ ...prev, eventId: e.target.value }))}
                  className="w-full appearance-none px-3 py-2.5 rounded-xl bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-green-500/50 cursor-pointer"
                >
                  <option value="">No event linked</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-800">
            <Button
              onClick={() => { setFormOpen(false); setEditingItem(null); setForm(emptyForm) }}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.url}
              variant="success"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : editingItem ? (
                'Update Item'
              ) : (
                'Create Item'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Bulk Upload Dialog ─────────────────────────────────────────── */}
      <Dialog open={multiUploadOpen} onOpenChange={(open) => {
        setMultiUploadOpen(open)
        if (!open) setUploadedUrls([])
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-gray-800 text-white admin-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-400" />
              Bulk Upload to Gallery
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Upload multiple images at once. Each image will be automatically added as a new gallery item with default settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <MultiMediaPicker
              value={uploadedUrls}
              onChange={setUploadedUrls}
              label="Select Images"
            />

            {uploadedUrls.length > 0 && (
              <p className="text-sm text-gray-400">
                {uploadedUrls.length} image{uploadedUrls.length !== 1 ? 's' : ''} ready to add to gallery.
                They will be created as type &quot;image&quot; with category &quot;general&quot;.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-800">
            <Button
              onClick={() => setMultiUploadOpen(false)}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
              disabled={autoSavingUrls}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleMultiUploadUrls(uploadedUrls)}
              disabled={autoSavingUrls || uploadedUrls.length === 0}
              variant="info"
            >
              {autoSavingUrls ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Adding {uploadedUrls.length} items...
                </span>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add {uploadedUrls.length} Item{uploadedUrls.length !== 1 ? 's' : ''} to Gallery
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Batch Category Dialog ──────────────────────────────────────── */}
      <Dialog open={batchCategoryOpen} onOpenChange={setBatchCategoryOpen}>
        <DialogContent className="max-w-sm bg-[#1a1a1a] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Set Category for {selectedCount} Items</DialogTitle>
            <DialogDescription className="text-gray-400">
              This will update the category for all selected items.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <label className="text-gray-400 text-xs mb-1 block">Category</label>
            <div className="relative">
              <select
                value={batchCategory}
                onChange={(e) => setBatchCategory(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 rounded-xl bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-green-500/50 cursor-pointer"
              >
                <option value="">Select category...</option>
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-800">
            <Button
              onClick={() => setBatchCategoryOpen(false)}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleBatchUpdate('category', batchCategory)}
              disabled={batchUpdating || !batchCategory}
              variant="success"
            >
              {batchUpdating ? 'Updating...' : 'Apply'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Batch Year Dialog ──────────────────────────────────────────── */}
      <Dialog open={batchYearOpen} onOpenChange={setBatchYearOpen}>
        <DialogContent className="max-w-sm bg-[#1a1a1a] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Set Year for {selectedCount} Items</DialogTitle>
            <DialogDescription className="text-gray-400">
              This will update the year for all selected items.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <label className="text-gray-400 text-xs mb-1 block">Year</label>
            <Input
              type="number"
              placeholder="e.g. 2024"
              value={batchYear}
              onChange={(e) => setBatchYear(e.target.value)}
              className="bg-white/5 border-gray-700 text-white"
            />
          </div>
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-800">
            <Button
              onClick={() => setBatchYearOpen(false)}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleBatchUpdate('year', batchYear)}
              disabled={batchUpdating || !batchYear}
              variant="success"
            >
              {batchUpdating ? 'Updating...' : 'Apply'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
