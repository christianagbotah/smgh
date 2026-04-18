'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from '@/lib/router'
import {
  Package, Truck, Search, Phone, Hash, ArrowLeft, MapPin, CreditCard,
  CheckCircle2, Circle, Clock, Loader2, AlertCircle, Store, Copy,
  ChevronRight, PackageCheck, ClipboardList, TruckIcon, BadgeCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

// ─── TypeScript Interfaces ──────────────────────────────────────────────────

interface OrderItem {
  id: string
  productName: string
  variantName?: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail?: string | null
  customerPhone: string
  deliveryAddress?: string | null
  deliveryCity?: string | null
  deliveryRegion?: string | null
  status: string
  paymentProvider?: string | null
  paymentStatus: string
  paymentRef?: string | null
  totalAmount: number
  currency: string
  trackingNumber?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

type SearchState = 'idle' | 'loading' | 'found' | 'not_found' | 'multiple'

// ─── Animation Variants ─────────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

// ─── Status Configuration ───────────────────────────────────────────────────

const STATUS_STEPS = [
  { key: 'pending', label: 'Pending', icon: Clock, description: 'Order received' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2, description: 'Order verified' },
  { key: 'processing', label: 'Processing', icon: ClipboardList, description: 'Preparing items' },
  { key: 'shipped', label: 'Shipped', icon: Truck, description: 'On the way' },
  { key: 'delivered', label: 'Delivered', icon: PackageCheck, description: 'Order complete' },
] as const

const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const

type StatusKey = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

const STATUS_COLORS: Record<StatusKey, { bg: string; text: string; border: string; dot: string; line: string }> = {
  pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    line: 'bg-amber-300',
  },
  confirmed: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    line: 'bg-blue-300',
  },
  processing: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
    line: 'bg-purple-300',
  },
  shipped: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
    line: 'bg-indigo-300',
  },
  delivered: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    dot: 'bg-green-500',
    line: 'bg-green-300',
  },
  cancelled: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
    line: 'bg-red-300',
  },
}

// ─── Helper Functions ───────────────────────────────────────────────────────

function getStatusConfig(status: string) {
  const key = status as StatusKey
  return STATUS_COLORS[key] || STATUS_COLORS.pending
}

function getStepState(currentStatus: string, stepKey: string): 'completed' | 'active' | 'upcoming' {
  if (currentStatus === 'cancelled') return 'upcoming'
  const currentIndex = STATUS_FLOW.indexOf(currentStatus as any)
  const stepIndex = STATUS_FLOW.indexOf(stepKey as any)
  if (stepIndex < currentIndex) return 'completed'
  if (stepIndex === currentIndex) return 'active'
  return 'upcoming'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatCurrency(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatStatusBadge(status: string) {
  const key = status as StatusKey
  const config = STATUS_COLORS[key] || STATUS_COLORS.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6 animate-pulse">
      {/* Order Summary Skeleton */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="h-6 bg-gray-200 rounded-lg w-48" />
        <div className="h-4 bg-gray-100 rounded w-36" />
        <div className="flex gap-4">
          <div className="h-4 bg-gray-100 rounded w-24" />
          <div className="h-4 bg-gray-100 rounded w-32" />
        </div>
      </div>

      {/* Timeline Skeleton */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="h-6 bg-gray-200 rounded-lg w-40" />
        <div className="flex items-center gap-0 justify-between px-2">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="h-3 bg-gray-100 rounded w-16" />
            </div>
          ))}
        </div>
        <div className="h-2 bg-gray-100 rounded w-full mt-2" />
      </div>

      {/* Items Skeleton */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="h-6 bg-gray-200 rounded-lg w-32" />
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 rounded-lg bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-40" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
            <div className="h-4 bg-gray-100 rounded w-20 text-right" />
          </div>
        ))}
      </div>

      {/* Info Cards Skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        {[0, 1].map(i => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Status Timeline Component ─────────────────────────────────────────────

function StatusTimeline({ order }: { order: Order }) {
  const isCancelled = order.status === 'cancelled'

  return (
    <motion.div variants={item}>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <BadgeCheck className="w-5 h-5 text-smgh-green" />
          Order Progress
        </h3>

        {isCancelled ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-lg font-bold text-red-700">Order Cancelled</p>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">
              This order has been cancelled. If you have questions, please contact our support team.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Timeline */}
            <div className="hidden md:block">
              <div className="relative flex items-start justify-between">
                {/* Connecting line background */}
                <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-gray-200" />

                {STATUS_STEPS.map((step, idx) => {
                  const state = getStepState(order.status, step.key)
                  const isLast = idx === STATUS_STEPS.length - 1
                  const Icon = step.icon

                  return (
                    <div key={step.key} className="relative flex flex-col items-center z-10 flex-1">
                      {/* Connecting line colored overlay */}
                      {state === 'completed' && !isLast && (
                        <div className="absolute top-5 left-1/2 w-[calc(100%)] h-0.5 bg-smgh-green" />
                      )}

                      {/* Step circle */}
                      <motion.div
                        initial={false}
                        animate={{
                          scale: state === 'active' ? [1, 1.15, 1] : 1,
                        }}
                        transition={{
                          duration: 2,
                          repeat: state === 'active' ? Infinity : 0,
                          ease: 'easeInOut',
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                          state === 'completed'
                            ? 'bg-smgh-green border-smgh-green text-white'
                            : state === 'active'
                              ? 'bg-smgh-green/10 border-smgh-green text-smgh-green'
                              : 'bg-white border-gray-300 text-gray-400'
                        }`}
                      >
                        {state === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </motion.div>

                      {/* Step label */}
                      <p className={`mt-2 text-xs font-semibold ${state === 'upcoming' ? 'text-gray-400' : 'text-gray-900'}`}>
                        {step.label}
                      </p>
                      <p className={`text-[10px] ${state === 'upcoming' ? 'text-gray-300' : 'text-gray-500'}`}>
                        {step.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Mobile Timeline */}
            <div className="md:hidden space-y-0">
              {STATUS_STEPS.map((step, idx) => {
                const state = getStepState(order.status, step.key)
                const isLast = idx === STATUS_STEPS.length - 1
                const Icon = step.icon

                return (
                  <div key={step.key} className="flex gap-4">
                    {/* Left rail */}
                    <div className="flex flex-col items-center">
                      <motion.div
                        initial={false}
                        animate={{
                          scale: state === 'active' ? [1, 1.15, 1] : 1,
                        }}
                        transition={{
                          duration: 2,
                          repeat: state === 'active' ? Infinity : 0,
                          ease: 'easeInOut',
                        }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-colors ${
                          state === 'completed'
                            ? 'bg-smgh-green border-smgh-green text-white'
                            : state === 'active'
                              ? 'bg-smgh-green/10 border-smgh-green text-smgh-green'
                              : 'bg-white border-gray-300 text-gray-400'
                        }`}
                      >
                        {state === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </motion.div>
                      {!isLast && (
                        <div className={`w-0.5 h-12 flex-shrink-0 ${state === 'completed' ? 'bg-smgh-green' : 'bg-gray-200'}`} />
                      )}
                    </div>

                    {/* Right content */}
                    <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                      <p className={`text-sm font-semibold ${state === 'upcoming' ? 'text-gray-400' : 'text-gray-900'}`}>
                        {step.label}
                      </p>
                      <p className={`text-xs ${state === 'upcoming' ? 'text-gray-300' : 'text-gray-500'}`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}

// ─── Order Items Component ──────────────────────────────────────────────────

function OrderItemsList({ items, currency }: { items: OrderItem[]; currency: string }) {
  return (
    <motion.div variants={item}>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-smgh-green" />
          Order Items ({items.length})
        </h3>
        <div className="divide-y divide-gray-100">
          {items.map((orderItem) => (
            <div
              key={orderItem.id}
              className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
            >
              {/* Product icon placeholder */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-smgh-green/10 to-smgh-green/5 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-smgh-green" />
              </div>

              {/* Product info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {orderItem.productName}
                </p>
                {orderItem.variantName && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {orderItem.variantName}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  Qty: {orderItem.quantity} &times; {formatCurrency(orderItem.unitPrice, currency)}
                </p>
              </div>

              {/* Price */}
              <p className="font-bold text-gray-900 text-sm flex-shrink-0">
                {formatCurrency(orderItem.totalPrice, currency)}
              </p>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
          <span className="font-semibold text-gray-700">Total</span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(items.reduce((sum, i) => sum + i.totalPrice, 0), currency)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function OrderTrackingPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [searchState, setSearchState] = useState<SearchState>('idle')
  const [order, setOrder] = useState<Order | null>(null)
  const [multipleOrders, setMultipleOrders] = useState<Order[]>([])
  const { toast } = useToast()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!orderNumber.trim() && !phoneNumber.trim()) {
      toast({
        title: 'Please provide search details',
        description: 'Enter an order number or phone number to track your order.',
        variant: 'destructive',
      })
      return
    }

    setSearchState('loading')
    setOrder(null)
    setMultipleOrders([])

    // Scroll to results after a brief delay for loading animation
    setTimeout(() => {
      document.getElementById('track-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 600)

    try {
      let url = '/api/orders?'
      if (orderNumber.trim()) {
        url += `orderNumber=${encodeURIComponent(orderNumber.trim())}`
      } else {
        url += `phone=${encodeURIComponent(phoneNumber.trim())}`
      }

      const res = await fetch(url)
      if (!res.ok) {
        setSearchState('not_found')
        return
      }

      const data = await res.json()

      // Single order result
      if (!Array.isArray(data)) {
        setOrder(data)
        setSearchState('found')
        return
      }

      // Array result — from phone search
      if (Array.isArray(data) && data.length === 0) {
        setSearchState('not_found')
        return
      }

      if (Array.isArray(data) && data.length === 1) {
        setOrder(data[0])
        setSearchState('found')
        return
      }

      // Multiple orders found
      setMultipleOrders(data)
      setSearchState('multiple')
    } catch {
      toast({
        title: 'Something went wrong',
        description: 'Unable to search for your order. Please try again later.',
        variant: 'destructive',
      })
      setSearchState('idle')
    }
  }

  const handleSelectOrder = (selectedOrder: Order) => {
    setOrder(selectedOrder)
    setMultipleOrders([])
    setSearchState('found')
    setOrderNumber(selectedOrder.orderNumber)
  }

  const handleReset = () => {
    setSearchState('idle')
    setOrder(null)
    setMultipleOrders([])
    document.getElementById('track-search')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleCopyTracking = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber).then(() => {
      toast({ title: 'Copied!', description: 'Tracking number copied to clipboard.' })
    }).catch(() => {
      toast({ title: 'Copy failed', description: 'Could not copy to clipboard.', variant: 'destructive' })
    })
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* ─── HERO SECTION ─── */}
      <section className="relative bg-smgh-dark py-20 md:py-28 overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-smgh-green-dark/40 via-smgh-dark to-smgh-red-dark/20" />

        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-smgh-green/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-smgh-red/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/5 rounded-full" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div variants={item} className="mb-6">
            <div className="w-20 h-20 rounded-2xl bg-smgh-green/20 border border-smgh-green/30 flex items-center justify-center mx-auto">
              <Truck className="w-10 h-10 text-smgh-green" />
            </div>
          </motion.div>

          <motion.h1
            variants={item}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
          >
            Track Your <span className="text-smgh-green">Order</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="text-gray-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed"
          >
            Enter your order number or the phone number used during purchase to track your Sweet Mothers Ghana merchandise order in real-time.
          </motion.p>
        </div>
      </section>

      {/* ─── SEARCH SECTION ─── */}
      <section id="track-search" className="py-12 md:py-16 px-4">
        <div className="max-w-lg mx-auto">
          <motion.div variants={item}>
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg shadow-black/5 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Find Your Order</h2>
              <p className="text-sm text-gray-500 mb-6">Search by order number or phone number</p>

              <form onSubmit={handleSearch} className="space-y-4">
                {/* Order Number */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" />
                    Order Number
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="Enter your order number"
                      className="border-gray-200 focus:border-smgh-green pl-10 h-11"
                      disabled={searchState === 'loading'}
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+233 XX XXX XXXX"
                      className="border-gray-200 focus:border-smgh-green pl-10 h-11"
                      disabled={searchState === 'loading'}
                    />
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={searchState === 'loading'}
                  className="w-full bg-smgh-green hover:bg-smgh-green-dark text-white h-11 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-smgh-green/20"
                >
                  {searchState === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Track Order
                    </>
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── RESULTS SECTION ─── */}
      <section id="track-results">
      <AnimatePresence mode="wait">
        {searchState === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-16"
          >
            <LoadingSkeleton />
          </motion.div>
        )}

        {searchState === 'not_found' && (
          <motion.div
            key="not-found"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pb-16"
          >
            <div className="max-w-md mx-auto px-4 text-center">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Order Not Found</h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  We couldn&apos;t find an order matching your search. Please double-check your order number or phone number and try again.
                </p>
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <Package className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600">
                      <strong>Order number</strong> should look like: SMGH-20250415-XXXX
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600">
                      <strong>Phone number</strong> should be the one used during checkout
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="mt-6 w-full rounded-xl border-gray-200 hover:bg-gray-50"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {searchState === 'multiple' && multipleOrders.length > 0 && (
          <motion.div
            key="multiple"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pb-16"
          >
            <div className="max-w-2xl mx-auto px-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Multiple Orders Found</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Select an order to view its details
                </p>
              </div>
              <div className="space-y-3">
                {multipleOrders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => handleSelectOrder(o)}
                    className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-smgh-green/30 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-gray-900 text-sm truncate">{o.orderNumber}</p>
                          {formatStatusBadge(o.status)}
                        </div>
                        <p className="text-xs text-gray-500">{formatDate(o.createdAt)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {o.items.length} item{o.items.length !== 1 ? 's' : ''} &bull; {formatCurrency(o.totalAmount, o.currency)}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-smgh-green transition-colors flex-shrink-0 ml-3" />
                    </div>
                  </button>
                ))}
              </div>
              <div className="text-center mt-6">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="rounded-xl border-gray-200 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  New Search
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {searchState === 'found' && order && (
          <motion.div
            key="found"
            variants={container}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            className="pb-16"
          >
            <div className="max-w-3xl mx-auto px-4 space-y-6">
              {/* Back button */}
              <motion.div variants={item}>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-smgh-green transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  New Search
                </button>
              </motion.div>

              {/* ─── ORDER SUMMARY CARD ─── */}
              <motion.div variants={item}>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-5 h-5 text-smgh-green" />
                        <h3 className="text-lg font-bold text-gray-900">Order Summary</h3>
                      </div>
                      <p className="text-sm text-gray-500">{order.orderNumber}</p>
                    </div>
                    {formatStatusBadge(order.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Date</p>
                      <p className="text-sm font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Total Amount</p>
                      <p className="text-sm font-bold text-smgh-green">{formatCurrency(order.totalAmount, order.currency)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 col-span-2 md:col-span-1">
                      <p className="text-xs text-gray-400 mb-0.5">Items</p>
                      <p className="text-sm font-semibold text-gray-900">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ─── STATUS TIMELINE ─── */}
              <StatusTimeline order={order} />

              {/* ─── ORDER ITEMS ─── */}
              <OrderItemsList items={order.items} currency={order.currency} />

              {/* ─── INFO GRID ─── */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Delivery Info */}
                <motion.div variants={item}>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
                    <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-smgh-green" />
                      Delivery Information
                    </h3>
                    {order.deliveryAddress || order.deliveryCity || order.deliveryRegion ? (
                      <div className="space-y-2.5">
                        {order.deliveryAddress && (
                          <div>
                            <p className="text-xs text-gray-400">Address</p>
                            <p className="text-sm text-gray-900">{order.deliveryAddress}</p>
                          </div>
                        )}
                        {order.deliveryCity && (
                          <div>
                            <p className="text-xs text-gray-400">City</p>
                            <p className="text-sm text-gray-900">{order.deliveryCity}</p>
                          </div>
                        )}
                        {order.deliveryRegion && (
                          <div>
                            <p className="text-xs text-gray-400">Region</p>
                            <p className="text-sm text-gray-900">{order.deliveryRegion}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No delivery address provided</p>
                    )}
                  </div>
                </motion.div>

                {/* Payment Info */}
                <motion.div variants={item}>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
                    <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-smgh-green" />
                      Payment Information
                    </h3>
                    <div className="space-y-2.5">
                      <div>
                        <p className="text-xs text-gray-400">Provider</p>
                        <p className="text-sm text-gray-900 capitalize">
                          {order.paymentProvider || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Status</p>
                        <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                          order.paymentStatus === 'paid'
                            ? 'text-green-700'
                            : order.paymentStatus === 'failed'
                              ? 'text-red-700'
                              : 'text-amber-700'
                        }`}>
                          <Circle className={`w-1.5 h-1.5 fill-current ${
                            order.paymentStatus === 'paid'
                              ? 'text-green-500'
                              : order.paymentStatus === 'failed'
                                ? 'text-red-500'
                                : 'text-amber-500'
                          }`} />
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </span>
                      </div>
                      {order.paymentRef && (
                        <div>
                          <p className="text-xs text-gray-400">Reference</p>
                          <p className="text-sm text-gray-900 font-mono">{order.paymentRef}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* ─── TRACKING NUMBER ─── */}
              {order.trackingNumber && (
                <motion.div variants={item}>
                  <div className="bg-gradient-to-r from-smgh-green/5 to-emerald-50 rounded-2xl p-6 border border-smgh-green/20">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-smgh-green/10 flex items-center justify-center flex-shrink-0">
                          <TruckIcon className="w-5 h-5 text-smgh-green" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Tracking Number</p>
                          <p className="text-base font-mono font-semibold text-smgh-green tracking-wide">
                            {order.trackingNumber}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyTracking(order.trackingNumber!)}
                        className="rounded-xl border-smgh-green/30 text-smgh-green hover:bg-smgh-green/10 self-start sm:self-auto"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ─── NOTES ─── */}
              {order.notes && (
                <motion.div variants={item}>
                  <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200/60">
                    <p className="text-xs text-amber-600 font-semibold mb-1">Order Notes</p>
                    <p className="text-sm text-amber-800 leading-relaxed">{order.notes}</p>
                  </div>
                </motion.div>
              )}

              {/* ─── BACK TO SHOP ─── */}
              <motion.div variants={item} className="text-center pt-2">
                <Link to="/">
                  <Button className="bg-smgh-green hover:bg-smgh-green-dark text-white px-8 py-6 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-smgh-green/20">
                    <Store className="w-4 h-4 mr-2" />
                    Back to Shop
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}

        {searchState === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-16"
          >
            <div className="max-w-md mx-auto px-4 text-center">
              <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl p-8 border border-gray-100">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to Track</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Enter your order number or phone number above to see your order status, delivery progress, and other details.
                </p>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">How it works</p>
                  <div className="space-y-3">
                    {[
                      { icon: Hash, text: 'Enter your order number', subtext: '(e.g., SMGH-20250415-XXXX)' },
                      { icon: Search, text: 'Click "Track Order" to search' },
                      { icon: PackageCheck, text: 'View your order status and details' },
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 rounded-lg bg-smgh-green/10 flex items-center justify-center flex-shrink-0">
                          <step.icon className="w-4 h-4 text-smgh-green" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">{step.text}</p>
                          {step.subtext && <p className="text-xs text-gray-400 mt-0.5">{step.subtext}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </section>
    </motion.div>
  )
}
