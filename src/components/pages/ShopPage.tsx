'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, Plus, Minus, X, Trash2, ChevronRight, ChevronLeft,
  CheckCircle, Loader2, CreditCard, Smartphone, Banknote,
  Package, Truck, Tag, Star, ArrowRight, ShoppingBagIcon,
  Mail, Phone, MapPin, User, Building2, Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

// ─── Animation Variants ─────────────────────────────────────────────
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

// ─── Types ──────────────────────────────────────────────────────────
type PaymentProvider = 'paystack' | 'hubtel' | 'manual'
type CheckoutStep = 1 | 2 | 3 | 'success'
type SizeOption = 'S' | 'M' | 'L' | 'XL' | 'XXL'

interface ProductVariant {
  id: string
  name: string
  color: string
  colorName: string
  size: string
  price: number
  stock: number
  image: string | null
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
  variants: ProductVariant[]
  event: { title: string; slug: string } | null
}

interface CartItem {
  productId: string
  variantId: string
  productName: string
  variantName: string
  colorName: string
  size: string
  unitPrice: number
  quantity: number
  image: string | null
}

interface DeliveryInfo {
  name: string
  phone: string
  email: string
  address: string
  city: string
  region: string
}

interface PaymentOption {
  id: PaymentProvider
  name: string
  desc: string
  methods: string[]
  icon: typeof CreditCard
  color: string
  bgColor: string
}

// ─── Constants ──────────────────────────────────────────────────────
const SIZES: SizeOption[] = ['S', 'M', 'L', 'XL', 'XXL']

const ALL_PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'paystack',
    name: 'Pay with Paystack',
    desc: 'Mobile Money, Visa/Mastercard & Bank Transfer via Paystack',
    methods: ['Mobile Money (MTN, Telecel, AT)', 'Visa / Mastercard', 'Bank Transfer'],
    icon: CreditCard,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  {
    id: 'hubtel',
    name: 'Pay with Hubtel',
    desc: 'Mobile Money, Visa/Mastercard & Bank Transfer via Hubtel',
    methods: ['Mobile Money (MTN, Telecel, AT)', 'Visa / Mastercard', 'Bank Transfer'],
    icon: Smartphone,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
  },
  {
    id: 'manual',
    name: 'Cash on Delivery',
    desc: 'Pay when your order arrives',
    methods: ['Cash on delivery', 'Mobile Money transfer on delivery'],
    icon: Banknote,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
  },
]

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
  'Northern', 'Volta', 'Upper East', 'Upper West', 'Bono',
  'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti', 'Western North',
]

const CART_STORAGE_KEY = 'smgh-shop-cart'

// ─── Helpers ────────────────────────────────────────────────────────
function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCart(cart: CartItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
}

function getUniqueColors(product: Product): { color: string; colorName: string }[] {
  const seen = new Map<string, { color: string; colorName: string }>()
  for (const v of product.variants) {
    if (v.isActive && !seen.has(v.colorName)) {
      seen.set(v.colorName, { color: v.color, colorName: v.colorName })
    }
  }
  return Array.from(seen.values())
}

function findVariant(product: Product, colorName: string, size: string): ProductVariant | undefined {
  return product.variants.find(
    v => v.isActive && v.colorName === colorName && v.size === size
  )
}

function getAvailableSizes(product: Product, colorName: string): string[] {
  return product.variants
    .filter(v => v.isActive && v.colorName === colorName)
    .map(v => v.size)
}

// ─── Component ──────────────────────────────────────────────────────
export default function ShopPage() {
  const { toast } = useToast()

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Product interaction state
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({})
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({})

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(loadCart)
  const [cartOpen, setCartOpen] = useState(false)

  // Checkout state
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>(1)
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    name: '', phone: '', email: '', address: '', city: '', region: '',
  })
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>('paystack')
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [activeProvider, setActiveProvider] = useState<string | null>(null)

  // Fetch payment provider setting
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        const provider = data.active_payment_provider || 'paystack'
        setActiveProvider(provider)
        // Auto-select the active provider as default payment method
        if (provider === 'hubtel') {
          setPaymentProvider('hubtel')
        } else if (provider === 'paystack') {
          setPaymentProvider('paystack')
        } else {
          setPaymentProvider('paystack') // 'both' defaults to paystack
        }
      })
      .catch(() => setActiveProvider('paystack'))
  }, [])

  // Build payment options based on admin setting
  const paymentOptions = (() => {
    const manual = ALL_PAYMENT_OPTIONS.find(p => p.id === 'manual')!
    if (!activeProvider) return [ALL_PAYMENT_OPTIONS[0], manual]
    if (activeProvider === 'both') return [ALL_PAYMENT_OPTIONS[0], ALL_PAYMENT_OPTIONS[1], manual]
    const selected = ALL_PAYMENT_OPTIONS.find(p => p.id === activeProvider)
    return selected ? [selected, manual] : [ALL_PAYMENT_OPTIONS[0], manual]
  })()

  // Fetch products
  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then((data: Product[]) => {
        setProducts(data)
        // Auto-select first color/size for each product
        const colors: Record<string, string> = {}
        const sizes: Record<string, string> = {}
        for (const p of data) {
          const uniqueColors = getUniqueColors(p)
          if (uniqueColors.length > 0 && !colors[p.id]) {
            colors[p.id] = uniqueColors[0].colorName
          }
          if (uniqueColors.length > 0 && !sizes[p.id]) {
            const available = getAvailableSizes(p, uniqueColors[0].colorName)
            if (available.length > 0) sizes[p.id] = available[0]
          }
        }
        setSelectedColors(colors)
        setSelectedSizes(sizes)
      })
      .catch(() => {
        toast({ title: 'Failed to load products', variant: 'destructive' })
      })
      .finally(() => setProductsLoading(false))
  }, [])

  // Persist cart
  useEffect(() => {
    saveCart(cart)
  }, [cart])

  // Check for payment callback in hash
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('status=success') && hash.includes('order=')) {
      const match = hash.match(/order=([^&]+)/)
      if (match) {
        setOrderNumber(match[1])
        setCheckoutStep('success')
        setCart([])
        toast({ title: 'Order confirmed! Thank you for your purchase.' })
      }
    }
  }, [])

  // ─── Cart Actions ────────────────────────────────────────────────
  const addToCart = useCallback((product: Product) => {
    const colorName = selectedColors[product.id]
    const size = selectedSizes[product.id]
    if (!colorName || !size) {
      toast({ title: 'Please select a color and size', variant: 'destructive' })
      return
    }

    const variant = findVariant(product, colorName, size)
    if (!variant) {
      toast({ title: 'This combination is not available', variant: 'destructive' })
      return
    }
    if (variant.stock <= 0) {
      toast({ title: 'Out of stock', variant: 'destructive' })
      return
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(
        ci => ci.variantId === variant.id
      )
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        }
        return updated
      }
      return [...prev, {
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        variantName: variant.name,
        colorName: variant.colorName,
        size: variant.size,
        unitPrice: variant.price,
        quantity: 1,
        image: variant.image || product.primaryImage || null,
      }]
    })
    toast({
      title: 'Added to cart',
      description: `${product.name} (${colorName}, ${size})`,
    })
  }, [selectedColors, selectedSizes, toast])

  const updateQuantity = useCallback((variantId: string, delta: number) => {
    setCart(prev => {
      const idx = prev.findIndex(ci => ci.variantId === variantId)
      if (idx < 0) return prev
      const newQty = prev[idx].quantity + delta
      if (newQty <= 0) return prev.filter(ci => ci.variantId !== variantId)
      const updated = [...prev]
      updated[idx] = { ...updated[idx], quantity: newQty }
      return updated
    })
  }, [])

  const removeFromCart = useCallback((variantId: string) => {
    setCart(prev => prev.filter(ci => ci.variantId !== variantId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  // ─── Computed Values ─────────────────────────────────────────────
  const cartItemCount = cart.reduce((sum, ci) => sum + ci.quantity, 0)
  const cartSubtotal = cart.reduce((sum, ci) => sum + ci.unitPrice * ci.quantity, 0)

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))]

  const filteredProducts = products.filter(p => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
    }
    return true
  })

  const selectedPaymentOption = paymentOptions.find(p => p.id === paymentProvider)

  // ─── Checkout Handlers ───────────────────────────────────────────
  const validateStep = (step: CheckoutStep): boolean => {
    if (step === 1) {
      if (cart.length === 0) {
        toast({ title: 'Your cart is empty', variant: 'destructive' })
        return false
      }
      return true
    }
    if (step === 2) {
      if (!deliveryInfo.name.trim()) {
        toast({ title: 'Please enter your name', variant: 'destructive' })
        return false
      }
      if (!deliveryInfo.phone.trim()) {
        toast({ title: 'Please enter your phone number', variant: 'destructive' })
        return false
      }
      if (paymentProvider !== 'manual' && !deliveryInfo.email.trim()) {
        toast({ title: 'Email is required for online payment', variant: 'destructive' })
        return false
      }
      return true
    }
    return true
  }

  const goToStep = (target: CheckoutStep) => {
    if (target > checkoutStep) {
      // Validate all steps up to target
      for (let s = checkoutStep; s < target; s++) {
        if (!validateStep(s as CheckoutStep)) return
      }
    }
    setCheckoutStep(target)
  }

  const handlePlaceOrder = async () => {
    if (!validateStep(3)) return
    setOrderLoading(true)

    try {
      // 1. Create order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: deliveryInfo.name,
          customerEmail: deliveryInfo.email || null,
          customerPhone: deliveryInfo.phone,
          deliveryAddress: deliveryInfo.address || null,
          deliveryCity: deliveryInfo.city || null,
          deliveryRegion: deliveryInfo.region || null,
          items: cart.map(ci => ({
            productId: ci.productId,
            productVariantId: ci.variantId,
            productName: ci.productName,
            variantName: ci.variantName,
            unitPrice: ci.unitPrice,
            quantity: ci.quantity,
          })),
          paymentProvider: paymentProvider === 'manual' ? null : paymentProvider,
        }),
      })

      const order = await orderRes.json()
      if (!orderRes.ok) throw new Error(order.error || 'Failed to create order')

      const newOrderNumber = order.orderNumber
      setOrderNumber(newOrderNumber)

      // Manual/cash on delivery — done
      if (paymentProvider === 'manual') {
        setCart([])
        setCheckoutStep('success')
        toast({
          title: 'Order placed successfully!',
          description: `Order ${newOrderNumber} — Pay on delivery.`,
        })
        setOrderLoading(false)
        return
      }

      // Paystack
      if (paymentProvider === 'paystack') {
        const payRes = await fetch('/api/shop/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'initialize',
            provider: 'paystack',
            orderId: order.id,
            amount: cartSubtotal,
            email: deliveryInfo.email,
          }),
        })
        const payData = await payRes.json()
        if (payData.success && payData.authorization_url) {
          window.open(payData.authorization_url, '_blank', 'noopener,noreferrer')
          setCart([])
          setCheckoutStep('success')
          toast({
            title: 'Payment page opened!',
            description: `Complete payment for order ${newOrderNumber} in the new tab.`,
          })
        } else {
          throw new Error(payData.error || 'Failed to initialize Paystack')
        }
        setOrderLoading(false)
        return
      }

      // Hubtel
      if (paymentProvider === 'hubtel') {
        const payRes = await fetch('/api/shop/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'initialize',
            provider: 'hubtel',
            orderId: order.id,
            amount: cartSubtotal,
            email: deliveryInfo.email,
            phone: deliveryInfo.phone,
          }),
        })
        const payData = await payRes.json()
        if (payData.success && payData.checkout_url) {
          window.open(payData.checkout_url, '_blank', 'noopener,noreferrer')
          setCart([])
          setCheckoutStep('success')
          toast({
            title: 'Payment page opened!',
            description: `Complete payment for order ${newOrderNumber} in the new tab.`,
          })
        } else {
          throw new Error(payData.error || 'Failed to initialize Hubtel')
        }
        setOrderLoading(false)
        return
      }
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setOrderLoading(false)
    }
  }

  const resetCheckout = () => {
    setCheckoutStep(1)
    setDeliveryInfo({ name: '', phone: '', email: '', address: '', city: '', region: '' })
    setPaymentProvider('paystack')
    setOrderNumber('')
    setCartOpen(false)
  }

  const continueShopping = () => {
    resetCheckout()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ─── Render: Success Screen ──────────────────────────────────────
  if (checkoutStep === 'success') {
    return (
      <motion.div variants={container} initial="hidden" animate="show">
        <section className="py-32 px-4">
          <div className="max-w-lg mx-auto text-center">
            <motion.div variants={item} className="w-20 h-20 rounded-full bg-smgh-green/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-smgh-green" />
            </motion.div>
            <motion.h1 variants={item} className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Order Placed!
            </motion.h1>
            <motion.p variants={item} className="text-gray-600 mb-2">
              Your order has been submitted successfully.
            </motion.p>
            {orderNumber && (
              <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-smgh-green/10 text-smgh-green font-mono text-sm mb-4">
                <Package className="w-4 h-4" />
                {orderNumber}
              </motion.div>
            )}
            <motion.p variants={item} className="text-gray-500 text-sm mb-8">
              {paymentProvider === 'manual'
                ? 'You will pay cash when your order is delivered. Our team will contact you to confirm the delivery details.'
                : paymentProvider === 'paystack'
                ? 'Please complete your payment in the Paystack tab that was opened. Your order will be confirmed automatically.'
                : 'Please complete your payment in the Hubtel tab that was opened. Your order will be confirmed automatically.'}
            </motion.p>
            <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={continueShopping} className="bg-smgh-green hover:bg-smgh-green-dark text-white rounded-full px-8">
                Continue Shopping
              </Button>
            </motion.div>
          </div>
        </section>
      </motion.div>
    )
  }

  // ─── Render: Main Page ───────────────────────────────────────────
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* ── Hero Section ────────────────────────────────────────── */}
      <section className="relative bg-smgh-dark py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-smgh-green-dark/40 via-smgh-dark to-smgh-red-dark/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(220,38,38,0.1),transparent_50%)]" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/70 text-sm mb-6 backdrop-blur-sm border border-white/5">
            <ShoppingBag className="w-4 h-4 text-smgh-green" />
            Official Merchandise
          </motion.div>
          <motion.h1 variants={item} className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            SMGH <span className="text-gradient-green">Merchandise</span> Store
          </motion.h1>
          <motion.p variants={item} className="text-white/70 text-lg max-w-2xl mx-auto mb-8">
            Support our mission by wearing the SMGH brand. Every purchase helps widows, single mothers, and the less privileged across Ghana.
          </motion.p>

          {/* Cart Count Pill */}
          {cartItemCount > 0 && (
            <motion.div variants={item}>
              <button
                onClick={() => { setCartOpen(true); setCheckoutStep(1) }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-smgh-green text-white font-semibold shadow-lg shadow-smgh-green/25 hover:bg-smgh-green-dark transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in cart — ₵{cartSubtotal.toLocaleString()}
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Toolbar: Search + Filters ────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search merchandise..."
                className="border-gray-200 focus:border-smgh-green pl-10 rounded-full h-10"
              />
            </div>
            {/* Category filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-smgh-green text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'all' ? 'All Items' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
            {/* Cart toggle (mobile) */}
            <Button
              onClick={() => { setCartOpen(true); setCheckoutStep(1) }}
              className="relative bg-smgh-green hover:bg-smgh-green-dark text-white rounded-full sm:hidden"
              size="icon"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-smgh-red text-white text-[10px] font-bold flex items-center justify-center">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* ── Product Grid ─────────────────────────────────────────── */}
      <section className="py-10 px-4">
        <div className="max-w-6xl mx-auto">
          {productsLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl overflow-hidden">
                  <div className="aspect-square animate-pulse bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                    <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div variants={item} className="text-center py-20">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400">No merchandise found</h3>
              <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => {
                const uniqueColors = getUniqueColors(product)
                const currentColor = selectedColors[product.id] || (uniqueColors[0]?.colorName || '')
                const currentSize = selectedSizes[product.id] || ''
                const availableSizes = getAvailableSizes(product, currentColor)
                const currentVariant = findVariant(product, currentColor, currentSize)

                return (
                  <motion.div
                    key={product.id}
                    variants={item}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={currentVariant?.image || product.primaryImage || `https://picsum.photos/seed/${product.slug}/600/600`}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Event badge */}
                      {product.event && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-smgh-red text-white border-0 text-[10px] px-2 py-0.5">
                            <Tag className="w-3 h-3 mr-1" />
                            {product.event.title}
                          </Badge>
                        </div>
                      )}
                      {/* Stock badge */}
                      {currentVariant && currentVariant.stock <= 3 && currentVariant.stock > 0 && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-amber-500 text-white border-0 text-[10px] px-2 py-0.5">
                            Only {currentVariant.stock} left
                          </Badge>
                        </div>
                      )}
                      {currentVariant && currentVariant.stock === 0 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Badge className="bg-gray-800 text-white border-0 text-sm px-3 py-1">
                            Out of Stock
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">{product.name}</h3>
                      {product.description && (
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{product.description}</p>
                      )}

                      {/* Price */}
                      <div className="mt-3 mb-4">
                        <span className="text-xl font-bold text-smgh-green">
                          ₵{currentVariant ? currentVariant.price.toLocaleString() : product.basePrice.toLocaleString()}
                        </span>
                      </div>

                      {/* Color Swatches */}
                      {uniqueColors.length > 1 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-500 mb-2">Color: {currentColor}</p>
                          <div className="flex items-center gap-2">
                            {uniqueColors.map(c => (
                              <button
                                key={c.colorName}
                                onClick={() => {
                                  setSelectedColors(prev => ({ ...prev, [product.id]: c.colorName }))
                                  // Reset size to first available for new color
                                  const sizes = getAvailableSizes(product, c.colorName)
                                  setSelectedSizes(prev => ({ ...prev, [product.id]: sizes[0] || '' }))
                                }}
                                className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                                  currentColor === c.colorName
                                    ? 'border-smgh-green scale-110 shadow-md'
                                    : 'border-gray-200 hover:border-gray-400'
                                }`}
                                title={c.colorName}
                              >
                                <span
                                  className="w-5 h-5 rounded-full"
                                  style={{ backgroundColor: c.color }}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Size Selector */}
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">Size</p>
                        <div className="flex flex-wrap gap-1.5">
                          {SIZES.map(size => {
                            const isAvailable = availableSizes.includes(size)
                            const isSelected = currentSize === size
                            return (
                              <button
                                key={size}
                                disabled={!isAvailable}
                                onClick={() => setSelectedSizes(prev => ({ ...prev, [product.id]: size }))}
                                className={`min-w-[36px] h-8 px-2 rounded-lg text-xs font-semibold transition-all ${
                                  isSelected
                                    ? 'bg-smgh-green text-white shadow-sm'
                                    : isAvailable
                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    : 'bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                                }`}
                              >
                                {size}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Add to Cart */}
                      <div className="mt-auto pt-2">
                        <Button
                          onClick={() => addToCart(product)}
                          disabled={!currentVariant || currentVariant.stock === 0}
                          className="w-full bg-smgh-green hover:bg-smgh-green-dark text-white py-5 rounded-xl font-semibold transition-all shadow-lg shadow-smgh-green/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Floating Cart Button (Desktop) ──────────────────────── */}
      {cartItemCount > 0 && !cartOpen && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="hidden sm:flex fixed bottom-6 right-6 z-40"
        >
          <button
            onClick={() => { setCartOpen(true); setCheckoutStep(1) }}
            className="relative w-14 h-14 rounded-full bg-smgh-green text-white shadow-xl shadow-smgh-green/30 flex items-center justify-center hover:bg-smgh-green-dark transition-colors"
          >
            <ShoppingBag className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-smgh-red text-white text-[11px] font-bold flex items-center justify-center">
              {cartItemCount}
            </span>
          </button>
        </motion.div>
      )}

      {/* ── Cart / Checkout Slide Panel ─────────────────────────── */}
      <AnimatePresence>
        {cartOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
              onClick={() => setCartOpen(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[440px] bg-white z-50 shadow-2xl flex flex-col"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {checkoutStep === 'success' ? null : checkoutStep > 1 && (
                    <button
                      onClick={() => setCheckoutStep((checkoutStep - 1) as CheckoutStep)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                  <h2 className="text-lg font-bold text-gray-900">
                    {checkoutStep === 1 && 'Shopping Cart'}
                    {checkoutStep === 2 && 'Delivery Details'}
                    {checkoutStep === 3 && 'Payment'}
                  </h2>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Progress Steps (inside panel) */}
              {checkoutStep !== 'success' && (
                <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    {([
                      { num: 1, label: 'Cart' },
                      { num: 2, label: 'Delivery' },
                      { num: 3, label: 'Payment' },
                    ] as const).map((s, i) => (
                      <div key={s.num} className="flex items-center gap-2 flex-1">
                        <button
                          onClick={() => {
                            if (s.num < checkoutStep) {
                              setCheckoutStep(s.num as CheckoutStep)
                            }
                          }}
                          className={`flex items-center gap-1.5 ${s.num < checkoutStep ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                            checkoutStep >= s.num
                              ? 'bg-smgh-green text-white'
                              : 'bg-gray-200 text-gray-400'
                          }`}>
                            {checkoutStep > s.num ? <CheckCircle className="w-3.5 h-3.5" /> : s.num}
                          </div>
                          <span className={`text-xs font-medium ${checkoutStep >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>
                            {s.label}
                          </span>
                        </button>
                        {i < 2 && <div className={`flex-1 h-px ${checkoutStep > s.num ? 'bg-smgh-green' : 'bg-gray-200'}`} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {/* ── Step 1: Cart Review ──────────────────────── */}
                  {checkoutStep === 1 && (
                    <motion.div
                      key="cart-step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="p-5"
                    >
                      {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <ShoppingBag className="w-8 h-8 text-gray-300" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-400">Your cart is empty</h3>
                          <p className="text-gray-400 text-sm mt-1">Browse our merchandise and add items to your cart</p>
                          <Button
                            onClick={() => setCartOpen(false)}
                            className="mt-4 bg-smgh-green hover:bg-smgh-green-dark text-white rounded-full"
                          >
                            Browse Store
                          </Button>
                        </div>
                      ) : (
                        <>
                          {/* Cart Items */}
                          <div className="space-y-4 mb-6">
                            {cart.map(ci => (
                              <div
                                key={ci.variantId}
                                className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
                              >
                                {/* Thumbnail */}
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                  <img
                                    src={ci.image || `https://picsum.photos/seed/${ci.variantId}/128/128`}
                                    alt={ci.productName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <h4 className="font-semibold text-gray-900 text-sm truncate">{ci.productName}</h4>
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        {ci.colorName} / {ci.size}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => removeFromCart(ci.variantId)}
                                      className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center flex-shrink-0 transition-colors group"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-500" />
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-between mt-2">
                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-0.5">
                                      <button
                                        onClick={() => updateQuantity(ci.variantId, -1)}
                                        className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors"
                                      >
                                        <Minus className="w-3 h-3 text-gray-600" />
                                      </button>
                                      <span className="w-6 text-center text-sm font-semibold text-gray-900">{ci.quantity}</span>
                                      <button
                                        onClick={() => updateQuantity(ci.variantId, 1)}
                                        className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors"
                                      >
                                        <Plus className="w-3 h-3 text-gray-600" />
                                      </button>
                                    </div>
                                    <span className="font-semibold text-sm text-gray-900">
                                      ₵{(ci.unitPrice * ci.quantity).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Clear Cart */}
                          <button
                            onClick={clearCart}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors mb-4 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Clear all items
                          </button>

                          {/* Subtotal */}
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-500">Items ({cartItemCount})</span>
                              <span className="text-sm font-medium text-gray-900">₵{cartSubtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-500">Delivery</span>
                              <span className="text-sm font-medium text-smgh-green">Calculated next</span>
                            </div>
                            <div className="border-t border-gray-200 pt-2 mt-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-900">Subtotal</span>
                                <span className="text-lg font-bold text-smgh-green">
                                  ₵{cartSubtotal.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}

                  {/* ── Step 2: Delivery Details ─────────────────── */}
                  {checkoutStep === 2 && (
                    <motion.div
                      key="cart-step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="p-5"
                    >
                      <h3 className="font-bold text-gray-900 mb-1">Delivery Information</h3>
                      <p className="text-gray-500 text-sm mb-6">Where should we deliver your order?</p>

                      <div className="space-y-4">
                        {/* Name */}
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                            Full Name <span className="text-smgh-red">*</span>
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              value={deliveryInfo.name}
                              onChange={e => setDeliveryInfo(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter your full name"
                              className="border-gray-200 focus:border-smgh-green pl-10 rounded-xl"
                            />
                          </div>
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                            Phone Number <span className="text-smgh-red">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              value={deliveryInfo.phone}
                              onChange={e => setDeliveryInfo(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="+233 XX XXX XXXX"
                              className="border-gray-200 focus:border-smgh-green pl-10 rounded-xl"
                            />
                          </div>
                        </div>

                        {/* Email */}
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                            Email Address {paymentProvider !== 'manual' && <span className="text-smgh-red">*</span>}
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              type="email"
                              value={deliveryInfo.email}
                              onChange={e => setDeliveryInfo(prev => ({ ...prev, email: e.target.value }))}
                              placeholder={paymentProvider !== 'manual' ? 'your@email.com (required)' : 'your@email.com (optional)'}
                              className="border-gray-200 focus:border-smgh-green pl-10 rounded-xl"
                            />
                          </div>
                        </div>

                        {/* Address */}
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Delivery Address</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <textarea
                              value={deliveryInfo.address}
                              onChange={e => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))}
                              placeholder="House number, street name, landmark..."
                              rows={2}
                              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-smgh-green focus:outline-none focus:ring-1 focus:ring-smgh-green resize-none text-sm"
                            />
                          </div>
                        </div>

                        {/* City */}
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1.5 block">City</label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              value={deliveryInfo.city}
                              onChange={e => setDeliveryInfo(prev => ({ ...prev, city: e.target.value }))}
                              placeholder="e.g. Accra, Kumasi, Tamale"
                              className="border-gray-200 focus:border-smgh-green pl-10 rounded-xl"
                            />
                          </div>
                        </div>

                        {/* Region */}
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Region</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                              value={deliveryInfo.region}
                              onChange={e => setDeliveryInfo(prev => ({ ...prev, region: e.target.value }))}
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-smgh-green focus:outline-none focus:ring-1 focus:ring-smgh-green text-sm appearance-none bg-white"
                            >
                              <option value="">Select region</option>
                              {GHANA_REGIONS.map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 3: Payment ──────────────────────────── */}
                  {checkoutStep === 3 && (
                    <motion.div
                      key="cart-step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="p-5"
                    >
                      <h3 className="font-bold text-gray-900 mb-1">Choose Payment Method</h3>
                      <p className="text-gray-500 text-sm mb-6">Select how you would like to pay</p>

                      {/* Payment Options */}
                      <div className="space-y-2 mb-6">
                        {paymentOptions.map(pm => (
                          <button
                            key={pm.id}
                            onClick={() => setPaymentProvider(pm.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                              paymentProvider === pm.id
                                ? `${pm.bgColor} ${pm.color} shadow-sm`
                                : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              paymentProvider === pm.id ? 'bg-white shadow-sm' : 'bg-gray-100'
                            }`}>
                              <pm.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">{pm.name}</p>
                              <p className="text-xs opacity-70">{pm.desc}</p>
                            </div>
                            {paymentProvider === pm.id && (
                              <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Order Summary */}
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3 mb-6">
                        <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                          <Package className="w-4 h-4 text-smgh-green" />
                          Order Summary
                        </h4>
                        <div className="space-y-2">
                          {cart.map(ci => (
                            <div key={ci.variantId} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                                  <img
                                    src={ci.image || `https://picsum.photos/seed/${ci.variantId}/64/64`}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-gray-900 font-medium truncate">{ci.productName}</p>
                                  <p className="text-gray-400 text-xs">{ci.colorName} / {ci.size} x{ci.quantity}</p>
                                </div>
                              </div>
                              <span className="font-medium text-gray-900 flex-shrink-0 ml-2">
                                ₵{(ci.unitPrice * ci.quantity).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900">Total</span>
                            <span className="text-xl font-bold text-smgh-green">
                              ₵{cartSubtotal.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Summary */}
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
                        <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-3">
                          <Truck className="w-4 h-4 text-smgh-green" />
                          Delivery Details
                        </h4>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                          <div>
                            <span className="text-gray-400 text-xs block">Name</span>
                            <span className="font-medium text-gray-900">{deliveryInfo.name}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs block">Phone</span>
                            <span className="font-medium text-gray-900">{deliveryInfo.phone}</span>
                          </div>
                          {deliveryInfo.email && (
                            <div className="col-span-2">
                              <span className="text-gray-400 text-xs block">Email</span>
                              <span className="font-medium text-gray-900">{deliveryInfo.email}</span>
                            </div>
                          )}
                          {deliveryInfo.address && (
                            <div className="col-span-2">
                              <span className="text-gray-400 text-xs block">Address</span>
                              <span className="font-medium text-gray-900">{deliveryInfo.address}</span>
                            </div>
                          )}
                          {(deliveryInfo.city || deliveryInfo.region) && (
                            <div className="col-span-2">
                              <span className="text-gray-400 text-xs block">Location</span>
                              <span className="font-medium text-gray-900">
                                {[deliveryInfo.city, deliveryInfo.region].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Available Methods Detail */}
                      {selectedPaymentOption && (
                        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Available methods
                          </p>
                          <div className="space-y-1.5">
                            {selectedPaymentOption.methods.map(method => (
                              <div key={method} className="flex items-center gap-2 text-sm text-gray-700">
                                <div className="w-1.5 h-1.5 rounded-full bg-smgh-green flex-shrink-0" />
                                {method}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Panel Footer */}
              {checkoutStep !== 'success' && (
                <div className="border-t border-gray-100 p-5 bg-white">
                  {checkoutStep === 1 && cart.length > 0 && (
                    <Button
                      onClick={() => goToStep(2)}
                      className="w-full bg-smgh-green hover:bg-smgh-green-dark text-white py-5 rounded-xl font-semibold shadow-lg shadow-smgh-green/25"
                    >
                      Proceed to Delivery
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                  {checkoutStep === 2 && (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setCheckoutStep(1)}
                        className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-5"
                      >
                        Back to Cart
                      </Button>
                      <Button
                        onClick={() => goToStep(3)}
                        className="flex-1 bg-smgh-green hover:bg-smgh-green-dark text-white py-5 rounded-xl font-semibold"
                      >
                        Continue to Payment
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                  {checkoutStep === 3 && (
                    <Button
                      onClick={handlePlaceOrder}
                      disabled={orderLoading}
                      className="w-full bg-smgh-red hover:bg-smgh-red-dark text-white py-5 rounded-xl font-semibold shadow-lg shadow-smgh-red/25 disabled:opacity-50"
                    >
                      {orderLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          {paymentProvider === 'manual'
                            ? 'Place Order (Cash on Delivery)'
                            : `Pay ₵${cartSubtotal.toLocaleString()}`}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
