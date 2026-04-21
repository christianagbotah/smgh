'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Trash2, Edit3, Save, X, ShoppingBag, Search, Package,
  ToggleLeft, ToggleRight, ImagePlus,
  Palette, Ruler, Layers, Info, AlertTriangle, Copy, CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useConfirm } from '@/hooks/useConfirm'
import PageLoadingOverlay from '@/components/admin/PageLoadingOverlay'
import MediaPicker from '@/components/MediaPicker'
import MultiMediaPicker from '@/components/MultiMediaPicker'
import RichTextEditor from '@/components/RichTextEditor'
import { fetchJSON, fetchWrite, ensureArray } from '@/lib/fetch-helpers'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProductVariant {
  id?: string
  name: string
  color: string
  colorName: string
  size: string
  price: number
  stock: number
  image: string
  isActive: boolean
}

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  basePrice: number
  currency: string
  category: string
  eventId: string | null
  event?: { title: string; slug: string }
  primaryImage: string | null
  galleryImages: string | null
  fabric: string | null
  style: string | null
  fit: string | null
  material: string | null
  careInstructions: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  variants?: ProductVariant[]
}

interface CareData {
  care: string
  occasion: string
  season: string
  weight: string
  sku: string
}

interface ProductForm {
  name: string
  slug: string
  description: string
  basePrice: string
  category: string
  primaryImage: string
  galleryImages: string[]
  fabric: string
  style: string
  fit: string
  material: string
  careInstructions: string
  occasion: string
  season: string
  weight: string
  sku: string
  isActive: boolean
  eventId: string
}

interface VariantForm {
  id?: string
  name: string
  color: string
  colorName: string
  size: string
  price: string
  stock: string
  image: string
  isActive: boolean
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { value: 'dress', label: 'Dress' },
  { value: 'tshirt', label: 'T-Shirt' },
  { value: 'top', label: 'Top / Blouse' },
  { value: 'skirt', label: 'Skirt' },
  { value: 'trouser', label: 'Trouser / Pants' },
  { value: 'kaba', label: 'Kaba & Slit' },
  { value: 'african-wear', label: 'African Wear' },
  { value: 'accessory', label: 'Accessory' },
  { value: 'mug', label: 'Mug' },
  { value: 'poster', label: 'Poster' },
  { value: 'other', label: 'Other' },
] as const

const FABRIC_OPTIONS = ['Cotton', 'Polyester', 'Silk', 'Linen', 'Chiffon', 'Satin', 'Velvet', 'Wax Print', 'Kente', 'Brocade', 'Lace', 'Denim', 'Jersey', 'Wool', 'Blended', 'Other']
const STYLE_OPTIONS = ['A-Line', 'Maxi', 'Mini', 'Midi', 'Bodycon', 'Shift', 'Wrap', 'Sheath', 'Ball Gown', 'Mermaid', 'Empire Waist', 'Kaftan', 'Straight Cut', 'Peplum', 'Tunic', 'Other']
const FIT_OPTIONS = ['Regular', 'Slim', 'Loose', 'Oversized', 'Fitted', 'Relaxed', 'A-Line Fit', 'Bodycon', 'Other']

const SEASON_OPTIONS = ['All Season', 'Spring', 'Summer', 'Fall', 'Winter']

const OCCASION_SUGGESTIONS = ['Casual', 'Formal', 'Party', 'Wedding', 'Church', 'Work', 'Beach', 'Evening', 'Everyday', 'Festival']

const COLOR_PALETTE = [
  { hex: '#000000', name: 'Black' },
  { hex: '#FFFFFF', name: 'White' },
  { hex: '#000080', name: 'Navy' },
  { hex: '#D32F2F', name: 'Red' },
  { hex: '#4169E1', name: 'Royal Blue' },
  { hex: '#2E7D32', name: 'Green' },
  { hex: '#FFD600', name: 'Yellow' },
  { hex: '#6A1B9A', name: 'Purple' },
  { hex: '#E91E63', name: 'Pink' },
  { hex: '#FF5722', name: 'Orange' },
  { hex: '#795548', name: 'Brown' },
  { hex: '#D2B48C', name: 'Beige' },
  { hex: '#9E9E9E', name: 'Grey' },
  { hex: '#800000', name: 'Maroon' },
  { hex: '#009688', name: 'Teal' },
  { hex: '#FFB300', name: 'Gold' },
  { hex: '#FF7043', name: 'Coral' },
  { hex: '#80CBC4', name: 'Mint' },
  { hex: '#880E4F', name: 'Burgundy' },
  { hex: '#B39DDB', name: 'Lavender' },
]

const SIZE_PRESETS = [
  'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'Free Size',
  '6', '8', '10', '12', '14', '16', '18', '20', '22', '24',
]

const emptyForm: ProductForm = {
  name: '',
  slug: '',
  description: '',
  basePrice: '',
  category: 'dress',
  primaryImage: '',
  galleryImages: [],
  fabric: '',
  style: '',
  fit: '',
  material: '',
  careInstructions: '',
  occasion: '',
  season: 'All Season',
  weight: '',
  sku: '',
  isActive: true,
  eventId: '',
}

const emptyVariant: VariantForm = {
  name: '',
  color: '#000000',
  colorName: '',
  size: '',
  price: '',
  stock: '0',
  image: '',
  isActive: true,
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '')
}

function parseGalleryImages(json: string | null): string[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function parseCareData(raw: string | null): CareData {
  const empty: CareData = { care: '', occasion: '', season: '', weight: '', sku: '' }
  if (!raw) return empty
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return {
        care: typeof parsed.care === 'string' ? parsed.care : raw,
        occasion: typeof parsed.occasion === 'string' ? parsed.occasion : '',
        season: typeof parsed.season === 'string' ? parsed.season : '',
        weight: typeof parsed.weight === 'string' ? parsed.weight : '',
        sku: typeof parsed.sku === 'string' ? parsed.sku : '',
      }
    }
    return { ...empty, care: raw }
  } catch {
    return { ...empty, care: raw }
  }
}

function buildCareString(care: string, occasion: string, season: string, weight: string, sku: string): string {
  const hasMeta = occasion || season || weight || sku
  if (!hasMeta) return care
  const obj: Record<string, string> = {}
  if (care) obj.care = care
  if (occasion) obj.occasion = occasion
  if (season) obj.season = season
  if (weight) obj.weight = weight
  if (sku) obj.sku = sku
  return JSON.stringify(obj)
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  /* Product form state */
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  /* Active tab in product form */
  const [formTab, setFormTab] = useState<'basic' | 'details' | 'store' | 'media'>('basic')

  /* Variant editing state */
  const [variantForms, setVariantForms] = useState<Record<string, VariantForm[]>>({})
  const [addingVariant, setAddingVariant] = useState<string | null>(null)
  const [editingVariant, setEditingVariant] = useState<string | null>(null)
  const [variantSaving, setVariantSaving] = useState(false)

  /* Expanded cards */
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)

  /* Batch variant creation */
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [batchSelectedSizes, setBatchSelectedSizes] = useState<Set<string>>(new Set())
  const [batchProductId, setBatchProductId] = useState<string | null>(null)

  const { toast } = useToast()
  const { confirm } = useConfirm()

  /* -------------------------------------------------------------- */
  /*  Fetch                                                          */
  /* -------------------------------------------------------------- */

  const fetchProducts = useCallback(() => {
    fetch('/api/products?all=1')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data) => {
        setProducts(ensureArray(data))
        setLoading(false)
      })
      .catch(() => {
        toast({ title: 'Failed to load products', variant: 'destructive' })
        setLoading(false)
      })
  }, [toast])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  /* -------------------------------------------------------------- */
  /*  Form helpers                                                   */
  /* -------------------------------------------------------------- */

  const updateForm = (key: keyof ProductForm, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'name' && !editingId) {
      setForm((prev) => ({ ...prev, slug: slugify(value as string) }))
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormTab('basic')
    setShowForm(true)
  }

  const openEdit = (product: Product) => {
    setEditingId(product.id)
    const careData = parseCareData(product.careInstructions)
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      basePrice: String(product.basePrice),
      category: product.category,
      primaryImage: product.primaryImage || '',
      galleryImages: parseGalleryImages(product.galleryImages),
      fabric: product.fabric || '',
      style: product.style || '',
      fit: product.fit || '',
      material: product.material || '',
      careInstructions: careData.care,
      occasion: careData.occasion,
      season: careData.season || 'All Season',
      weight: careData.weight,
      sku: careData.sku,
      isActive: product.isActive,
      eventId: product.eventId || '',
    })
    setFormTab('basic')
    setShowForm(true)
    setExpandedProduct(product.id)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  /* -------------------------------------------------------------- */
  /*  Product CRUD                                                  */
  /* -------------------------------------------------------------- */

  const handleSaveProduct = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Product name is required', variant: 'destructive' })
      return
    }
    if (!form.basePrice || Number(form.basePrice) < 0) {
      toast({ title: 'A valid base price is required', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const careString = buildCareString(
        form.careInstructions.trim(),
        form.occasion.trim(),
        form.season,
        form.weight.trim(),
        form.sku.trim()
      )

      const body = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim() || null,
        basePrice: parseFloat(form.basePrice),
        category: form.category,
        primaryImage: form.primaryImage.trim() || null,
        galleryImages: form.galleryImages.length > 0 ? JSON.stringify(form.galleryImages) : null,
        fabric: form.fabric.trim() || null,
        style: form.style.trim() || null,
        fit: form.fit.trim() || null,
        material: form.material.trim() || null,
        careInstructions: careString || null,
        isActive: form.isActive,
        eventId: form.eventId.trim() || null,
      }

      if (editingId) {
        const { ok } = await fetchWrite('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...body }),
        })
        if (!ok) throw new Error()
        toast({ title: 'Product updated' })
      } else {
        const { ok } = await fetchWrite('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!ok) throw new Error()
        toast({ title: 'Product created' })
      }

      cancelForm()
      fetchProducts()
    } catch {
      toast({ title: 'Failed to save product', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProduct = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Delete Product',
      description: `Delete "${name}"? This will also delete all its variants and cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      const { ok: success } = await fetchWrite(`/api/products?id=${id}`, { method: 'DELETE' })
      if (!success) throw new Error()
      toast({ title: 'Product deleted' })
      fetchProducts()
    } catch {
      toast({ title: 'Failed to delete product', variant: 'destructive' })
    }
  }

  const handleToggleActive = async (product: Product) => {
    try {
      const { ok } = await fetchWrite('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, isActive: !product.isActive }),
      })
      if (!ok) throw new Error()
      toast({ title: `${product.name} ${!product.isActive ? 'activated' : 'deactivated'}` })
      fetchProducts()
    } catch {
      toast({ title: 'Failed to toggle product status', variant: 'destructive' })
    }
  }

  /* -------------------------------------------------------------- */
  /*  Variant CRUD                                                  */
  /* -------------------------------------------------------------- */

  const toggleExpand = (productId: string) => {
    setExpandedProduct((prev) => (prev === productId ? null : productId))
    setAddingVariant(null)
    setEditingVariant(null)
  }

  const startAddVariant = (productId: string) => {
    setAddingVariant(productId)
    setEditingVariant(null)
    if (!variantForms[productId]) {
      setVariantForms((prev) => ({ ...prev, [productId]: [{ ...emptyVariant }] }))
    }
  }

  const startEditVariant = (productId: string, variant: ProductVariant) => {
    setEditingVariant(variant.id || null)
    setAddingVariant(null)
    setVariantForms((prev) => ({
      ...prev,
      [productId]: [{
        id: variant.id,
        name: variant.name,
        color: variant.color,
        colorName: variant.colorName,
        size: variant.size,
        price: String(variant.price),
        stock: String(variant.stock),
        image: variant.image || '',
        isActive: variant.isActive,
      }],
    }))
  }

  const cancelVariantForm = (productId: string) => {
    setAddingVariant(null)
    setEditingVariant(null)
    setVariantForms((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
  }

  const updateVariantForm = (productId: string, index: number, key: keyof VariantForm, value: unknown) => {
    setVariantForms((prev) => {
      const arr = [...(prev[productId] || [])]
      arr[index] = { ...arr[index], [key]: value }
      return { ...prev, [productId]: arr }
    })
  }

  const handleSaveVariant = async (productId: string) => {
    const forms = variantForms[productId]
    if (!forms || forms.length === 0) return
    const row = forms[0]
    if (!row.colorName.trim() || !row.size.trim() || !row.price) {
      toast({ title: 'Color name, size, and price are required', variant: 'destructive' })
      return
    }

    setVariantSaving(true)
    try {
      const body = {
        productId,
        name: row.name.trim() || `${row.colorName} / ${row.size}`,
        color: row.color || '#000000',
        colorName: row.colorName.trim(),
        size: row.size.trim(),
        price: parseFloat(row.price) || 0,
        stock: parseInt(row.stock, 10) || 0,
        image: row.image.trim() || null,
        isActive: row.isActive,
      }

      if (editingVariant) {
        const { ok } = await fetchWrite('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingVariant, action: 'update-variant', ...body }),
        })
        if (!ok) throw new Error()
        toast({ title: 'Variant updated' })
      } else {
        const { ok } = await fetchWrite('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create-variant', ...body }),
        })
        if (!ok) throw new Error()
        toast({ title: 'Variant added' })
      }

      cancelVariantForm(productId)
      fetchProducts()
    } catch {
      toast({ title: 'Failed to save variant', variant: 'destructive' })
    } finally {
      setVariantSaving(false)
    }
  }

  const handleDeleteVariant = async (variantId: string, label: string) => {
    const ok = await confirm({
      title: 'Delete Variant',
      description: `Are you sure you want to delete variant "${label}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      const { ok: success } = await fetchWrite(`/api/products?variantId=${variantId}`, { method: 'DELETE' })
      if (!success) throw new Error()
      toast({ title: 'Variant deleted' })
      fetchProducts()
    } catch {
      toast({ title: 'Failed to delete variant', variant: 'destructive' })
    }
  }

  /* -------------------------------------------------------------- */
  /*  Batch variant creation                                        */
  /* -------------------------------------------------------------- */

  const openBatchDialog = (productId: string) => {
    const vf = variantForms[productId]?.[0]
    if (!vf || !vf.colorName.trim()) {
      toast({ title: 'Please set a color name first', variant: 'destructive' })
      return
    }
    setBatchProductId(productId)
    setBatchSelectedSizes(new Set())
    setBatchDialogOpen(true)
  }

  const toggleBatchSize = (size: string) => {
    setBatchSelectedSizes((prev) => {
      const next = new Set(prev)
      if (next.has(size)) {
        next.delete(size)
      } else {
        next.add(size)
      }
      return next
    })
  }

  const selectAllBatchSizes = () => {
    setBatchSelectedSizes(new Set(SIZE_PRESETS))
  }

  const clearBatchSizes = () => {
    setBatchSelectedSizes(new Set())
  }

  const handleBatchCreate = async () => {
    if (!batchProductId || batchSelectedSizes.size === 0) return
    const vf = variantForms[batchProductId]?.[0]
    if (!vf) return

    setVariantSaving(true)
    setBatchDialogOpen(false)
    let created = 0
    let failed = 0

    for (const size of batchSelectedSizes) {
      try {
        const { ok } = await fetchWrite('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create-variant',
            productId: batchProductId,
            name: `${vf.colorName.trim()} / ${size}`,
            color: vf.color || '#000000',
            colorName: vf.colorName.trim(),
            size,
            price: parseFloat(vf.price) || 0,
            stock: 0,
            image: vf.image.trim() || null,
            isActive: vf.isActive,
          }),
        })
        if (ok) {
          created++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    cancelVariantForm(batchProductId)
    fetchProducts()
    setVariantSaving(false)

    if (failed === 0) {
      toast({ title: `${created} variants created` })
    } else {
      toast({
        title: `Created ${created}, ${failed} failed`,
        variant: 'destructive',
      })
    }
  }

  /* -------------------------------------------------------------- */
  /*  Filtered list                                                 */
  /* -------------------------------------------------------------- */

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !categoryFilter || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  /* -------------------------------------------------------------- */
  /*  Render Product Form                                           */
  /* -------------------------------------------------------------- */

  const renderProductForm = () => (
    <div className="glass rounded-2xl p-6 admin-scrollbar">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-semibold">{editingId ? 'Edit Product' : 'New Product'}</h3>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {([
          { key: 'basic' as const, label: 'Basic Info', icon: Package },
          { key: 'store' as const, label: 'Store Details', icon: ShoppingBag },
          { key: 'details' as const, label: 'Description', icon: Info },
          { key: 'media' as const, label: 'Images & Media', icon: ImagePlus },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setFormTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              formTab === tab.key
                ? 'bg-smgh-green/10 text-smgh-green border border-smgh-green/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Basic Info Tab */}
      {formTab === 'basic' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Name *</label>
            <Input placeholder="e.g. Worship Night Tee" value={form.name} onChange={(e) => updateForm('name', e.target.value)} className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500" />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Slug (auto-generated)</label>
            <Input placeholder="product-slug" value={form.slug} onChange={(e) => updateForm('slug', e.target.value)} className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500" />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Base Price (₵) *</label>
            <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.basePrice} onChange={(e) => updateForm('basePrice', e.target.value)} className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500" />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Category</label>
            <select value={form.category} onChange={(e) => updateForm('category', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-700 text-white focus:outline-none focus:border-smgh-green">
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">SKU</label>
            <Input placeholder="e.g. SMGH-DRESS-001" value={form.sku} onChange={(e) => updateForm('sku', e.target.value)} className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500" />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Season</label>
            <select value={form.season} onChange={(e) => updateForm('season', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-700 text-white focus:outline-none focus:border-smgh-green">
              {SEASON_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Occasion</label>
            <input
              list="occasion-suggestions"
              placeholder="e.g. Casual, Wedding..."
              value={form.occasion}
              onChange={(e) => updateForm('occasion', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-700 text-white focus:outline-none focus:border-smgh-green bg-white/5 placeholder:text-gray-500"
            />
            <datalist id="occasion-suggestions">
              {OCCASION_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Weight</label>
            <Input placeholder="e.g. 200g" value={form.weight} onChange={(e) => updateForm('weight', e.target.value)} className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500" />
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => updateForm('isActive', !form.isActive)} className="focus:outline-none">
              {form.isActive ? <ToggleRight className="w-6 h-6 text-smgh-green" /> : <ToggleLeft className="w-6 h-6 text-gray-500" />}
            </button>
            <span className="text-sm text-gray-300">{form.isActive ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      )}

      {/* Store Details Tab */}
      {formTab === 'store' && (
        <div className="space-y-4">
          <p className="text-gray-500 text-xs">Add product-specific details for a professional shopping experience.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-xs mb-1 flex items-center gap-1 block">
                <Layers className="w-3 h-3" /> Fabric
              </label>
              <select value={form.fabric} onChange={(e) => updateForm('fabric', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-700 text-white focus:outline-none focus:border-smgh-green">
                <option value="">Select fabric...</option>
                {FABRIC_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 flex items-center gap-1 block">
                <Ruler className="w-3 h-3" /> Style
              </label>
              <select value={form.style} onChange={(e) => updateForm('style', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-700 text-white focus:outline-none focus:border-smgh-green">
                <option value="">Select style...</option>
                {STYLE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 flex items-center gap-1 block">
                <Package className="w-3 h-3" /> Fit
              </label>
              <select value={form.fit} onChange={(e) => updateForm('fit', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-700 text-white focus:outline-none focus:border-smgh-green">
                <option value="">Select fit...</option>
                {FIT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 flex items-center gap-1 block">
                <Layers className="w-3 h-3" /> Material
              </label>
              <Input placeholder="e.g. 100% Cotton, Cotton Blend" value={form.material} onChange={(e) => updateForm('material', e.target.value)} className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500" />
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Care Instructions</label>
            <Textarea
              placeholder="e.g. Machine wash cold, hang dry, do not bleach, iron on low heat..."
              value={form.careInstructions}
              onChange={(e) => updateForm('careInstructions', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:border-smgh-green resize-none text-sm"
            />
          </div>
        </div>
      )}

      {/* Description Tab */}
      {formTab === 'details' && (
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Product Description</label>
          <RichTextEditor
            value={form.description}
            onChange={(html) => updateForm('description', html)}
            placeholder="Describe the product in detail — materials, features, sizing info, etc."
            minHeight="min-h-[300px]"
          />
        </div>
      )}

      {/* Images Tab */}
      {formTab === 'media' && (
        <div className="space-y-6">
          <div>
            <h4 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
              <ImagePlus className="w-4 h-4 text-smgh-green" /> Featured Image
            </h4>
            <MediaPicker
              value={form.primaryImage}
              onChange={(url) => updateForm('primaryImage', url)}
              label="Featured / Primary Image"
              previewHeight="h-48"
            />
          </div>
          <div>
            <h4 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-400" /> Gallery Images
            </h4>
            <p className="text-gray-500 text-xs mb-3">Add multiple images to showcase the product from different angles.</p>
            <MultiMediaPicker
              value={form.galleryImages}
              onChange={(urls) => updateForm('galleryImages', urls)}
              label="Gallery Images"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-800">
        <Button onClick={handleSaveProduct} disabled={saving} variant="success">
          {saving ? 'Saving...' : <><Save className="w-3 h-3 mr-1" />{editingId ? 'Update Product' : 'Create Product'}</>}
        </Button>
        <Button onClick={cancelForm} variant="outline" className="border-gray-700 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30">
          Cancel
        </Button>
      </div>
    </div>
  )

  /* -------------------------------------------------------------- */
  /*  Render Variant Form (inline)                                  */
  /* -------------------------------------------------------------- */

  const renderVariantInlineForm = (product: Product) => {
    const pid = product.id
    const forms = variantForms[pid]
    if (!forms || forms.length === 0) return null
    const row = forms[0]

    return (
      <div className="glass rounded-xl p-4 mb-3 space-y-3 border border-gray-700">
        <p className="text-gray-400 text-xs font-medium">
          {editingVariant ? 'Edit Variant' : 'New Variant'}
        </p>

        {/* Color Palette */}
        <div>
          <label className="text-gray-500 text-[10px] mb-1.5 flex items-center gap-1 block">
            <Palette className="w-3 h-3" /> Quick Color Selection
          </label>
          <div className="grid grid-cols-10 gap-1.5">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={`${c.name} (${c.hex})`}
                onClick={() => {
                  updateVariantForm(pid, 0, 'color', c.hex)
                  updateVariantForm(pid, 0, 'colorName', c.name)
                }}
                className="relative w-7 h-7 rounded-lg border-2 transition-all hover:scale-110"
                style={{
                  backgroundColor: c.hex,
                  borderColor: row.color === c.hex ? '#2E7D32' : '#333',
                  boxShadow: row.color === c.hex ? '0 0 0 2px rgba(46, 125, 50, 0.3)' : 'none',
                }}
              >
                {c.hex === '#FFFFFF' && (
                  <span className="absolute inset-0 rounded-[5px] border border-gray-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex items-end gap-3">
            <div className="flex-shrink-0">
              <label className="text-gray-500 text-[10px] mb-1 block">Swatch</label>
              <input
                type="color"
                value={row.color}
                onChange={(e) => updateVariantForm(pid, 0, 'color', e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="text-gray-500 text-[10px] mb-1 block">Color Name *</label>
              <Input placeholder="e.g. Black" value={row.colorName} onChange={(e) => updateVariantForm(pid, 0, 'colorName', e.target.value)} className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm" />
            </div>
          </div>

          {/* Size Presets */}
          <div className="col-span-2">
            <label className="text-gray-500 text-[10px] mb-1.5 flex items-center gap-1 block">
              <Ruler className="w-3 h-3" /> Quick Size Selection
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SIZE_PRESETS.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => updateVariantForm(pid, 0, 'size', sz)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border ${
                    row.size === sz
                      ? 'bg-smgh-green/20 text-smgh-green border-smgh-green/40'
                      : 'bg-white/5 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
            <Input placeholder="Or type custom size..." value={row.size} onChange={(e) => updateVariantForm(pid, 0, 'size', e.target.value)} className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm" />
          </div>

          <div>
            <label className="text-gray-500 text-[10px] mb-1 block">Price (₵) *</label>
            <Input type="number" step="0.01" min="0" placeholder="0.00" value={row.price} onChange={(e) => updateVariantForm(pid, 0, 'price', e.target.value)} className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm" />
          </div>
          <div>
            <label className="text-gray-500 text-[10px] mb-1 block">Stock</label>
            <Input type="number" min="0" placeholder="0" value={row.stock} onChange={(e) => updateVariantForm(pid, 0, 'stock', e.target.value)} className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm" />
          </div>
          <div>
            <label className="text-gray-500 text-[10px] mb-1 block">Image URL</label>
            <Input placeholder="https://" value={row.image} onChange={(e) => updateVariantForm(pid, 0, 'image', e.target.value)} className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm" />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => updateVariantForm(pid, 0, 'isActive', !row.isActive)} className="focus:outline-none">
                {row.isActive ? <ToggleRight className="w-5 h-5 text-smgh-green" /> : <ToggleLeft className="w-5 h-5 text-gray-500" />}
              </button>
              <span className="text-xs text-gray-400">{row.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-gray-800">
          <Button size="sm" onClick={() => handleSaveVariant(pid)} disabled={variantSaving} variant="success" className="h-7 text-xs px-3">
            {variantSaving ? 'Saving...' : <><Save className="w-3 h-3 mr-1" />{editingVariant ? 'Update' : 'Add'}</>}
          </Button>
          {!editingVariant && (
            <Button
              size="sm"
              onClick={() => openBatchDialog(pid)}
              disabled={variantSaving || !row.colorName.trim()}
              className="h-7 text-xs px-3 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Copy className="w-3 h-3 mr-1" />
              Create All Sizes
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => cancelVariantForm(pid)} className="border-gray-700 text-gray-400 h-7 text-xs px-3">
            <X className="w-3 h-3 mr-1" />Cancel
          </Button>
        </div>
      </div>
    )
  }

  /* -------------------------------------------------------------- */
  /*  Render Stock Overview                                         */
  /* -------------------------------------------------------------- */

  const renderStockOverview = (variants: ProductVariant[]) => {
    if (!variants || variants.length === 0) return null

    const totalVariants = variants.length
    const activeVariants = variants.filter(v => v.isActive)
    const totalStock = activeVariants.reduce((sum, v) => sum + v.stock, 0)
    const uniqueColors = [...new Set(activeVariants.map(v => v.colorName).filter(Boolean))]
    const uniqueSizes = [...new Set(activeVariants.map(v => v.size).filter(Boolean))]
    const lowStockVariants = activeVariants.filter(v => v.stock > 0 && v.stock < 5)
    const outOfStockVariants = activeVariants.filter(v => v.stock === 0)

    return (
      <div className="rounded-xl border border-gray-700/50 bg-white/[0.02] p-3 mb-3 space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{totalVariants}</p>
            <p className="text-[10px] text-gray-500">Total Variants</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-smgh-green">{totalStock}</p>
            <p className="text-[10px] text-gray-500">Total Stock</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{uniqueColors.length}</p>
            <p className="text-[10px] text-gray-500">Colors</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{uniqueSizes.length}</p>
            <p className="text-[10px] text-gray-500">Sizes</p>
          </div>
        </div>

        {(lowStockVariants.length > 0 || outOfStockVariants.length > 0) && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-800">
            {lowStockVariants.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-3 h-3" />
                {lowStockVariants.length} low stock
              </span>
            )}
            {outOfStockVariants.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertTriangle className="w-3 h-3" />
                {outOfStockVariants.length} out of stock
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  /* -------------------------------------------------------------- */
  /*  Render Enhanced Product Card                                  */
  /* -------------------------------------------------------------- */

  const renderProductCard = (product: Product) => {
    const isExpanded = expandedProduct === product.id
    const variants = product.variants || []
    const variantCount = variants.length
    const galleryImages = parseGalleryImages(product.galleryImages)
    const galleryCount = galleryImages.length
    const careData = parseCareData(product.careInstructions)

    const totalStock = variants.filter(v => v.isActive).reduce((sum, v) => sum + v.stock, 0)
    const uniqueColorVariants = [...new Map(
      variants.filter(v => v.isActive).map(v => [v.colorName, v])
    ).values()]
    const availableSizes = [...new Set(variants.filter(v => v.isActive).map(v => v.size).filter(Boolean))]

    const materialBadges: string[] = []
    if (product.fabric) materialBadges.push(product.fabric)
    if (product.material) materialBadges.push(product.material)

    const careSummary = careData.care ? stripHtml(careData.care).slice(0, 50) : ''

    return (
      <div key={product.id} className="glass rounded-2xl overflow-hidden transition-colors">
        {/* Card Header / Image */}
        <div className="relative h-48 bg-white/5">
          {product.primaryImage ? (
            <img
              src={product.primaryImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-gray-700" />
            </div>
          )}

          {/* Status badge */}
          <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${
            product.isActive
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
          }`}>
            {product.isActive ? 'Active' : 'Inactive'}
          </span>

          {/* Category badge */}
          <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-gray-300 border border-white/10">
            {CATEGORIES.find(c => c.value === product.category)?.label || product.category}
          </span>

          {/* Gallery count */}
          {galleryCount > 0 && (
            <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
              {galleryCount} photo{galleryCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-white font-semibold truncate">{product.name}</h3>
            <span className="text-smgh-green font-bold text-sm whitespace-nowrap">
              ₵{product.basePrice.toFixed(2)}
            </span>
          </div>

          {/* Material info badges */}
          {materialBadges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {materialBadges.map((badge, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  {badge}
                </span>
              ))}
              {product.style && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">{product.style}</span>
              )}
              {product.fit && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">{product.fit}</span>
              )}
            </div>
          )}

          {/* Color swatches strip */}
          {uniqueColorVariants.length > 0 && (
            <div className="flex items-center gap-1 mb-2">
              {uniqueColorVariants.slice(0, 8).map((v) => (
                <div
                  key={`${v.colorName}-${v.size}`}
                  className="w-5 h-5 rounded-full border border-gray-600 flex-shrink-0"
                  style={{ backgroundColor: v.color }}
                  title={v.colorName}
                />
              ))}
              {uniqueColorVariants.length > 8 && (
                <span className="text-[10px] text-gray-500 ml-1">+{uniqueColorVariants.length - 8} more</span>
              )}
            </div>
          )}

          {/* Available sizes */}
          {availableSizes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {availableSizes.slice(0, 8).map((sz) => (
                <span key={sz} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/5 text-gray-400 border border-gray-700">
                  {sz}
                </span>
              ))}
              {availableSizes.length > 8 && (
                <span className="text-[9px] text-gray-500 self-center">+{availableSizes.length - 8}</span>
              )}
            </div>
          )}

          {/* Gallery thumbnail strip */}
          {galleryImages.length > 0 && (
            <div className="flex gap-1 mb-2 overflow-hidden">
              {galleryImages.slice(0, 3).map((img, idx) => (
                <div key={idx} className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 border border-gray-700">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              {galleryImages.length > 3 && (
                <div className="w-12 h-12 rounded-md flex-shrink-0 bg-white/5 border border-gray-700 flex items-center justify-center">
                  <span className="text-[10px] text-gray-500">+{galleryImages.length - 3}</span>
                </div>
              )}
            </div>
          )}

          {/* Care instructions summary */}
          {careSummary && (
            <p className="text-gray-500 text-[11px] mb-2 truncate italic">&quot;{careSummary}&quot;</p>
          )}

          {product.description && (
            <p className="text-gray-500 text-xs line-clamp-2 mb-3">{stripHtml(product.description)}</p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              {variantCount} variant{variantCount !== 1 ? 's' : ''}
            </span>
            {variantCount > 0 && (
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {totalStock} in stock
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => openEdit(product)} className="text-gray-400 hover:text-white h-8 px-2">
              <Edit3 className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleToggleActive(product)} className="text-gray-400 hover:text-white h-8 px-2" title={product.isActive ? 'Deactivate' : 'Activate'}>
              {product.isActive ? <ToggleRight className="w-3.5 h-3.5 text-green-400" /> : <ToggleLeft className="w-3.5 h-3.5" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => toggleExpand(product.id)} className="text-gray-400 hover:text-white h-8 px-2 text-xs" title="Manage variants">
              <Package className="w-3.5 h-3.5 mr-1" />
              {isExpanded ? 'Hide' : 'Variants'}
            </Button>
            <div className="flex-1" />
            <Button size="sm" variant="ghost" onClick={() => handleDeleteProduct(product.id, product.name)} className="text-gray-400 hover:text-red-400 h-8 px-2">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Expanded Variants Section */}
        {isExpanded && (
          <div className="border-t border-gray-800 p-4 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-smgh-green" />
                Variants
                <span className="text-gray-500 text-xs">({variantCount})</span>
              </h4>
              <Button size="sm" variant="ghost" onClick={() => startAddVariant(product.id)} disabled={addingVariant === product.id} className="text-smgh-green text-xs hover:text-smgh-green-light h-7 px-2">
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>

            {/* Stock Overview */}
            {renderStockOverview(variants)}

            {/* Add / Edit Variant Inline Form */}
            {(addingVariant === product.id || editingVariant) && (
              renderVariantInlineForm(product)
            )}

            {/* Variants Table */}
            {variants.length === 0 && !addingVariant && !editingVariant ? (
              <p className="text-gray-500 text-xs text-center py-4 border border-dashed border-gray-700 rounded-lg">
                No variants yet. Click &quot;Add&quot; to create one.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto admin-scrollbar">
                {variants.map((v) => {
                  const isOutOfStock = v.stock === 0
                  const isLowStock = v.stock > 0 && v.stock < 5
                  return (
                    <div key={v.id} className={`flex items-center gap-2 p-2.5 rounded-lg transition-colors ${
                      !v.isActive ? 'bg-white/[0.01] opacity-60' : isOutOfStock ? 'bg-red-500/[0.03] border border-red-500/10' : 'bg-white/[0.03]'
                    }`}>
                      {v.image ? (
                        <div className="w-7 h-7 rounded-md border border-gray-600 flex-shrink-0 overflow-hidden">
                          <img src={v.image} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-md border border-gray-600 flex-shrink-0" style={{ backgroundColor: v.color }} title={v.color} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-white font-medium truncate">{v.colorName}</span>
                          <span className="text-gray-500">/</span>
                          <span className="text-gray-300">{v.size}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>₵{v.price.toFixed(2)}</span>
                          <span className={`flex items-center gap-1 ${isOutOfStock ? 'text-red-400 font-medium' : isLowStock ? 'text-amber-400' : ''}`}>
                            {isOutOfStock && <AlertTriangle className="w-3 h-3" />}
                            Stock: {v.stock}
                          </span>
                        </div>
                      </div>
                      {!v.isActive && (
                        <span className="text-[10px] text-gray-500 bg-gray-500/10 px-1.5 py-0.5 rounded">Inactive</span>
                      )}
                      {isLowStock && (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Low</span>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => startEditVariant(product.id, v)} className="text-gray-500 hover:text-white h-7 w-7 p-0">
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteVariant(v.id, `${v.colorName} / ${v.size}`)} className="text-gray-500 hover:text-red-400 h-7 w-7 p-0">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  /* -------------------------------------------------------------- */
  /*  Render                                                        */
  /* -------------------------------------------------------------- */

  return (
    <div>
      <PageLoadingOverlay visible={saving || variantSaving} message={variantSaving ? 'Creating variants...' : 'Saving...'} />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-gray-400 text-sm">Manage shop merchandise &amp; variants</p>
        </div>
        <Button onClick={() => (showForm ? cancelForm() : openCreate())} variant="success">
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Cancel' : 'Add Product'}
        </Button>
      </div>

      {/* Search + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-700 text-white focus:outline-none focus:border-smgh-green bg-transparent min-w-[160px]"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="mb-6">
          {renderProductForm()}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 animate-pulse">
              <div className="bg-white/10 rounded-lg h-40 mb-4" />
              <div className="bg-white/10 rounded h-4 w-3/4 mb-2" />
              <div className="bg-white/10 rounded h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">
            {search || categoryFilter ? 'No products match your search or filter.' : 'No products yet. Click "Add Product" to create one.'}
          </p>
        </div>
      ) : (
        /* Product Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(renderProductCard)}
        </div>
      )}

      {/* ─── Batch Variant Creation Dialog ─── */}
      <Dialog open={batchDialogOpen} onOpenChange={(open) => {
        setBatchDialogOpen(open)
        if (!open) setBatchSelectedSizes(new Set())
      }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden bg-[#1a1a1a] border-gray-800 text-white flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Copy className="w-5 h-5 text-purple-400" />
              Batch Create Variants
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Select sizes to create variants with the current color and price. Stock will default to 0 for each.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 py-2">
            {/* Preview of selected color */}
            {batchProductId && variantForms[batchProductId]?.[0] && (
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/[0.03] border border-gray-700/50">
                <div
                  className="w-8 h-8 rounded-lg border border-gray-600"
                  style={{ backgroundColor: variantForms[batchProductId][0].color }}
                />
                <div>
                  <p className="text-sm text-white font-medium">{variantForms[batchProductId][0].colorName}</p>
                  <p className="text-xs text-gray-500">
                    Price: ₵{variantForms[batchProductId][0].price || '0.00'} per variant
                  </p>
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={selectAllBatchSizes}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 border border-gray-700 hover:border-gray-500 hover:text-white transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearBatchSizes}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 border border-gray-700 hover:border-gray-500 hover:text-white transition-colors"
              >
                Clear
              </button>
              <span className="ml-auto text-xs text-gray-500 self-center">
                {batchSelectedSizes.size} selected
              </span>
            </div>

            {/* Size grid */}
            <div className="grid grid-cols-5 gap-2">
              {SIZE_PRESETS.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => toggleBatchSize(sz)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                    batchSelectedSizes.has(sz)
                      ? 'bg-smgh-green/20 text-smgh-green border-smgh-green/40 shadow-sm'
                      : 'bg-white/5 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-gray-800">
            <Button
              variant="outline"
              onClick={() => setBatchDialogOpen(false)}
              className="border-gray-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBatchCreate}
              disabled={batchSelectedSizes.size === 0 || variantSaving}
              variant="success"
            >
              <Copy className="w-4 h-4 mr-2" />
              Create {batchSelectedSizes.size} Variant{batchSelectedSizes.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
