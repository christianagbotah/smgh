'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, CreditCard, Phone, ImagePlus, X, GripVertical, Lock, Globe, MapPin, Menu, Trash2, Plus, ChevronUp, ChevronDown, Search, FileText, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import MediaPicker from '@/components/MediaPicker'

interface SiteSettings {
  [key: string]: string
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SiteSettings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPw, setChangingPw] = useState(false)

  // Parse hero slides
  const heroSlides: string[] = (() => {
    try {
      const parsed = JSON.parse(settings.hero_slider_images || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
  })()

  // Parse nav links
  const navLinksList: {label: string, href: string}[] = (() => {
    try {
      const parsed = JSON.parse(settings.nav_links || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
  })()

  // Parse footer links
  const footerLinksList: {label: string, href: string}[] = (() => {
    try {
      const parsed = JSON.parse(settings.footer_links || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
  })()

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => { setSettings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      toast({ title: 'Settings saved' })
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: 'All password fields are required', variant: 'destructive' })
      return
    }
    if (newPassword.length < 6) {
      toast({ title: 'New password must be at least 6 characters', variant: 'destructive' })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'New passwords do not match', variant: 'destructive' })
      return
    }

    setChangingPw(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change-password', currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast({ title: 'Password changed successfully' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast({ title: data.error || 'Failed to change password', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to change password', variant: 'destructive' })
    } finally {
      setChangingPw(false)
    }
  }

  const update = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }))

  // Add image to hero slider
  const addHeroImage = useCallback((url: string) => {
    const current = (() => {
      try { return Array.isArray(JSON.parse(settings.hero_slider_images || '[]')) ? JSON.parse(settings.hero_slider_images || '[]') : [] }
      catch { return [] }
    })()
    const updated = [...current, url]
    update('hero_slider_images', JSON.stringify(updated))
  }, [settings.hero_slider_images])

  // Remove image from hero slider
  const removeHeroImage = useCallback((index: number) => {
    const current = (() => {
      try { return Array.isArray(JSON.parse(settings.hero_slider_images || '[]')) ? JSON.parse(settings.hero_slider_images || '[]') : [] }
      catch { return [] }
    })()
    const updated = current.filter((_, i) => i !== index)
    update('hero_slider_images', JSON.stringify(updated))
  }, [settings.hero_slider_images])

  // Nav links helpers
  const updateNavLink = useCallback((index: number, field: 'label' | 'href', value: string) => {
    try {
      const current = JSON.parse(settings.nav_links || '[]')
      if (Array.isArray(current)) {
        current[index] = { ...current[index], [field]: value }
        update('nav_links', JSON.stringify(current))
      }
    } catch {}
  }, [settings.nav_links])

  const addNavLink = useCallback(() => {
    try {
      const current = JSON.parse(settings.nav_links || '[]')
      const arr = Array.isArray(current) ? current : []
      arr.push({ label: 'New Page', href: '/new-page' })
      update('nav_links', JSON.stringify(arr))
    } catch { update('nav_links', JSON.stringify([{ label: 'New Page', href: '/new-page' }])) }
  }, [settings.nav_links])

  const removeNavLink = useCallback((index: number) => {
    try {
      const current = JSON.parse(settings.nav_links || '[]')
      if (Array.isArray(current)) {
        update('nav_links', JSON.stringify(current.filter((_: any, i: number) => i !== index)))
      }
    } catch {}
  }, [settings.nav_links])

  const moveNavLink = useCallback((index: number, direction: 'up' | 'down') => {
    try {
      const current = JSON.parse(settings.nav_links || '[]')
      if (Array.isArray(current)) {
        const newIndex = direction === 'up' ? index - 1 : index + 1
        if (newIndex < 0 || newIndex >= current.length) return
        const temp = current[index]
        current[index] = current[newIndex]
        current[newIndex] = temp
        update('nav_links', JSON.stringify(current))
      }
    } catch {}
  }, [settings.nav_links])

  // Footer links helpers
  const updateFooterLink = useCallback((index: number, field: 'label' | 'href', value: string) => {
    try {
      const current = JSON.parse(settings.footer_links || '[]')
      if (Array.isArray(current)) {
        current[index] = { ...current[index], [field]: value }
        update('footer_links', JSON.stringify(current))
      }
    } catch {}
  }, [settings.footer_links])

  const addFooterLink = useCallback(() => {
    try {
      const current = JSON.parse(settings.footer_links || '[]')
      const arr = Array.isArray(current) ? current : []
      arr.push({ label: 'New Link', href: '/new-link' })
      update('footer_links', JSON.stringify(arr))
    } catch { update('footer_links', JSON.stringify([{ label: 'New Link', href: '/new-link' }])) }
  }, [settings.footer_links])

  const removeFooterLink = useCallback((index: number) => {
    try {
      const current = JSON.parse(settings.footer_links || '[]')
      if (Array.isArray(current)) {
        update('footer_links', JSON.stringify(current.filter((_: any, i: number) => i !== index)))
      }
    } catch {}
  }, [settings.footer_links])

  const moveFooterLink = useCallback((index: number, direction: 'up' | 'down') => {
    try {
      const current = JSON.parse(settings.footer_links || '[]')
      if (Array.isArray(current)) {
        const newIndex = direction === 'up' ? index - 1 : index + 1
        if (newIndex < 0 || newIndex >= current.length) return
        const temp = current[index]
        current[index] = current[newIndex]
        current[newIndex] = temp
        update('footer_links', JSON.stringify(current))
      }
    } catch {}
  }, [settings.footer_links])

  if (loading) return <div className="animate-pulse space-y-4"><div className="glass rounded-xl p-6 h-40" /><div className="glass rounded-xl p-6 h-40" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 text-sm">Payment configuration, hero slider and site settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gradient-teal text-black">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Brand Colors */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <Palette className="w-5 h-5 text-green-400" />
            Brand Colors
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Customize the site&apos;s brand colors. Changes apply site-wide instantly. Leave blank to use defaults.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key: 'brand_green', label: 'Primary Green', default: '#2E7D32' },
              { key: 'brand_green_dark', label: 'Green (Dark)', default: '#1B5E20' },
              { key: 'brand_green_light', label: 'Green (Light)', default: '#4CAF50' },
              { key: 'brand_red', label: 'Primary Red', default: '#D32F2F' },
              { key: 'brand_red_dark', label: 'Red (Dark)', default: '#B71C1C' },
              { key: 'brand_red_light', label: 'Red (Light)', default: '#F44336' },
              { key: 'brand_gold', label: 'Gold / Accent', default: '#FFD600' },
              { key: 'brand_green_lighter', label: 'Green (Lighter)', default: '#81C784' },
            ].map(color => (
              <div key={color.key}>
                <label className="text-gray-400 text-xs mb-1.5 block">{color.label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings[color.key] || color.default}
                    onChange={e => update(color.key, e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent p-0.5"
                  />
                  <input
                    value={settings[color.key] || ''}
                    onChange={e => update(color.key, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-gray-700 text-white text-sm font-mono focus:outline-none focus:border-smgh-teal"
                    placeholder={color.default}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => update(color.key, '')}
                  className="text-gray-600 text-xs hover:text-gray-400 mt-1 transition-colors"
                >
                  Reset to default
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Slider */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <ImagePlus className="w-5 h-5 text-purple-400" />
            Hero Slider Images
          </h3>
          <p className="text-gray-400 text-sm mb-1">
            Add images that appear in the homepage hero slider. They will auto-fade every 5 seconds.
          </p>
          <p className="text-cyan-400/70 text-xs mb-4">
            💡 Tip: Use the gallery page for bulk image uploads.
          </p>

          {/* Current slides */}
          {heroSlides.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-5">
              {heroSlides.map((url, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-700 bg-white/5">
                  <img src={url} alt={`Slide ${idx + 1}`} className="w-full h-24 object-cover" />
                  <div className="absolute top-1 left-1">
                    <span className="text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded-full">#{idx + 1}</span>
                  </div>
                  <button
                    onClick={() => removeHeroImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new slide */}
          <MediaPicker
            value=""
            onChange={(url) => addHeroImage(url)}
            label="Add New Slide"
            previewHeight="h-20"
          />

          <p className="text-gray-500 text-xs mt-3">
            {heroSlides.length} slide{heroSlides.length !== 1 ? 's' : ''} configured.
            If empty, event banners will be used automatically.
          </p>
        </div>

        {/* Navigation Menu */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <Menu className="w-5 h-5 text-yellow-400" />
            Navigation Menu
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Manage the links shown in the site header. Changes appear immediately on the site.
          </p>
          <div className="space-y-2 mb-4">
            {navLinksList.map((link, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveNavLink(idx, 'up')} disabled={idx === 0} className="p-0.5 text-gray-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button onClick={() => moveNavLink(idx, 'down')} disabled={idx === navLinksList.length - 1} className="p-0.5 text-gray-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-gray-600 text-xs w-5 text-center">{idx + 1}</span>
                <input
                  value={link.label}
                  onChange={e => updateNavLink(idx, 'label', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-smgh-teal"
                  placeholder="Link Label"
                />
                <input
                  value={link.href}
                  onChange={e => updateNavLink(idx, 'href', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-smgh-teal font-mono"
                  placeholder="/path"
                />
                <button onClick={() => removeNavLink(idx)} className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={addNavLink} className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-500">
            <Plus className="w-4 h-4 mr-2" /> Add Nav Link
          </Button>
          <p className="text-gray-500 text-xs mt-3">{navLinksList.length} link{navLinksList.length !== 1 ? 's' : ''} configured.</p>
        </div>

        {/* Payment Settings */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            Payment Settings
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Select the active payment provider. Visitors will see this provider with Mobile Money, Card &amp; Bank Transfer options.
          </p>

          {/* Active Provider Radio */}
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {[
              { id: 'paystack', name: 'Paystack', desc: 'Paystack (Mobile Money, Card, Bank Transfer)', color: 'border-blue-500/40 bg-blue-500/5', activeColor: 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30' },
              { id: 'hubtel', name: 'Hubtel', desc: 'Hubtel (Mobile Money, Card, Bank Transfer)', color: 'border-orange-500/40 bg-orange-500/5', activeColor: 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30' },
              { id: 'both', name: 'Both', desc: 'Show both Paystack and Hubtel options', color: 'border-emerald-500/40 bg-emerald-500/5', activeColor: 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => update('active_payment_provider', opt.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  (settings.active_payment_provider || 'paystack') === opt.id
                    ? opt.activeColor
                    : `${opt.color} opacity-60 hover:opacity-80`
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    (settings.active_payment_provider || 'paystack') === opt.id
                      ? 'border-white bg-white'
                      : 'border-gray-500'
                  }`}>
                    {(settings.active_payment_provider || 'paystack') === opt.id && (
                      <div className={`w-2 h-2 rounded-full ${opt.id === 'hubtel' ? 'bg-orange-500' : opt.id === 'paystack' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                    )}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{opt.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{opt.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Paystack Keys */}
          <div className={`p-4 rounded-xl border border-gray-700/50 mb-4 ${
            (settings.active_payment_provider || 'paystack') === 'paystack' || (settings.active_payment_provider || 'paystack') === 'both'
              ? '' : 'opacity-40 pointer-events-none'
          }`}>
            <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-400" />
              Paystack Keys
            </h4>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Public Key</label>
                <input value={settings.paystack_public_key || ''} onChange={e => update('paystack_public_key', e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-smgh-teal" placeholder="pk_xxxx" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Secret Key</label>
                <input type="password" value={settings.paystack_secret_key || ''} onChange={e => update('paystack_secret_key', e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-smgh-teal" placeholder="sk_xxxx" />
              </div>
            </div>
          </div>

          {/* Hubtel Keys */}
          <div className={`p-4 rounded-xl border border-gray-700/50 ${
            (settings.active_payment_provider || 'paystack') === 'hubtel' || (settings.active_payment_provider || 'paystack') === 'both'
              ? '' : 'opacity-40 pointer-events-none'
          }`}>
            <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-orange-400" />
              Hubtel Keys
            </h4>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">API Username</label>
                <input value={settings.hubtel_username || ''} onChange={e => update('hubtel_username', e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-smgh-teal" placeholder="API Username" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Merchant ID</label>
                <input value={settings.hubtel_merchant_id || ''} onChange={e => update('hubtel_merchant_id', e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-smgh-teal" placeholder="e.g. 2018511" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">API Key (Secret)</label>
                <input type="password" value={settings.hubtel_client_secret || ''} onChange={e => update('hubtel_client_secret', e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-smgh-teal" placeholder="API Key" />
              </div>
            </div>
          </div>
        </div>

        {/* Site Info */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Site Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Site Name</label>
              <input value={settings.site_name || ''} onChange={e => update('site_name', e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-smgh-teal" />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Tagline</label>
              <input value={settings.site_tagline || ''} onChange={e => update('site_tagline', e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-smgh-teal" />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Visionary Name</label>
              <input value={settings.visionary_name || ''} onChange={e => update('visionary_name', e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-smgh-teal" />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Site Description (SEO)</label>
              <textarea
                value={settings.site_description || ''}
                onChange={e => update('site_description', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-smgh-teal resize-none"
                placeholder="A brief description of the site for search engines..."
              />
            </div>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-green-400" />
            SEO Settings
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Control how your site appears in search engines and social media previews.
          </p>
          <div className="grid md:grid-cols-1 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Page Title</label>
              <input
                value={settings.seo_title || ''}
                onChange={e => update('seo_title', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-smgh-teal"
                placeholder="Sweet Mothers Ghana - Honouring & Supporting Mothers"
              />
              <p className="text-gray-500 text-xs mt-1">Leave empty to use default: &quot;Sweet Mothers Ghana - Honouring &amp; Supporting Mothers&quot;</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Meta Description</label>
              <textarea
                value={settings.seo_description || ''}
                onChange={e => update('seo_description', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-smgh-teal resize-none"
                placeholder="A brief description for search engines..."
              />
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            Social Media Links
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Connect your social media profiles. Leave blank to hide from the site.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Facebook URL</label>
              <input
                value={settings.social_facebook || ''}
                onChange={e => update('social_facebook', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-smgh-teal"
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Instagram URL</label>
              <input
                value={settings.social_instagram || ''}
                onChange={e => update('social_instagram', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-smgh-teal"
                placeholder="https://instagram.com/yourprofile"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Twitter / X URL</label>
              <input
                value={settings.social_twitter || ''}
                onChange={e => update('social_twitter', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-smgh-teal"
                placeholder="https://x.com/yourhandle"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">YouTube URL</label>
              <input
                value={settings.social_youtube || ''}
                onChange={e => update('social_youtube', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-smgh-teal"
                placeholder="https://youtube.com/@yourchannel"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">TikTok URL</label>
              <input
                value={settings.social_tiktok || ''}
                onChange={e => update('social_tiktok', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-smgh-teal"
                placeholder="https://tiktok.com/@yourhandle"
              />
            </div>
          </div>
        </div>

        {/* Footer Quick Links */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5 text-pink-400" />
            Footer Quick Links
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Manage the links shown in the footer Quick Links column.
          </p>
          <div className="space-y-2 mb-4">
            {footerLinksList.map((link, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveFooterLink(idx, 'up')} disabled={idx === 0} className="p-0.5 text-gray-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button onClick={() => moveFooterLink(idx, 'down')} disabled={idx === footerLinksList.length - 1} className="p-0.5 text-gray-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-gray-600 text-xs w-5 text-center">{idx + 1}</span>
                <input
                  value={link.label}
                  onChange={e => updateFooterLink(idx, 'label', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-smgh-teal"
                  placeholder="Link Label"
                />
                <input
                  value={link.href}
                  onChange={e => updateFooterLink(idx, 'href', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-smgh-teal font-mono"
                  placeholder="/path"
                />
                <button onClick={() => removeFooterLink(idx)} className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={addFooterLink} className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-500">
            <Plus className="w-4 h-4 mr-2" /> Add Footer Link
          </Button>
          <p className="text-gray-500 text-xs mt-3">{footerLinksList.length} link{footerLinksList.length !== 1 ? 's' : ''} configured.</p>
        </div>

        {/* Contact Information */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            Contact Information
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Displayed on the contact page and in the site footer.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Phone Number (Primary)</label>
              <input
                value={settings.contact_phone || ''}
                onChange={e => update('contact_phone', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-smgh-teal"
                placeholder="+233 XX XXX XXXX"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Phone Number (Secondary)</label>
              <input
                value={settings.contact_phone2 || ''}
                onChange={e => update('contact_phone2', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-smgh-teal"
                placeholder="+233 XX XXX XXXX (optional)"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Email Address</label>
              <input
                value={settings.contact_email || ''}
                onChange={e => update('contact_email', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-smgh-teal"
                placeholder="info@example.com"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-gray-400 text-sm mb-1 block">Physical Address</label>
              <textarea
                value={settings.contact_address || ''}
                onChange={e => update('contact_address', e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-smgh-teal resize-none"
                placeholder="Street, City, Country"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Office Hours</label>
              <input
                value={settings.contact_office_hours || ''}
                onChange={e => update('contact_office_hours', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-smgh-teal"
                placeholder="Mon - Fri: 9:00 AM - 5:00 PM"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">WhatsApp Link</label>
              <input
                value={settings.whatsapp_link || ''}
                onChange={e => update('whatsapp_link', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-smgh-teal"
                placeholder="https://wa.link/xxxxx or https://wa.me/233XXXXXXXXX"
              />
            </div>
          </div>
        </div>

        {/* Danger Zone — Change Password */}
        <div className="glass rounded-xl p-6 border-red-500/20">
          <h3 className="text-red-400 font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Change Admin Password
          </h3>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-red-500"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-red-500"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-red-500"
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={changingPw}
            variant="outline"
            className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <Lock className="w-4 h-4 mr-2" />
            {changingPw ? 'Changing...' : 'Change Password'}
          </Button>
        </div>
      </div>
    </div>
  )
}
