'use client'

import { useState, useEffect } from 'react'
import {
  Calendar, Image, Music, MessageSquare, Mail, Heart, DollarSign,
  TrendingUp, ShoppingBag, UserPlus, Download,
} from 'lucide-react'

interface Stats {
  events: number
  gallery: number
  artists: number
  donations: { total: number; count: number }
  messages: number
  unreadMessages: number
  subscribers: number
  recentActivity: ActivityItem[]
  recentDonations: RecentDonation[]
  ordersByStatus: Record<string, number>
  eventsByStatus: Record<string, number>
  totalOrders: number
  totalRSVPs: number
}

interface ActivityItem {
  type: string
  message: string
  time: string
}

interface RecentDonation {
  name: string
  amount: number
  createdAt: string
}

// ─── Relative time helper ───────────────────────────────────────────
function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (weeks < 5) return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  return new Date(dateStr).toLocaleDateString()
}

// ─── Activity type → icon & colour mapping ─────────────────────────
function activityMeta(type: string) {
  switch (type) {
    case 'donation':
      return { Icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/15' }
    case 'message':
      return { Icon: MessageSquare, color: 'text-yellow-400', bg: 'bg-yellow-500/15' }
    case 'subscriber':
      return { Icon: Mail, color: 'text-cyan-400', bg: 'bg-cyan-500/15' }
    case 'rsvp':
      return { Icon: UserPlus, color: 'text-blue-400', bg: 'bg-blue-500/15' }
    case 'order':
      return { Icon: ShoppingBag, color: 'text-purple-400', bg: 'bg-purple-500/15' }
    default:
      return { Icon: Heart, color: 'text-gray-400', bg: 'bg-gray-500/15' }
  }
}

// ─── Orders status → bar colour ─────────────────────────────────────
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-400',
  confirmed: 'bg-blue-400',
  processing: 'bg-orange-400',
  shipped: 'bg-purple-400',
  delivered: 'bg-emerald-400',
  cancelled: 'bg-red-400',
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Derived values
  const completedEvents = stats?.eventsByStatus?.completed ?? 0
  const pendingOrders = stats?.ordersByStatus?.pending ?? 0

  const statCards = [
    { label: 'Total Events', value: stats?.events ?? 0, icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Gallery Items', value: stats?.gallery ?? 0, icon: Image, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Artists', value: stats?.artists ?? 0, icon: Music, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { label: 'Total Donations', value: stats ? `₵${stats.donations.total.toLocaleString()}` : '₵0', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Messages', value: stats?.unreadMessages ?? 0, icon: MessageSquare, color: 'text-yellow-400', bg: 'bg-yellow-500/10', sub: `${stats?.messages ?? 0} total` },
    { label: 'Subscribers', value: stats?.subscribers ?? 0, icon: Mail, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Orders', value: stats?.totalOrders ?? 0, icon: ShoppingBag, color: 'text-purple-400', bg: 'bg-purple-500/10', sub: `${pendingOrders} pending` },
    { label: 'RSVPs', value: stats?.totalRSVPs ?? 0, icon: UserPlus, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ]

  // Orders bar chart data
  const ordersByStatus = stats?.ordersByStatus ?? {}
  const totalOrdersCount = Object.values(ordersByStatus).reduce((a, b) => a + b, 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm">Overview of your website&apos;s content and activity</p>
      </div>

      {loading ? (
        <>
          {/* Skeleton stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-24 mb-4" />
                <div className="h-8 bg-gray-700 rounded w-16" />
              </div>
            ))}
          </div>
          {/* Skeleton panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass rounded-xl p-6 animate-pulse">
                <div className="h-5 bg-gray-700 rounded w-40 mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-gray-700 rounded w-full" />
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-700 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* ── Stat Cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map(card => (
              <div key={card.label} className="glass rounded-xl p-6 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">{card.label}</p>
                    <p className="text-2xl font-bold text-white">{card.value}</p>
                    {card.sub && <p className="text-gray-500 text-xs mt-1">{card.sub}</p>}
                  </div>
                  <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Panels Grid ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

            {/* Recent Activity */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Heart className="w-4 h-4 text-smgh-rose" />
                Recent Activity
              </h3>
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {stats.recentActivity.map((item, idx) => {
                    const meta = activityMeta(item.type)
                    const { Icon, color, bg } = meta
                    return (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                        <span className="text-gray-300 flex-1 truncate">{item.message}</span>
                        <span className="text-gray-500 text-xs shrink-0 whitespace-nowrap">
                          {relativeTime(item.time)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No recent activity</p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-smgh-teal" />
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Completed Events</span>
                  <span className="text-white font-medium">{completedEvents}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Successful Donations</span>
                  <span className="text-white font-medium">{stats?.donations.count ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Total Raised</span>
                  <span className="text-emerald-400 font-medium">₵{(stats?.donations.total ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Unread Messages</span>
                  <span className="text-yellow-400 font-medium">{stats?.unreadMessages ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Pending Orders</span>
                  <span className="text-purple-400 font-medium">{pendingOrders}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Total RSVPs</span>
                  <span className="text-blue-400 font-medium">{stats?.totalRSVPs ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Recent Donations */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Recent Donations
              </h3>
              {stats?.recentDonations && stats.recentDonations.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {stats.recentDonations.map((d, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-200 truncate">{d.name}</p>
                        <p className="text-gray-500 text-xs">{new Date(d.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className="text-emerald-400 font-semibold shrink-0 ml-3">
                        ₵{d.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No donations yet</p>
              )}
            </div>

            {/* Orders by Status */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-purple-400" />
                Orders by Status
              </h3>
              {totalOrdersCount > 0 ? (
                <div className="space-y-4">
                  {/* Stacked bar */}
                  <div className="flex h-5 rounded-full overflow-hidden bg-white/5">
                    {Object.entries(ordersByStatus).map(([status, count]) => {
                      const pct = (count / totalOrdersCount) * 100
                      return (
                        <div
                          key={status}
                          className={`${statusColors[status] ?? 'bg-gray-500'} transition-all`}
                          style={{ width: `${pct}%` }}
                          title={`${statusLabels[status] ?? status}: ${count}`}
                        />
                      )
                    })}
                  </div>
                  {/* Legend */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(ordersByStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center gap-2 text-xs">
                        <span className={`w-2.5 h-2.5 rounded-sm ${statusColors[status] ?? 'bg-gray-500'}`} />
                        <span className="text-gray-400 capitalize">{statusLabels[status] ?? status}</span>
                        <span className="text-white font-medium ml-auto">{count}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-500 text-xs">{totalOrdersCount} total order{totalOrdersCount !== 1 ? 's' : ''}</p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No orders yet</p>
              )}
            </div>
          </div>

          {/* ── CSV Export Buttons ──────────────────────────────────── */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Download className="w-4 h-4 text-cyan-400" />
              Export Data
            </h3>
            <div className="flex flex-wrap gap-3">
              <a
                href="/api/export/orders"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/15 text-purple-300 text-sm font-medium hover:bg-purple-500/25 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Orders
              </a>
              <a
                href="/api/export/donations"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-300 text-sm font-medium hover:bg-emerald-500/25 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Donations
              </a>
              <a
                href="/api/export/rsvps"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/15 text-blue-300 text-sm font-medium hover:bg-blue-500/25 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export RSVPs
              </a>
              <a
                href="/api/export/subscribers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/15 text-cyan-300 text-sm font-medium hover:bg-cyan-500/25 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Subscribers
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
