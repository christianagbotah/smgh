'use client'

import { useState, useEffect } from 'react'
import { Save, RotateCcw, MessageSquare, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import RichTextEditor from '@/components/RichTextEditor'

interface SiteSettings {
  [key: string]: string
}

export default function AdminPages() {
  const [settings, setSettings] = useState<SiteSettings>({})
  const [original, setOriginal] = useState<SiteSettings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [faqs, setFaqs] = useState<{q: string, a: string}[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data)
        setOriginal(data)
        setLoading(false)
        // Parse FAQs
        try {
          const parsedFaqs = JSON.parse(data.faqs || '[]')
          if (Array.isArray(parsedFaqs)) setFaqs(parsedFaqs)
        } catch {}
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const settingsWithFaqs = { ...settings, faqs: JSON.stringify(faqs) }
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsWithFaqs }),
      })
      toast({ title: 'Settings saved successfully' })
      setOriginal({ ...settingsWithFaqs })
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings({ ...original })
  }

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="glass rounded-xl p-6 h-32" /><div className="glass rounded-xl p-6 h-32" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Content / Pages</h1>
          <p className="text-gray-400 text-sm">Edit website content and page text</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} className="border-gray-700 text-gray-300">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gradient-teal text-black">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save All'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* About Content */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">About Page Content</h3>
          <RichTextEditor
            value={settings.about_content || ''}
            onChange={(html) => updateSetting('about_content', html)}
            placeholder="Write about SMGH..."
          />
        </div>

        {/* Visionary Message */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Visionary&apos;s Message</h3>
          <RichTextEditor
            value={settings.visionary_message || ''}
            onChange={(html) => updateSetting('visionary_message', html)}
            placeholder="The visionary's message..."
          />
        </div>

        {/* Foundation Description */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Foundation Description</h3>
          <RichTextEditor
            value={settings.foundation_description || ''}
            onChange={(html) => updateSetting('foundation_description', html)}
            placeholder="Describe the foundation..."
          />
        </div>

        {/* Home Hero Description */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Home Page - Hero Description</h3>
          <p className="text-gray-400 text-sm mb-4">The main paragraph below the &quot;Sweet Mothers Ghana&quot; title on the homepage hero.</p>
          <RichTextEditor
            value={settings.hero_description || ''}
            onChange={(html) => updateSetting('hero_description', html)}
            placeholder="To Honour and Support Mothers — especially single mothers, widows..."
          />
        </div>

        {/* Mission Cards */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Home Page - Mission Cards</h3>
          <p className="text-gray-400 text-sm mb-6">The three cards shown in the &quot;Our Mission&quot; section of the homepage.</p>
          <div className="space-y-6">
            {[1, 2, 3].map(num => (
              <div key={num} className="border border-gray-700/50 rounded-xl p-4">
                <h4 className="text-gray-300 text-sm font-medium mb-3">Card {num}</h4>
                <div className="mb-3">
                  <label className="text-gray-400 text-xs mb-1 block">Title</label>
                  <input
                    value={settings[`mission_card_${num}_title`] || ''}
                    onChange={e => updateSetting(`mission_card_${num}_title`, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-smgh-teal"
                    placeholder={num === 1 ? 'Honour Mothers' : num === 2 ? 'Support the Needy' : 'Worship & Praise'}
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Description</label>
                  <RichTextEditor
                    value={settings[`mission_card_${num}_desc`] || ''}
                    onChange={(html) => updateSetting(`mission_card_${num}_desc`, html)}
                    placeholder="Describe this mission area..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Items */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            FAQ Items
          </h3>
          <p className="text-gray-400 text-sm mb-4">Manage the Frequently Asked Questions shown on the contact page.</p>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-gray-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-xs font-medium">Question {idx + 1}</span>
                  <button onClick={() => setFaqs(prev => prev.filter((_, i) => i !== idx))} className="text-red-400/70 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  value={faq.q}
                  onChange={e => setFaqs(prev => prev.map((f, i) => i === idx ? { ...f, q: e.target.value } : f))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-smgh-teal mb-2"
                  placeholder="Question..."
                />
                <textarea
                  value={faq.a}
                  onChange={e => setFaqs(prev => prev.map((f, i) => i === idx ? { ...f, a: e.target.value } : f))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-smgh-teal resize-none"
                  placeholder="Answer..."
                />
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => setFaqs(prev => [...prev, { q: '', a: '' }])} className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 mt-4">
            <Plus className="w-4 h-4 mr-2" /> Add FAQ
          </Button>
        </div>
      </div>
    </div>
  )
}
