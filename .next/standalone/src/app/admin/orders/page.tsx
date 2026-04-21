'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Package, Search, ChevronDown, ChevronUp, Truck, CheckCircle, Clock, XCircle,
  AlertCircle, DollarSign, MapPin, Phone, Mail, StickyNote, Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { fetchJSON, fetchWrite, ensureArray } from '@/lib/fetch-helpers'
import PageLoadingOverlay from '@/components/admin/PageLoadingOverlay'

// ─── Types ──────────────────────────────────────────────────────────
interface OrderItem {
  id: string
  productName: string
  variantName: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string | null
  customerPhone: string
  deliveryAddress: string | null
  deliveryCity: string | null
  deliveryRegion: string | null
  status: string
  paymentProvider: string | null
  paymentStatus: string
  paymentRef: string | null
  totalAmount: number
  currency: string
  trackingNumber: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

// ─── Constants ──────────────────────────────────────────────────────
type StatusKey = 'all' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

const STATUS_TABS: { key: StatusKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
]

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof Clock }> = {
  pending: { color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', icon: Clock },
  confirmed: { color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', icon: CheckCircle },
  processing: { color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20', icon: AlertCircle },
  shipped: { color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20', icon: Truck },
  delivered: { color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20', icon: CheckCircle },
  cancelled: { color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', icon: XCircle },
}

const PAYMENT_STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  pending: { color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  paid: { color: 'text-green-400', bg: 'bg-green-400/10' },
  failed: { color: 'text-red-400', bg: 'bg-red-400/10' },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatCurrency(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Stat Card ──────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Package; label: string; value: string; color: string
}) {
  return (
    <div className="glass rounded-xl p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-white text-xl font-bold mt-0.5">{value}</p>
      </div>
    </div>
  )
}

// ─── Order Detail Panel ─────────────────────────────────────────────
function OrderDetail({ order, onStatusChange, onTrackingSave, onNotesSave }: {
  order: Order
  onStatusChange: (id: string, status: string) => void
  onTrackingSave: (id: string, tracking: string) => void
  onNotesSave: (id: string, notes: string) => void
}) {
  const { toast } = useToast()
  const [localStatus, setLocalStatus] = useState(order.status)
  const [tracking, setTracking] = useState(order.trackingNumber || '')
  const [notes, setNotes] = useState(order.notes || '')
  const [savingStatus, setSavingStatus] = useState(false)
  const [savingTracking, setSavingTracking] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)

  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const paymentCfg = PAYMENT_STATUS_CONFIG[order.paymentStatus] || PAYMENT_STATUS_CONFIG.pending
  const StatusIcon = statusCfg.icon

  const handleStatusChange = async (newStatus: string) => {
    setSavingStatus(true)
    try {
      await onStatusChange(order.id, newStatus)
      setLocalStatus(newStatus)
      toast({ title: `Order status updated to ${newStatus}` })
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' })
    } finally {
      setSavingStatus(false)
    }
  }

  const handleTrackingSave = async () => {
    setSavingTracking(true)
    try {
      await onTrackingSave(order.id, tracking)
      toast({ title: 'Tracking number saved' })
    } catch {
      toast({ title: 'Failed to save tracking number', variant: 'destructive' })
    } finally {
      setSavingTracking(false)
    }
  }

  const handleNotesSave = async () => {
    setSavingNotes(true)
    try {
      await onNotesSave(order.id, notes)
      toast({ title: 'Notes saved' })
    } catch {
      toast({ title: 'Failed to save notes', variant: 'destructive' })
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Status & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${statusCfg.bg} ${statusCfg.color}`}>
          <StatusIcon className="w-4 h-4" />
          {localStatus.charAt(0).toUpperCase() + localStatus.slice(1)}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              disabled={savingStatus || localStatus === opt.value}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                localStatus === opt.value
                  ? `${STATUS_CONFIG[opt.value]?.bg || ''} ${STATUS_CONFIG[opt.value]?.color || 'text-gray-400'} border border-transparent`
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-transparent'
              } disabled:opacity-40`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer & Delivery Info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Customer</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-gray-500" />
              <span className="text-white font-medium">{order.customerName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-gray-300">{order.customerPhone}</span>
            </div>
            {order.customerEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-gray-300">{order.customerEmail}</span>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            <MapPin className="w-3.5 h-3.5 inline mr-1.5" />
            Delivery Address
          </h4>
          {order.deliveryAddress || order.deliveryCity || order.deliveryRegion ? (
            <div className="space-y-1 text-sm">
              {order.deliveryAddress && <p className="text-gray-300">{order.deliveryAddress}</p>}
              {(order.deliveryCity || order.deliveryRegion) && (
                <p className="text-gray-400">
                  {[order.deliveryCity, order.deliveryRegion].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">No delivery address provided</p>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white/5 rounded-xl overflow-hidden">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 pt-4 pb-2">
          Order Items ({order.items.length})
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-gray-700/50">
                <th className="text-left text-gray-400 font-medium px-4 py-2.5">Product</th>
                <th className="text-left text-gray-400 font-medium px-4 py-2.5">Variant</th>
                <th className="text-right text-gray-400 font-medium px-4 py-2.5">Qty</th>
                <th className="text-right text-gray-400 font-medium px-4 py-2.5">Unit Price</th>
                <th className="text-right text-gray-400 font-medium px-4 py-2.5">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={item.id} className={idx < order.items.length - 1 ? 'border-t border-gray-800/50' : ''}>
                  <td className="px-4 py-2.5 text-white font-medium">{item.productName}</td>
                  <td className="px-4 py-2.5 text-gray-400">{item.variantName || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-300 text-right">{item.quantity}</td>
                  <td className="px-4 py-2.5 text-gray-300 text-right">{formatCurrency(item.unitPrice, order.currency)}</td>
                  <td className="px-4 py-2.5 text-white font-semibold text-right">{formatCurrency(item.totalPrice, order.currency)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-700/50">
                <td colSpan={4} className="px-4 py-3 text-right text-gray-400 font-semibold">Total</td>
                <td className="px-4 py-3 text-right text-white font-bold text-base">
                  {formatCurrency(order.totalAmount, order.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payment Info & Tracking */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            <DollarSign className="w-3.5 h-3.5 inline mr-1.5" />
            Payment
          </h4>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Provider</span>
              <span className="text-white text-sm font-medium capitalize">
                {order.paymentProvider || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Status</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${paymentCfg.bg} ${paymentCfg.color}`}>
                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
              </span>
            </div>
            {order.paymentRef && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Reference</span>
                <span className="text-gray-300 text-xs font-mono">{order.paymentRef}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            <Truck className="w-3.5 h-3.5 inline mr-1.5" />
            Tracking
          </h4>
          <div className="flex gap-2">
            <Input
              value={tracking}
              onChange={e => setTracking(e.target.value)}
              placeholder="Enter tracking number"
              className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 text-sm h-9"
            />
            <Button
              size="sm"
              onClick={handleTrackingSave}
              disabled={savingTracking}
              variant="success" className="h-9 px-3 shrink-0"
            >
              <Save className={`w-3.5 h-3.5 ${savingTracking ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Internal Notes */}
      <div className="bg-white/5 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          <StickyNote className="w-3.5 h-3.5 inline mr-1.5" />
          Internal Notes
        </h4>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add internal notes about this order..."
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-gray-700 text-white placeholder:text-gray-500 text-sm resize-none focus:outline-none focus:border-smgh-green/50 transition-colors"
        />
        <div className="flex justify-end mt-2">
          <Button
            size="sm"
            onClick={handleNotesSave}
            disabled={savingNotes}
            variant="success" className="h-8"
          >
            <Save className={`w-3.5 h-3.5 mr-1.5 ${savingNotes ? 'animate-spin' : ''}`} />
            Save Notes
          </Button>
        </div>
      </div>

      {/* Timestamps */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
        <span>Created: {formatDate(order.createdAt)}</span>
        <span>Updated: {formatDate(order.updatedAt)}</span>
      </div>
    </div>
  )
}

// ─── Order Card ─────────────────────────────────────────────────────
function OrderCard({
  order,
  expanded,
  onToggle,
  onStatusChange,
  onTrackingSave,
  onNotesSave,
}: {
  order: Order
  expanded: boolean
  onToggle: () => void
  onStatusChange: (id: string, status: string) => void
  onTrackingSave: (id: string, tracking: string) => void
  onNotesSave: (id: string, notes: string) => void
}) {
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const StatusIcon = statusCfg.icon
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className={`glass rounded-xl overflow-hidden transition-all ${expanded ? 'ring-1 ring-smgh-green/20' : ''}`}>
      {/* Card Header */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
      >
        {/* Status icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${statusCfg.bg}`}>
          <StatusIcon className={`w-5 h-5 ${statusCfg.color}`} />
        </div>

        {/* Order info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-semibold text-sm">{order.orderNumber}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${statusCfg.bg} ${statusCfg.color}`}>
              {order.status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span>{order.customerName}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{order.customerPhone}</span>
            <span className="hidden md:inline">·</span>
            <span className="hidden md:inline">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
          </div>
        </div>

        {/* Amount & date */}
        <div className="text-right shrink-0">
          <p className="text-white font-semibold text-sm">{formatCurrency(order.totalAmount, order.currency)}</p>
          <p className="text-gray-500 text-xs mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Expand icon */}
        <div className="text-gray-500 shrink-0 ml-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-gray-800 p-4">
          <OrderDetail
            order={order}
            onStatusChange={onStatusChange}
            onTrackingSave={onTrackingSave}
            onNotesSave={onNotesSave}
          />
        </div>
      )}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const { toast } = useToast()

  // Data state
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [savingStatus, setSavingStatus] = useState(false)
  const [savingTracking, setSavingTracking] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)

  // Filter state
  const [activeTab, setActiveTab] = useState<StatusKey>('all')
  const [search, setSearch] = useState('')

  // ─── Fetch Orders ─────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      if (activeTab !== 'all') params.set('status', activeTab)

      const data = await fetchJSON(`/api/orders?${params.toString()}`)
      setOrders(ensureArray(data))
    } catch {
      toast({ title: 'Failed to load orders', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [search, activeTab, toast])

  useEffect(() => {
    setLoading(true)
    fetchOrders()
  }, [fetchOrders])

  // ─── Stats ────────────────────────────────────────────────────────
  const totalOrders = orders.length
  const pendingCount = orders.filter(o => o.status === 'pending').length
  const deliveredCount = orders.filter(o => o.status === 'delivered').length
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0)

  // ─── Handlers ─────────────────────────────────────────────────────
  const handleStatusChange = async (id: string, status: string) => {
    setSavingStatus(true)
    const { ok } = await fetchWrite(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setSavingStatus(false)
    if (!ok) throw new Error('Update failed')
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o))
  }

  const handleTrackingSave = async (id: string, trackingNumber: string) => {
    setSavingTracking(true)
    const { ok } = await fetchWrite(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingNumber }),
    })
    setSavingTracking(false)
    if (!ok) throw new Error('Update failed')
    setOrders(prev => prev.map(o => o.id === id ? { ...o, trackingNumber, updatedAt: new Date().toISOString() } : o))
  }

  const handleNotesSave = async (id: string, notes: string) => {
    setSavingNotes(true)
    const { ok } = await fetchWrite(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    setSavingNotes(false)
    if (!ok) throw new Error('Update failed')
    setOrders(prev => prev.map(o => o.id === id ? { ...o, notes, updatedAt: new Date().toISOString() } : o))
  }

  const handleToggle = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div>
      <PageLoadingOverlay visible={savingStatus || savingTracking || savingNotes} message="Saving changes..." />

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-smgh-green" />
            Orders
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage shop orders and track shipments</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Package}
          label="Total Orders"
          value={totalOrders.toString()}
          color="bg-blue-500/10 text-blue-400"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={pendingCount.toString()}
          color="bg-yellow-500/10 text-yellow-400"
        />
        <StatCard
          icon={CheckCircle}
          label="Delivered"
          value={deliveredCount.toString()}
          color="bg-green-500/10 text-green-400"
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`₵${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          color="bg-purple-500/10 text-purple-400"
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order number, name, or phone..."
            className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 pl-10 h-10 rounded-lg"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {STATUS_TABS.map(tab => {
            const count = tab.key === 'all'
              ? orders.length
              : orders.filter(o => o.status === tab.key).length
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key ? 'bg-white/20' : 'bg-white/10'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/5 rounded w-1/3" />
                  <div className="h-3 bg-white/5 rounded w-1/4" />
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-4 bg-white/5 rounded w-20 ml-auto" />
                  <div className="h-3 bg-white/5 rounded w-16 ml-auto" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="glass rounded-xl p-16 text-center">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-gray-300 font-medium text-lg mb-1">No orders found</h3>
          <p className="text-gray-500 text-sm">
            {search ? 'Try a different search term' : activeTab !== 'all' ? 'No orders with this status' : 'Orders will appear here once customers start placing them'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={expandedId === order.id}
              onToggle={() => handleToggle(order.id)}
              onStatusChange={handleStatusChange}
              onTrackingSave={handleTrackingSave}
              onNotesSave={handleNotesSave}
            />
          ))}
        </div>
      )}
    </div>
  )
}
