'use client'

import { useState, useEffect, useMemo } from 'react'
import { Heart, DollarSign, Search, CheckCircle, Clock, XCircle, Building2, Users, Gift, Mail, Phone, MapPin, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

interface Donation {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  amount: number
  currency: string
  paymentMethod: string
  paymentProvider: string | null
  status: string
  reference: string | null
  message: string | null
  donorType: string
  donationFrequency: string | null
  organization: string | null
  createdAt: string
}

type StatusFilter = 'all' | 'pending' | 'completed' | 'failed'
type DonorTypeFilter = 'all' | 'individual' | 'corporate' | 'church'

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock; bg: string }> = {
  pending:   { label: 'Pending',   color: 'text-yellow-400',  icon: Clock,       bg: 'bg-yellow-400/10 border-yellow-400/20' },
  completed: { label: 'Completed', color: 'text-green-400',   icon: CheckCircle, bg: 'bg-green-400/10 border-green-400/20' },
  failed:    { label: 'Failed',    color: 'text-red-400',     icon: XCircle,     bg: 'bg-red-400/10 border-red-400/20' },
}

const providerConfig: Record<string, { label: string; color: string; bg: string }> = {
  paystack: { label: 'Paystack', color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20' },
  hubtel:   { label: 'Hubtel',   color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
  manual:   { label: 'Manual',   color: 'text-gray-400',   bg: 'bg-gray-400/10 border-gray-400/20' },
}

const donorTypeConfig: Record<string, { label: string; icon: typeof Users; color: string }> = {
  individual: { label: 'Individual', icon: Users,     color: 'text-blue-400' },
  corporate:  { label: 'Corporate',  icon: Building2, color: 'text-purple-400' },
  church:     { label: 'Church',     icon: Gift,      color: 'text-amber-400' },
}

function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `₵${formatted}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminDonations() {
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [donorTypeFilter, setDonorTypeFilter] = useState<DonorTypeFilter>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchDonations = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (donorTypeFilter !== 'all') params.set('donorType', donorTypeFilter)

    fetch(`/api/donations?${params.toString()}`)
      .then(res => res.json())
      .then(data => { setDonations(data); setLoading(false) })
      .catch(() => {
        toast({ title: 'Failed to load donations', variant: 'destructive' })
        setLoading(false)
      })
  }

  useEffect(() => { fetchDonations() }, [statusFilter, donorTypeFilter])

  const filtered = useMemo(() => {
    if (!search.trim()) return donations
    const q = search.toLowerCase()
    return donations.filter(d =>
      d.name.toLowerCase().includes(q) ||
      (d.email && d.email.toLowerCase().includes(q)) ||
      (d.phone && d.phone.includes(q)) ||
      (d.reference && d.reference.toLowerCase().includes(q))
    )
  }, [donations, search])

  const stats = useMemo(() => {
    const completed = donations.filter(d => d.status === 'completed')
    const pending = donations.filter(d => d.status === 'pending')
    return {
      totalAmount: completed.reduce((sum, d) => sum + d.amount, 0),
      totalCount: donations.length,
      pendingCount: pending.length,
      completedCount: completed.length,
    }
  }, [donations])

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/donations?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      toast({ title: `Marked as ${newStatus}` })
      fetchDonations()
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' })
    } finally {
      setUpdatingId(null)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: stats.totalCount },
    { key: 'pending', label: 'Pending', count: stats.pendingCount },
    { key: 'completed', label: 'Completed', count: stats.completedCount },
    { key: 'failed', label: 'Failed', count: donations.filter(d => d.status === 'failed').length },
  ]

  const donorTypeTabs: { key: DonorTypeFilter; label: string; icon: typeof Users }[] = [
    { key: 'all', label: 'All Types', icon: Filter },
    { key: 'individual', label: 'Individual', icon: Users },
    { key: 'corporate', label: 'Corporate', icon: Building2 },
    { key: 'church', label: 'Church', icon: Gift },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-400" />
            Donations
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage and track all donations</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-400/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total Raised</p>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalAmount)}</p>
          <p className="text-gray-500 text-xs mt-1">From {stats.completedCount} completed donations</p>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-400/10 flex items-center justify-center">
              <Gift className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total Donations</p>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalCount}</p>
          <p className="text-gray-500 text-xs mt-1">All time</p>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-400/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Pending</p>
          </div>
          <p className="text-2xl font-bold text-white">{stats.pendingCount}</p>
          <p className="text-gray-500 text-xs mt-1">Awaiting action</p>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-400/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Completed</p>
          </div>
          <p className="text-2xl font-bold text-white">{stats.completedCount}</p>
          <p className="text-gray-500 text-xs mt-1">{stats.totalCount > 0 ? Math.round((stats.completedCount / stats.totalCount) * 100) : 0}% success rate</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search by name, email, phone, or reference..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {statusTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                statusFilter === tab.key
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white/5 border-gray-700/50 text-gray-400 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-[10px] opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Donor Type Tabs */}
        <div className="flex flex-wrap gap-2">
          {donorTypeTabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setDonorTypeFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border flex items-center gap-1.5 ${
                  donorTypeFilter === tab.key
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/5 border-gray-700/50 text-gray-400 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Donations List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5" />
                  <div className="space-y-2">
                    <div className="h-4 w-40 bg-white/5 rounded" />
                    <div className="h-3 w-24 bg-white/5 rounded" />
                  </div>
                </div>
                <div className="h-6 w-20 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Heart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-lg font-medium">No donations found</p>
          <p className="text-gray-500 text-sm mt-1">
            {search ? 'Try a different search term' : 'Donations will appear here once received'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(donation => {
            const status = statusConfig[donation.status] || statusConfig.pending
            const provider = donation.paymentProvider
              ? providerConfig[donation.paymentProvider] || providerConfig.manual
              : providerConfig[donation.paymentMethod]
            const donorType = donorTypeConfig[donation.donorType] || donorTypeConfig.individual
            const isExpanded = expandedId === donation.id
            const StatusIcon = status.icon
            const DonorIcon = donorType.icon
            const isUpdating = updatingId === donation.id

            return (
              <div
                key={donation.id}
                className={`glass rounded-xl transition-all duration-200 ${isExpanded ? 'ring-1 ring-white/10' : ''}`}
              >
                {/* Main Row */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Donor Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                        <DonorIcon className={`w-4 h-4 ${donorType.color}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-medium text-sm truncate">{donation.name}</p>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${donorType.color.replace('text-', 'text-').replace('text-', 'bg-')}/10 border-current/20`}>
                            {donorType.label}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5">{formatDate(donation.createdAt)}</p>
                      </div>
                    </div>

                    {/* Center: Amount */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <p className="text-white font-bold text-lg">{formatCurrency(donation.amount)}</p>
                    </div>

                    {/* Right: Badges & Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {/* Provider Badge */}
                      <span className={`text-[10px] font-medium px-2 py-1 rounded-md border ${provider.bg}`}>
                        {provider.label}
                      </span>

                      {/* Status Badge */}
                      <span className={`text-[10px] font-medium px-2 py-1 rounded-md border flex items-center gap-1 ${status.bg}`}>
                        <StatusIcon className={`w-3 h-3 ${status.color}`} />
                        {status.label}
                      </span>

                      {/* Expand Toggle */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleExpand(donation.id)}
                        className="text-gray-400 hover:text-white text-xs h-7 px-2"
                      >
                        {isExpanded ? 'Less' : 'More'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t border-white/5 mt-0">
                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Contact Details */}
                      {donation.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-400">{donation.email}</span>
                        </div>
                      )}
                      {donation.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-400">{donation.phone}</span>
                        </div>
                      )}
                      {donation.address && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-400">{donation.address}</span>
                        </div>
                      )}
                      {donation.organization && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-400">{donation.organization}</span>
                        </div>
                      )}
                      {donation.reference && (
                        <div className="flex items-center gap-2 text-sm">
                          <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-400">
                            Ref: <code className="text-gray-300 bg-white/5 px-1.5 py-0.5 rounded text-xs">{donation.reference}</code>
                          </span>
                        </div>
                      )}
                      {donation.donationFrequency && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-400">
                            Frequency: <span className="text-gray-300 capitalize">{donation.donationFrequency}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Message */}
                    {donation.message && (
                      <div className="mt-3 bg-white/5 rounded-lg p-3">
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Message</p>
                        <p className="text-gray-300 text-sm leading-relaxed">{donation.message}</p>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="mt-3 text-gray-500 text-xs">
                      Created: {formatDateTime(donation.createdAt)}
                      {donation.id && (
                        <span className="ml-4">
                          ID: <code className="bg-white/5 px-1 py-0.5 rounded">{donation.id}</code>
                        </span>
                      )}
                    </div>

                    {/* Status Actions */}
                    {donation.status !== 'completed' && donation.status !== 'failed' && (
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                        <span className="text-gray-500 text-xs mr-1">Update Status:</span>
                        <Button
                          size="sm"
                          disabled={isUpdating}
                          onClick={() => handleStatusUpdate(donation.id, 'completed')}
                          className="bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 text-xs h-7"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          disabled={isUpdating}
                          onClick={() => handleStatusUpdate(donation.id, 'failed')}
                          className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs h-7"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Fail
                        </Button>
                        {isUpdating && (
                          <span className="text-gray-500 text-xs ml-2">Updating...</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Footer count */}
      {!loading && filtered.length > 0 && (
        <div className="mt-4 text-center">
          <p className="text-gray-500 text-xs">
            Showing {filtered.length} of {donations.length} donations
            {search && ` · filtered by "${search}"`}
          </p>
        </div>
      )}
    </div>
  )
}
