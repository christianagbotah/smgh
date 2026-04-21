'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Trash2, Edit3, Save, X, ShoppingBag, Search, Package,
  ToggleLeft, ToggleRight, ChevronDown, ChevronUp, ImagePlus,
  Palette, Ruler, Layers, Info
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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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

  const { toast } = useToast()
  const { confirm } = useConfirm()

  /* -------------------------------------------------------------- */
  /*  Fetch                                                          */
  /* -------------------------------------------------------------- */

  const fetchProducts = () => {
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
  }

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      careInstructions: product.careInstructions || '',
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
        careInstructions: form.careInstructions.trim() || null,
        isActive: form.isActive,
        eventId: form.eventId.trim() || null,
      }

      if (editingId) {
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...body }),
        })
        if (!res.ok) throw new Error()
        toast({ title: 'Product updated' })
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error()
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
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'Product deleted' })
      fetchProducts()
    } catch {
      toast({ title: 'Failed to delete product', variant: 'destructive' })
    }
  }

  const handleToggleActive = async (product: Product) => {
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, isActive: !product.isActive }),
      })
      if (!res.ok) throw new Error()
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
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingVariant, action: 'update-variant', ...body }),
        })
        if (!res.ok) throw new Error()
        toast({ title: 'Variant updated' })
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create-variant', ...body }),
        })
        if (!res.ok) throw new Error()
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
      const res = await fetch(`/api/products?variantId=${variantId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'Variant deleted' })
      fetchProducts()
    } catch {
      toast({ title: 'Failed to delete variant', variant: 'destructive' })
    }
  }

  /* -------------------------------------------------------------- */
  /*  Filtered list                                                 */
  /* -------------------------------------------------------------- */

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  /* -------------------------------------------------------------- */
  /*  Render Form                                                   */
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
  /*  Render                                                        */
  /* -------------------------------------------------------------- */

  return (
    <div>
      <PageLoadingOverlay visible={saving || variantSaving} message="Saving..." />

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

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 pl-10"
        />
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
            {search ? 'No products match your search.' : 'No products yet. Click "Add Product" to create one.'}
          </p>
        </div>
      ) : (
        /* Product Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => {
            const isExpanded = expandedProduct === product.id
            const variantCount = product.variants?.length || 0
            const galleryCount = parseGalleryImages(product.galleryImages).length

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

                  {/* Store Details Badges */}
                  {(product.fabric || product.style || product.fit) && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {product.fabric && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">{product.fabric}</span>
                      )}
                      {product.style && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">{product.style}</span>
                      )}
                      {product.fit && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">{product.fit}</span>
                      )}
                    </div>
                  )}

                  {product.description && (
                    <p className="text-gray-500 text-xs line-clamp-2 mb-3">{product.description.replace(/<[^>]*>/g, '')}</p>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {variantCount} variant{variantCount !== 1 ? 's' : ''}
                    </span>
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

                    {/* Add / Edit Variant Inline Form */}
                    {(addingVariant === product.id || editingVariant) && variantForms[product.id] && (
                      <div className="glass rounded-xl p-4 mb-3 space-y-3 border border-gray-700">
                        <p className="text-gray-400 text-xs font-medium">
                          {editingVariant ? 'Edit Variant' : 'New Variant'}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 flex items-end gap-3">
                            <div className="flex-shrink-0">
                              <label className="text-gray-500 text-[10px] mb-1 block">Swatch</label>
                              <input
                                type="color"
                                value={variantForms[product.id][0].color}
                                onChange={(e) => updateVariantForm(product.id, 0, 'color', e.target.value)}
                                className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-gray-500 text-[10px] mb-1 block">Color Name *</label>
                              <Input placeholder="e.g. Black" value={variantForms[product.id][0].colorName} onChange={(e) => updateVariantForm(product.id, 0, 'colorName', e.target.value)} className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm" />
                            </div>
                          </div>
                          <div>
                            <label className="text-gray-500 text-[10px] mb-1 block">Size *</label>
                            <Input placeholder="e.g. L" value={variantForms[product.id][0].size} onChange={(e) => updateVariantForm(product.id, 0, 'size', e.target.value)} className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm" />
                          </div>
                          <div>
                            <label className="text-gray-500 text-[10px] mb-1 block">Price (₵) *</label>
                            <Input type="number" step="0.01" min="0" placeholder="0.00" value={variantForms[product.id][0].price} onChange={(e) => updateVariantForm(product.id, 0, 'price', e.target.value)} className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm" />
                          </div>
                          <div>
                            <label className="text-gray-500 text-[10px] mb-1 block">Stock</label>
                            <Input type="number" min="0" placeholder="0" value={variantForms[product.id][0].stock} onChange={(e) => updateVariantForm(product.id, 0, 'stock', e.target.value)} className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm" />
                          </div>
                          <div>
                            <label className="text-gray-500 text-[10px] mb-1 block">Image URL</label>
                            <Input placeholder="https://" value={variantForms[product.id][0].image} onChange={(e) => updateVariantForm(product.id, 0, 'image', e.target.value)} className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm" />
                          </div>
                          <div className="col-span-2 flex items-center gap-2">
                            <button type="button" onClick={() => updateVariantForm(product.id, 0, 'isActive', !variantForms[product.id][0].isActive)} className="focus:outline-none">
                              {variantForms[product.id][0].isActive ? <ToggleRight className="w-5 h-5 text-smgh-green" /> : <ToggleLeft className="w-5 h-5 text-gray-500" />}
                            </button>
                            <span className="text-xs text-gray-400">{variantForms[product.id][0].isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-gray-800">
                          <Button size="sm" onClick={() => handleSaveVariant(product.id)} disabled={variantSaving} variant="success" className="h-7 text-xs px-3">
                            {variantSaving ? 'Saving...' : <><Save className="w-3 h-3 mr-1" />{editingVariant ? 'Update' : 'Add'}</>}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => cancelVariantForm(product.id)} className="border-gray-700 text-gray-400 h-7 text-xs px-3">
                            <X className="w-3 h-3 mr-1" />Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Variants Table */}
                    {(!product.variants || product.variants.length === 0) && !addingVariant && !editingVariant ? (
                      <p className="text-gray-500 text-xs text-center py-4 border border-dashed border-gray-700 rounded-lg">
                        No variants yet. Click "Add" to create one.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {product.variants?.map((v) => (
                          <div key={v.id} className={`flex items-center gap-2 p-2.5 rounded-lg transition-colors ${v.isActive ? 'bg-white/[0.03]' : 'bg-white/[0.01] opacity-60'}`}>
                            <div className="w-7 h-7 rounded-md border border-gray-600 flex-shrink-0" style={{ backgroundColor: v.color }} title={v.color} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-white font-medium truncate">{v.colorName}</span>
                                <span className="text-gray-500">/</span>
                                <span className="text-gray-300">{v.size}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>₵{v.price.toFixed(2)}</span>
                                <span>Stock: {v.stock}</span>
                                {v.image && <img src={v.image} alt="" className="w-4 h-4 rounded object-cover" />}
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => startEditVariant(product.id, v)} className="text-gray-500 hover:text-white h-7 w-7 p-0">
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteVariant(v.id, `${v.colorName} / ${v.size}`)} className="text-gray-500 hover:text-red-400 h-7 w-7 p-0">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
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
