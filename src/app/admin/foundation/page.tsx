'use client'

import { useState, useEffect } from 'react'
import {
  Plus, Trash2, Edit3, Save, X, Heart, Users, DollarSign, MapPin,
  ChevronDown, ChevronUp, Upload, CheckCircle, XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import RichTextEditor from '@/components/RichTextEditor'

interface FoundationRecord {
  id: string; year: number; description: string
  amountRaised: number | null; amountSpent: number | null
  beneficiariesCount: number | null; locations: string | null
  createdAt: string
}

interface Beneficiary {
  id: string; name: string; story: string | null; photo: string | null
  category: string | null; location: string | null; yearHelped: number | null
  active: boolean
}

const emptyRecord = {
  year: new Date().getFullYear(), description: '', amountRaised: '',
  amountSpent: '', beneficiariesCount: '', locations: '',
}

const emptyBeneficiary = {
  name: '', story: '', photo: '', category: 'widow',
  location: '', yearHelped: '', active: true,
}

export default function AdminFoundation() {
  const [records, setRecords] = useState<FoundationRecord[]>([])
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRecord, setEditingRecord] = useState<string | null>(null)
  const [editingBeneficiary, setEditingBeneficiary] = useState<string | null>(null)
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [showBeneficiaryForm, setShowBeneficiaryForm] = useState(false)
  const [recordForm, setRecordForm] = useState(emptyRecord)
  const [beneficiaryForm, setBeneficiaryForm] = useState(emptyBeneficiary)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      const [recRes, benRes] = await Promise.all([
        fetch('/api/foundation'),
        fetch('/api/beneficiaries'),
      ])
      const recData = await recRes.json()
      const benData = await benRes.json()
      setRecords(recData.records || recData)
      setBeneficiaries(benData)
    } catch {
      // handle error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const uploadFile = async (file: File): Promise<string | null> => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        return data.url || data.filename
      }
      return null
    } catch {
      return null
    } finally {
      setUploading(false)
    }
  }

  // Foundation Record CRUD
  const handleSaveRecord = async () => {
    if (!recordForm.year || !recordForm.description) {
      toast({ title: 'Year and description are required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const locations = recordForm.locations.split(',').map(s => s.trim()).filter(Boolean)
      const body = {
        year: parseInt(String(recordForm.year)),
        description: recordForm.description,
        amountRaised: recordForm.amountRaised ? parseFloat(recordForm.amountRaised) : null,
        amountSpent: recordForm.amountSpent ? parseFloat(recordForm.amountSpent) : null,
        beneficiariesCount: recordForm.beneficiariesCount ? parseInt(String(recordForm.beneficiariesCount)) : null,
        locations: locations.length > 0 ? JSON.stringify(locations) : null,
      }

      if (editingRecord) {
        await fetch('/api/foundation', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingRecord, ...body }),
        })
        toast({ title: 'Record updated' })
        setEditingRecord(null)
      } else {
        await fetch('/api/foundation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        toast({ title: 'Record created' })
        setShowRecordForm(false)
      }
      setRecordForm(emptyRecord)
      fetchData()
    } catch {
      toast({ title: 'Failed to save record', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Delete this foundation record?')) return
    try {
      await fetch(`/api/foundation?id=${id}`, { method: 'DELETE' })
      toast({ title: 'Record deleted' })
      fetchData()
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' })
    }
  }

  const startEditRecord = (r: FoundationRecord) => {
    setEditingRecord(r.id)
    setRecordForm({
      year: r.year,
      description: r.description,
      amountRaised: r.amountRaised?.toString() || '',
      amountSpent: r.amountSpent?.toString() || '',
      beneficiariesCount: r.beneficiariesCount?.toString() || '',
      locations: r.locations ? JSON.parse(r.locations).join(', ') : '',
    })
    setShowRecordForm(true)
  }

  // Beneficiary CRUD
  const handleSaveBeneficiary = async () => {
    if (!beneficiaryForm.name) {
      toast({ title: 'Name is required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const body = {
        name: beneficiaryForm.name,
        story: beneficiaryForm.story || null,
        photo: beneficiaryForm.photo || null,
        category: beneficiaryForm.category || null,
        location: beneficiaryForm.location || null,
        yearHelped: beneficiaryForm.yearHelped ? parseInt(String(beneficiaryForm.yearHelped)) : null,
        active: beneficiaryForm.active,
      }

      if (editingBeneficiary) {
        await fetch('/api/beneficiaries', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingBeneficiary, ...body }),
        })
        toast({ title: 'Beneficiary updated' })
        setEditingBeneficiary(null)
      } else {
        await fetch('/api/beneficiaries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        toast({ title: 'Beneficiary created' })
        setShowBeneficiaryForm(false)
      }
      setBeneficiaryForm(emptyBeneficiary)
      fetchData()
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteBeneficiary = async (id: string) => {
    if (!confirm('Delete this beneficiary?')) return
    try {
      await fetch(`/api/beneficiaries?id=${id}`, { method: 'DELETE' })
      toast({ title: 'Beneficiary deleted' })
      fetchData()
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' })
    }
  }

  const startEditBeneficiary = (b: Beneficiary) => {
    setEditingBeneficiary(b.id)
    setBeneficiaryForm({
      name: b.name,
      story: b.story || '',
      photo: b.photo || '',
      category: b.category || 'widow',
      location: b.location || '',
      yearHelped: b.yearHelped?.toString() || '',
      active: b.active,
    })
    setShowBeneficiaryForm(true)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadFile(file)
    if (url) {
      setBeneficiaryForm(prev => ({ ...prev, photo: url }))
      toast({ title: 'Photo uploaded' })
    } else {
      toast({ title: 'Upload failed', variant: 'destructive' })
    }
  }

  // Summary stats
  const totalRaised = records.reduce((sum, r) => sum + (r.amountRaised || 0), 0)
  const totalBeneficiaries = records.reduce((sum, r) => sum + (r.beneficiariesCount || 0), 0)
  const totalSpent = records.reduce((sum, r) => sum + (r.amountSpent || 0), 0)

  const categoryColors: Record<string, string> = {
    widow: 'bg-purple-500/10 text-purple-400',
    'single-mother': 'bg-blue-500/10 text-blue-400',
    'pastor-wife': 'bg-yellow-500/10 text-yellow-400',
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl bg-white/5" />)}</div>
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl bg-white/5" />)}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Foundation Management</h1>
        <p className="text-gray-400 text-sm">Manage foundation records and beneficiary stories</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-smgh-green/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-smgh-green" />
            </div>
            <span className="text-gray-400 text-xs">Total Raised</span>
          </div>
          <p className="text-xl font-bold text-white">₵{totalRaised.toLocaleString()}</p>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-smgh-red/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-smgh-red" />
            </div>
            <span className="text-gray-400 text-xs">Total Invested</span>
          </div>
          <p className="text-xl font-bold text-white">₵{totalSpent.toLocaleString()}</p>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-yellow-400" />
            </div>
            <span className="text-gray-400 text-xs">Beneficiaries</span>
          </div>
          <p className="text-xl font-bold text-white">{totalBeneficiaries.toLocaleString()}</p>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Heart className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-gray-400 text-xs">Stories</span>
          </div>
          <p className="text-xl font-bold text-white">{beneficiaries.length}</p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="records">
        <TabsList className="bg-white/5 p-1 mb-6 w-full md:w-auto">
          <TabsTrigger value="records" className="data-[state=active]:bg-white/10 text-gray-400 data-[state=active]:text-white rounded-lg flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Foundation Records
            <Badge variant="secondary" className="bg-white/10 text-gray-400 text-xs border-0 ml-1">{records.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="beneficiaries" className="data-[state=active]:bg-white/10 text-gray-400 data-[state=active]:text-white rounded-lg flex items-center gap-2">
            <Users className="w-4 h-4" /> Beneficiaries
            <Badge variant="secondary" className="bg-white/10 text-gray-400 text-xs border-0 ml-1">{beneficiaries.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Foundation Records Tab */}
        <TabsContent value="records">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Yearly Impact Records</h2>
            <Button onClick={() => { setShowRecordForm(!showRecordForm); if (showRecordForm) { setRecordForm(emptyRecord); setEditingRecord(null) } }} className="gradient-green text-white text-sm">
              <Plus className="w-4 h-4 mr-2" />{showRecordForm ? 'Cancel' : 'Add Record'}
            </Button>
          </div>

          {/* Record Form */}
          {showRecordForm && (
            <div className="glass rounded-2xl p-6 mb-6">
              <h3 className="text-white font-semibold mb-4">{editingRecord ? 'Edit Record' : 'New Foundation Record'}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Year *</label>
                  <Input type="number" value={recordForm.year} onChange={e => setRecordForm(p => ({ ...p, year: parseInt(e.target.value) || new Date().getFullYear() }))} className="bg-white/5 border-gray-700 text-white" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Beneficiaries Count</label>
                  <Input type="number" placeholder="e.g. 50" value={recordForm.beneficiariesCount} onChange={e => setRecordForm(p => ({ ...p, beneficiariesCount: e.target.value }))} className="bg-white/5 border-gray-700 text-white" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Amount Raised (₵)</label>
                  <Input type="number" placeholder="e.g. 15000" value={recordForm.amountRaised} onChange={e => setRecordForm(p => ({ ...p, amountRaised: e.target.value }))} className="bg-white/5 border-gray-700 text-white" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Amount Spent (₵)</label>
                  <Input type="number" placeholder="e.g. 12000" value={recordForm.amountSpent} onChange={e => setRecordForm(p => ({ ...p, amountSpent: e.target.value }))} className="bg-white/5 border-gray-700 text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-gray-400 text-xs mb-1 block">Locations (comma-separated)</label>
                  <Input placeholder="Cape Coast, Takoradi, Accra" value={recordForm.locations} onChange={e => setRecordForm(p => ({ ...p, locations: e.target.value }))} className="bg-white/5 border-gray-700 text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-gray-400 text-xs mb-1 block">Description *</label>
                  <RichTextEditor
                    value={recordForm.description}
                    onChange={(html) => setRecordForm(p => ({ ...p, description: html }))}
                    placeholder="Describe the impact and activities for this year..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-800">
                <Button onClick={handleSaveRecord} disabled={saving} className="gradient-green text-white">
                  {saving ? 'Saving...' : <><Save className="w-3 h-3 mr-1" /> Save Record</>}
                </Button>
                <Button onClick={() => { setShowRecordForm(false); setRecordForm(emptyRecord); setEditingRecord(null) }} variant="outline" className="border-gray-700 text-gray-300">Cancel</Button>
              </div>
            </div>
          )}

          {/* Records List */}
          {records.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No foundation records yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.sort((a, b) => b.year - a.year).map(record => {
                const locations: string[] = record.locations ? JSON.parse(record.locations) : []
                const isExpanded = expandedRecord === record.id
                return (
                  <div key={record.id} className="glass rounded-xl overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="w-14 h-14 rounded-xl gradient-green flex items-center justify-center text-white font-bold text-lg shadow-md shadow-smgh-green/20 flex-shrink-0">
                            {record.year.toString().slice(-2)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-white font-semibold">{record.year}</h3>
                              <Badge variant="secondary" className="bg-smgh-green/10 text-smgh-green text-xs border-0">
                                {record.beneficiariesCount || 0} beneficiaries
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-sm line-clamp-1 max-w-lg">{record.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs">
                              {record.amountRaised && (
                                <span className="text-smgh-green font-medium">₵{record.amountRaised.toLocaleString()} raised</span>
                              )}
                              {record.amountSpent && (
                                <span className="text-smgh-red font-medium">₵{record.amountSpent.toLocaleString()} invested</span>
                              )}
                              {locations.length > 0 && (
                                <span className="text-gray-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {locations.length} locations
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0 ml-3">
                          <button onClick={() => setExpandedRecord(isExpanded ? null : record.id)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button onClick={() => startEditRecord(record)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteRecord(record.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t border-gray-800 mt-0 pt-3">
                        <p className="text-gray-300 text-sm leading-relaxed">{record.description}</p>
                        {locations.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {locations.map((loc, i) => (
                              <Badge key={i} variant="secondary" className="bg-gray-800 text-gray-400 text-xs border-0">
                                <MapPin className="w-3 h-3 mr-1" />{loc}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          {record.amountRaised && (
                            <div className="bg-smgh-green/5 rounded-lg p-3 text-center">
                              <p className="text-xs text-gray-500">Raised</p>
                              <p className="text-sm font-bold text-smgh-green">₵{record.amountRaised.toLocaleString()}</p>
                            </div>
                          )}
                          {record.amountSpent && (
                            <div className="bg-smgh-red/5 rounded-lg p-3 text-center">
                              <p className="text-xs text-gray-500">Invested</p>
                              <p className="text-sm font-bold text-smgh-red">₵{record.amountSpent.toLocaleString()}</p>
                            </div>
                          )}
                          {record.beneficiariesCount && (
                            <div className="bg-yellow-500/5 rounded-lg p-3 text-center">
                              <p className="text-xs text-gray-500">Helped</p>
                              <p className="text-sm font-bold text-yellow-400">{record.beneficiariesCount}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Beneficiaries Tab */}
        <TabsContent value="beneficiaries">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Beneficiary Stories</h2>
            <Button onClick={() => { setShowBeneficiaryForm(!showBeneficiaryForm); if (showBeneficiaryForm) { setBeneficiaryForm(emptyBeneficiary); setEditingBeneficiary(null) } }} className="gradient-green text-white text-sm">
              <Plus className="w-4 h-4 mr-2" />{showBeneficiaryForm ? 'Cancel' : 'Add Beneficiary'}
            </Button>
          </div>

          {/* Beneficiary Form */}
          {showBeneficiaryForm && (
            <div className="glass rounded-2xl p-6 mb-6">
              <h3 className="text-white font-semibold mb-4">{editingBeneficiary ? 'Edit Beneficiary' : 'New Beneficiary'}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Name *</label>
                  <Input placeholder="Beneficiary name" value={beneficiaryForm.name} onChange={e => setBeneficiaryForm(p => ({ ...p, name: e.target.value }))} className="bg-white/5 border-gray-700 text-white" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Category</label>
                  <select value={beneficiaryForm.category} onChange={e => setBeneficiaryForm(p => ({ ...p, category: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-smgh-green">
                    <option value="widow">Widow</option>
                    <option value="single-mother">Single Mother</option>
                    <option value="pastor-wife">Pastor&apos;s Wife</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Location</label>
                  <Input placeholder="e.g. Cape Coast" value={beneficiaryForm.location} onChange={e => setBeneficiaryForm(p => ({ ...p, location: e.target.value }))} className="bg-white/5 border-gray-700 text-white" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Year Helped</label>
                  <Input type="number" placeholder="e.g. 2023" value={beneficiaryForm.yearHelped} onChange={e => setBeneficiaryForm(p => ({ ...p, yearHelped: e.target.value }))} className="bg-white/5 border-gray-700 text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-gray-400 text-xs mb-1 block">Photo</label>
                  <div className="flex gap-3 items-start">
                    <div className="flex-1">
                      <Input placeholder="Photo URL or upload" value={beneficiaryForm.photo} onChange={e => setBeneficiaryForm(p => ({ ...p, photo: e.target.value }))} className="bg-white/5 border-gray-700 text-white" />
                    </div>
                    <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-gray-400 hover:text-white hover:border-smgh-green cursor-pointer transition-colors flex-shrink-0">
                      <Upload className="w-4 h-4" />
                      {uploading ? '...' : 'Upload'}
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                  {beneficiaryForm.photo && (
                    <div className="mt-2 relative inline-block">
                      <img src={beneficiaryForm.photo} alt="Preview" className="w-16 h-16 rounded-xl object-cover" />
                      <button onClick={() => setBeneficiaryForm(p => ({ ...p, photo: '' }))} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-gray-400 text-xs mb-1 block">Story</label>
                  <RichTextEditor
                    value={beneficiaryForm.story}
                    onChange={(html) => setBeneficiaryForm(p => ({ ...p, story: html }))}
                    placeholder="Tell their story of transformation..."
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Active</label>
                  <button
                    onClick={() => setBeneficiaryForm(p => ({ ...p, active: !p.active }))}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${beneficiaryForm.active ? 'bg-smgh-green/10 border-smgh-green/30 text-smgh-green' : 'bg-white/5 border-gray-700 text-gray-400'}`}
                  >
                    {beneficiaryForm.active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {beneficiaryForm.active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-800">
                <Button onClick={handleSaveBeneficiary} disabled={saving} className="gradient-green text-white">
                  {saving ? 'Saving...' : <><Save className="w-3 h-3 mr-1" /> Save Beneficiary</>}
                </Button>
                <Button onClick={() => { setShowBeneficiaryForm(false); setBeneficiaryForm(emptyBeneficiary); setEditingBeneficiary(null) }} variant="outline" className="border-gray-700 text-gray-300">Cancel</Button>
              </div>
            </div>
          )}

          {/* Beneficiaries List */}
          {beneficiaries.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <Heart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No beneficiaries yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {beneficiaries.map(b => (
                <div key={b.id} className="glass rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {b.photo ? (
                        <img src={b.photo} alt={b.name} className="w-12 h-12 rounded-xl object-cover ring-2 ring-smgh-green/10 flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-smgh-green/10 flex items-center justify-center text-smgh-green font-bold text-sm flex-shrink-0">
                          {b.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-medium">{b.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${categoryColors[b.category || ''] || 'bg-gray-500/10 text-gray-400'}`}>
                            {b.category?.replace('-', ' ')}
                          </span>
                          {!b.active && (
                            <Badge variant="secondary" className="bg-gray-800 text-gray-500 text-xs border-0">inactive</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {b.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.location}</span>}
                          {b.yearHelped && <span>Helped {b.yearHelped}</span>}
                        </div>
                        {b.story && (
                          <p className="text-gray-400 text-xs mt-1.5 line-clamp-2">{b.story}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0 ml-3">
                      <button onClick={() => startEditBeneficiary(b)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteBeneficiary(b.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
