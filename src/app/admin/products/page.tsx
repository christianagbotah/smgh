'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, Save, X, ShoppingBag, Search, Package, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useConfirm } from '@/hooks/useConfirm'
import PageLoadingOverlay from '@/components/admin/PageLoadingOverlay'
import { ensureArray } from '@/lib/fetch-helpers'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProductVariant {
  id?: string
  name: string
  color: string      // hex "#000000"
  colorName: string  // "Black"
  size: string       // "L"
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
  primaryImage: string | null
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

const CATEGORIES = ['tshirt', 'mug', 'poster', 'other'] as const

const emptyForm: ProductForm = {
  name: '',
  slug: '',
  description: '',
  basePrice: '',
  category: 'tshirt',
  primaryImage: '',
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
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
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
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  /* Variant editing state — keyed by productId */
  const [variantForms, setVariantForms] = useState<Record<string, VariantForm[]>>({})
  const [addingVariant, setAddingVariant] = useState<string | null>(null) // productId being added to
  const [editingVariant, setEditingVariant] = useState<string | null>(null) // variant id being edited
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
    // Auto-generate slug when name changes (only on create)
    if (key === 'name' && !editing) {
      setForm((prev) => ({ ...prev, slug: slugify(value as string) }))
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product.id)
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      basePrice: String(product.basePrice),
      category: product.category,
      primaryImage: product.primaryImage || '',
      isActive: product.isActive,
      eventId: product.eventId || '',
    })
    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditing(null)
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
        isActive: form.isActive,
        eventId: form.eventId.trim() || null,
      }

      if (editing) {
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing, ...body }),
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
      [productId]: [
        {
          id: variant.id,
          name: variant.name,
          color: variant.color,
          colorName: variant.colorName,
          size: variant.size,
          price: String(variant.price),
          stock: String(variant.stock),
          image: variant.image || '',
          isActive: variant.isActive,
        },
      ],
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
        // Update existing variant
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingVariant, action: 'update-variant', ...body }),
        })
        if (!res.ok) throw new Error()
        toast({ title: 'Variant updated' })
      } else {
        // Create new variant
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
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 pl-10"
        />
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="glass rounded-2xl p-6 mb-6 admin-scrollbar">
          <h3 className="text-white font-semibold mb-5">{editing ? 'Edit Product' : 'New Product'}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Name *</label>
              <Input
                placeholder="e.g. Worship Night Tee"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            {/* Slug */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Slug (auto-generated from name)</label>
              <Input
                placeholder="product-slug"
                value={form.slug}
                onChange={(e) => updateForm('slug', e.target.value)}
                className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            {/* Description */}
            <div className="md:col-span-2">
              <label className="text-gray-400 text-xs mb-1 block">Description</label>
              <textarea
                rows={3}
                placeholder="Brief product description…"
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:border-smgh-green resize-none text-sm"
              />
            </div>
            {/* Base Price */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Base Price (₵) *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.basePrice}
                onChange={(e) => updateForm('basePrice', e.target.value)}
                className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            {/* Category */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => updateForm('category', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-smgh-green"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            {/* Primary Image */}
            <div className="md:col-span-2">
              <label className="text-gray-400 text-xs mb-1 block">Primary Image URL</label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={form.primaryImage}
                onChange={(e) => updateForm('primaryImage', e.target.value)}
                className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            {/* Active toggle */}
            <div className="md:col-span-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => updateForm('isActive', !form.isActive)}
                className="focus:outline-none"
              >
                {form.isActive ? (
                  <ToggleRight className="w-6 h-6 text-smgh-green" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-gray-500" />
                )}
              </button>
              <span className="text-sm text-gray-300">{form.isActive ? 'Active — visible in shop' : 'Inactive — hidden from shop'}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-800">
            <Button onClick={handleSaveProduct} disabled={saving} variant="success">
              {saving ? 'Saving…' : (
                <>
                  <Save className="w-3 h-3 mr-1" />
                  {editing ? 'Update Product' : 'Create Product'}
                </>
              )}
            </Button>
            <Button onClick={cancelForm} variant="outline" className="border-gray-700 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30">
              Cancel
            </Button>
          </div>
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
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
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

            return (
              <div key={product.id} className="glass rounded-2xl overflow-hidden transition-colors">
                {/* Card Header / Image */}
                <div className="relative h-44 bg-white/5">
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
                  <span
                    className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.isActive
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}
                  >
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>

                  {/* Category badge */}
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-gray-300 border border-white/10">
                    {product.category}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-white font-semibold truncate">{product.name}</h3>
                    <span className="text-smgh-green font-bold text-sm whitespace-nowrap">
                      ₵{product.basePrice.toFixed(2)}
                    </span>
                  </div>

                  {product.description && (
                    <p className="text-gray-500 text-xs line-clamp-2 mb-3">{product.description}</p>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {variantCount} variant{variantCount !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" />
                      {product.slug}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(product)}
                      className="text-gray-400 hover:text-white h-8 px-2"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleActive(product)}
                      className="text-gray-400 hover:text-white h-8 px-2"
                      title={product.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {product.isActive ? (
                        <ToggleRight className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <ToggleLeft className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleExpand(product.id)}
                      className="text-gray-400 hover:text-white h-8 px-2 text-xs"
                      title="Manage variants"
                    >
                      <Package className="w-3.5 h-3.5 mr-1" />
                      {isExpanded ? 'Hide' : 'Variants'}
                    </Button>
                    <div className="flex-1" />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="text-gray-400 hover:text-red-400 h-8 px-2"
                    >
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
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startAddVariant(product.id)}
                        disabled={addingVariant === product.id}
                        className="text-smgh-green text-xs hover:text-smgh-green-light h-7 px-2"
                      >
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
                          {/* Color Swatch + Hex */}
                          <div className="col-span-2 flex items-end gap-3">
                            <div className="flex-shrink-0">
                              <label className="text-gray-500 text-[10px] mb-1 block">Swatch</label>
                              <div className="relative">
                                <input
                                  type="color"
                                  value={variantForms[product.id][0].color}
                                  onChange={(e) => updateVariantForm(product.id, 0, 'color', e.target.value)}
                                  className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent"
                                />
                              </div>
                            </div>
                            <div className="flex-1">
                              <label className="text-gray-500 text-[10px] mb-1 block">Color Name *</label>
                              <Input
                                placeholder="e.g. Black"
                                value={variantForms[product.id][0].colorName}
                                onChange={(e) => updateVariantForm(product.id, 0, 'colorName', e.target.value)}
                                className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm"
                              />
                            </div>
                          </div>
                          {/* Size */}
                          <div>
                            <label className="text-gray-500 text-[10px] mb-1 block">Size *</label>
                            <Input
                              placeholder="e.g. L"
                              value={variantForms[product.id][0].size}
                              onChange={(e) => updateVariantForm(product.id, 0, 'size', e.target.value)}
                              className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm"
                            />
                          </div>
                          {/* Price */}
                          <div>
                            <label className="text-gray-500 text-[10px] mb-1 block">Price (₵) *</label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={variantForms[product.id][0].price}
                              onChange={(e) => updateVariantForm(product.id, 0, 'price', e.target.value)}
                              className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm"
                            />
                          </div>
                          {/* Stock */}
                          <div>
                            <label className="text-gray-500 text-[10px] mb-1 block">Stock</label>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={variantForms[product.id][0].stock}
                              onChange={(e) => updateVariantForm(product.id, 0, 'stock', e.target.value)}
                              className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm"
                            />
                          </div>
                          {/* Image URL */}
                          <div>
                            <label className="text-gray-500 text-[10px] mb-1 block">Image URL</label>
                            <Input
                              placeholder="https://…"
                              value={variantForms[product.id][0].image}
                              onChange={(e) => updateVariantForm(product.id, 0, 'image', e.target.value)}
                              className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 h-10 text-sm"
                            />
                          </div>
                          {/* Active toggle */}
                          <div className="col-span-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateVariantForm(product.id, 0, 'isActive', !variantForms[product.id][0].isActive)}
                              className="focus:outline-none"
                            >
                              {variantForms[product.id][0].isActive ? (
                                <ToggleRight className="w-5 h-5 text-smgh-green" />
                              ) : (
                                <ToggleLeft className="w-5 h-5 text-gray-500" />
                              )}
                            </button>
                            <span className="text-xs text-gray-400">
                              {variantForms[product.id][0].isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        {/* Form actions */}
                        <div className="flex gap-2 pt-2 border-t border-gray-800">
                          <Button
                            size="sm"
                            onClick={() => handleSaveVariant(product.id)}
                            disabled={variantSaving}
                            variant="success"
                            className="h-7 text-xs px-3"
                          >
                            {variantSaving ? 'Saving…' : (
                              <>
                                <Save className="w-3 h-3 mr-1" />
                                {editingVariant ? 'Update' : 'Add'}
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelVariantForm(product.id)}
                            className="border-gray-700 text-gray-400 h-7 text-xs px-3"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancel
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
                          <div
                            key={v.id}
                            className={`flex items-center gap-2 p-2.5 rounded-lg transition-colors ${
                              v.isActive ? 'bg-white/[0.03]' : 'bg-white/[0.01] opacity-60'
                            }`}
                          >
                            {/* Color swatch */}
                            <div
                              className="w-7 h-7 rounded-md border border-gray-600 flex-shrink-0"
                              style={{ backgroundColor: v.color }}
                              title={v.color}
                            />
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-white font-medium truncate">{v.colorName}</span>
                                <span className="text-gray-500">/</span>
                                <span className="text-gray-300">{v.size}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>₵{v.price.toFixed(2)}</span>
                                <span>Stock: {v.stock}</span>
                                {v.image && (
                                  <img
                                    src={v.image}
                                    alt=""
                                    className="w-4 h-4 rounded object-cover"
                                  />
                                )}
                              </div>
                            </div>
                            {/* Actions */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditVariant(product.id, v)}
                              className="text-gray-500 hover:text-white h-7 w-7 p-0"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteVariant(v.id, `${v.colorName} / ${v.size}`)}
                              className="text-gray-500 hover:text-red-400 h-7 w-7 p-0"
                            >
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
