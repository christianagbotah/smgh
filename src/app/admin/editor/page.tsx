'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Calendar, Heart, Users, Image, Music, DollarSign,
  Phone, ShoppingBag, Truck, ChevronLeft, ChevronRight,
  X, Save, ArrowLeft, Monitor, Smartphone, Tablet,
  FileText, ExternalLink, Edit3, Loader2,
  MessageSquare, Trash2, Plus, Eye, EyeOff, LayoutDashboard,
  Star, Target, BookOpen, Share2, ChevronDown, Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { fetchJSON, fetchWrite, ensureArray } from '@/lib/fetch-helpers'
import PageLoadingOverlay from '@/components/admin/PageLoadingOverlay'
import RichTextEditor from '@/components/RichTextEditor'
import MediaPicker from '@/components/MediaPicker'
import { RouterProvider } from '@/lib/router'
import { PageShell } from '@/components/pages/PageShell'

/* ────────────────────────── Types ────────────────────────── */

interface PageDef {
  slug: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  type: 'settings' | 'entity' | 'custom' | 'none'
  adminPath?: string
  customPageId?: string
}

/* ────────────────────────── Page Definitions ────────────────────────── */

const SITE_PAGES: PageDef[] = [
  { slug: '/', label: 'Home', icon: Home, type: 'settings' },
  { slug: '/events', label: 'Events', icon: Calendar, type: 'entity', adminPath: '/admin/events' },
  { slug: '/foundation', label: 'Foundation', icon: Heart, type: 'settings' },
  { slug: '/team', label: 'Team', icon: Users, type: 'entity', adminPath: '/admin/team' },
  { slug: '/gallery', label: 'Gallery', icon: Image, type: 'entity', adminPath: '/admin/gallery' },
  { slug: '/artists', label: 'Artists', icon: Music, type: 'entity', adminPath: '/admin/artists' },
  { slug: '/donate', label: 'Donate', icon: DollarSign, type: 'entity', adminPath: '/admin/donations' },
  { slug: '/contact', label: 'Contact', icon: Phone, type: 'settings' },
  { slug: '/shop', label: 'Shop', icon: ShoppingBag, type: 'entity', adminPath: '/admin/products' },
  { slug: '/track-order', label: 'Track Order', icon: Truck, type: 'none' },
]

/* ────────────────────────── Helper Components ────────────────────────── */

function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={`text-gray-400 text-xs font-medium mb-2 block ${className}`}>
      {children}
    </label>
  )
}

function TextInput({
  value, onChange, placeholder, className = '',
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-smgh-green placeholder:text-gray-600 ${className}`}
    />
  )
}

function PageSidebarItem({
  page, isActive, onClick,
}: {
  page: PageDef; isActive: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
        isActive
          ? 'bg-smgh-green/10 text-smgh-green font-medium border-r-2 border-smgh-green'
          : 'text-gray-400 hover:text-white hover:bg-white/5 border-r-2 border-transparent'
      }`}
    >
      <page.icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{page.label}</span>
    </button>
  )
}

/* ── Home Section Definitions ── */
const HOME_SECTIONS = [
  { id: 'hero', label: 'Hero Banner & Text', canEditTitle: true },
  { id: 'stats', label: 'Stats Numbers', canEditTitle: true },
  { id: 'mission', label: 'Mission Cards', canEditTitle: true },
  { id: 'visionary', label: 'Visionary Message', canEditTitle: true },
  { id: 'countdown', label: 'Countdown Timer', canEditTitle: false },
  { id: 'upcoming', label: 'Upcoming Event Post', canEditTitle: true },
  { id: 'featured_event', label: 'Featured/Latest Event', canEditTitle: true },
  { id: 'testimonials', label: 'Testimonials', canEditTitle: true },
  { id: 'artists', label: 'Featured Artists', canEditTitle: true },
  { id: 'past_events', label: 'Past Events Grid', canEditTitle: true },
  { id: 'foundation_timeline', label: 'Foundation Timeline', canEditTitle: true },
  { id: 'gallery', label: 'Gallery Preview', canEditTitle: true },
  { id: 'newsletter', label: 'Newsletter & Social', canEditTitle: true },
  { id: 'foundation_cta', label: 'Foundation CTA Banner', canEditTitle: true },
]

const SOCIAL_LINKS = [
  { key: 'facebook_url', label: 'Facebook', placeholder: 'https://facebook.com/sweetmothersgh' },
  { key: 'youtube_url', label: 'YouTube', placeholder: 'https://youtube.com/@sweetmothersgh' },
  { key: 'instagram_url', label: 'Instagram', placeholder: 'https://instagram.com/sweetmothersgh' },
  { key: 'social_tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@sweetmothersgh' },
  { key: 'social_twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/sweetmothersgh' },
  { key: 'whatsapp_link', label: 'WhatsApp', placeholder: 'https://wa.link/jdnvkt' },
]

/* ────────────────────────── Edit Panel Content ────────────────────────── */

function EntityEditPanel({ page }: { page: PageDef }) {
  return (
    <div className="text-center py-10">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
        <page.icon className="w-8 h-8 text-gray-400" />
      </div>
      <h4 className="text-white font-medium mb-2">Dynamic Content</h4>
      <p className="text-gray-400 text-sm mb-6 max-w-[260px] mx-auto">
        This page displays content managed in the CMS. Open the manager to add, edit, or remove items.
      </p>
      <Link href={page.adminPath || '/admin'}>
        <Button className="bg-smgh-green text-white hover:bg-smgh-green-dark">
          Open {page.label} Manager
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </div>
  )
}

function StaticEditPanel() {
  return (
    <div className="text-center py-10">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
        <FileText className="w-8 h-8 text-gray-400" />
      </div>
      <h4 className="text-white font-medium mb-2">Static Page</h4>
      <p className="text-gray-400 text-sm max-w-[260px] mx-auto">
        This page has a fixed layout and doesn&apos;t require content editing.
      </p>
    </div>
  )
}

function CollapsibleSection({ title, subtitle, icon, isOpen, onToggle, children }: {
  title: string; subtitle: string; icon: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="border border-gray-700/50 rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.03] transition-colors">
        <div className="w-8 h-8 rounded-lg bg-smgh-green/10 flex items-center justify-center flex-shrink-0 text-smgh-green">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium">{title}</p>
          <p className="text-gray-500 text-xs truncate">{subtitle}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-3 pb-3 border-t border-gray-700/30 pt-3">
          {children}
        </div>
      )}
    </div>
  )
}

function HomeEditPanel({
  draft, setDraft,
}: {
  draft: Record<string, string>; setDraft: (fn: (p: Record<string, string>) => Record<string, string>) => void
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    visibility: true,
    hero: false,
    visionary: false,
    mission: false,
    about: false,
    foundation_cta: false,
    social: false,
  })

  const toggleSection = (key: string) => setOpenSections(p => ({ ...p, [key]: !p[key] }))

  return (
    <div className="space-y-3">
      {/* ─── SECTION VISIBILITY & TITLES ─── */}
      <CollapsibleSection title="Section Visibility & Titles" subtitle="Show/hide and rename all home sections" icon={<LayoutDashboard className="w-4 h-4" />} isOpen={openSections.visibility} onToggle={() => toggleSection('visibility')}>
        <div className="space-y-2">
          {HOME_SECTIONS.map(s => (
            <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-gray-800/50">
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={draft[`section_${s.id}_visible`] !== '0'}
                  onChange={e => setDraft(p => ({ ...p, [`section_${s.id}_visible`]: e.target.checked ? '1' : '0' }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-smgh-green"></div>
              </label>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{s.label}</p>
                {s.canEditTitle && (
                  <input
                    value={draft[`section_${s.id}_title`] || ''}
                    onChange={e => setDraft(p => ({ ...p, [`section_${s.id}_title`]: e.target.value }))}
                    placeholder={`Custom title (leave empty for default)`}
                    className="w-full mt-1 px-2 py-1 rounded bg-white/5 border border-gray-800 text-gray-300 text-xs focus:outline-none focus:border-smgh-green/50 placeholder:text-gray-600"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* ─── HERO SECTION ─── */}
      <CollapsibleSection title="Hero Section" subtitle="Main banner text and tagline" icon={<Image className="w-4 h-4" />} isOpen={openSections.hero} onToggle={() => toggleSection('hero')}>
        <div className="space-y-3">
          <div>
            <SectionLabel>Site Tagline</SectionLabel>
            <TextInput value={draft.site_tagline || ''} onChange={v => setDraft(p => ({ ...p, site_tagline: v }))} placeholder="Celebrating Mothers Since 2017" />
          </div>
          <div>
            <SectionLabel>Hero Description</SectionLabel>
            <RichTextEditor value={draft.hero_description || ''} onChange={v => setDraft(p => ({ ...p, hero_description: v }))} placeholder="Main paragraph below the Sweet Mothers Ghana title..." />
          </div>
          <div>
            <SectionLabel>Hero Slider Images</SectionLabel>
            <p className="text-gray-500 text-xs mb-2">One image URL per line</p>
            <textarea
              value={draft.hero_slider_images || ''}
              onChange={e => setDraft(p => ({ ...p, hero_slider_images: e.target.value }))}
              placeholder={'https://example.com/image1.jpg\nhttps://example.com/image2.jpg'}
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-smgh-green resize-none placeholder:text-gray-600 font-mono"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* ─── VISIONARY SECTION ─── */}
      <CollapsibleSection title="Visionary Section" subtitle="Visionary name, message and photo" icon={<Star className="w-4 h-4" />} isOpen={openSections.visionary} onToggle={() => toggleSection('visionary')}>
        <div className="space-y-3">
          <div>
            <SectionLabel>Visionary Name</SectionLabel>
            <TextInput value={draft.visionary_name || ''} onChange={v => setDraft(p => ({ ...p, visionary_name: v }))} placeholder="Minister Bobby Essuon" />
          </div>
          <div>
            <SectionLabel>Visionary Photo URL</SectionLabel>
            <MediaPicker value={draft.visionary_photo || ''} onChange={v => setDraft(p => ({ ...p, visionary_photo: v }))} label="Choose visionary photo" previewHeight="h-32" />
          </div>
          <div>
            <SectionLabel>Visionary&apos;s Message</SectionLabel>
            <RichTextEditor value={draft.visionary_message || ''} onChange={v => setDraft(p => ({ ...p, visionary_message: v }))} placeholder="The visionary's message to visitors..." />
          </div>
        </div>
      </CollapsibleSection>

      {/* ─── MISSION CARDS ─── */}
      <CollapsibleSection title="Mission Cards" subtitle="The three mission/focus area cards" icon={<Target className="w-4 h-4" />} isOpen={openSections.mission} onToggle={() => toggleSection('mission')}>
        <div className="space-y-3">
          {[1, 2, 3].map(num => (
            <div key={num} className="border border-gray-700/50 rounded-xl p-3">
              <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Mission Card {num}</span>
              <div className="mt-2">
                <TextInput value={draft[`mission_card_${num}_title`] || ''} onChange={v => setDraft(p => ({ ...p, [`mission_card_${num}_title`]: v }))} placeholder={`Card ${num} title`} className="mb-2" />
              </div>
              <RichTextEditor value={draft[`mission_card_${num}_desc`] || ''} onChange={v => setDraft(p => ({ ...p, [`mission_card_${num}_desc`]: v }))} placeholder="Card description..." minHeight="min-h-[100px]" />
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* ─── ABOUT CONTENT ─── */}
      <CollapsibleSection title="About Page Content" subtitle="Content for the About page" icon={<BookOpen className="w-4 h-4" />} isOpen={openSections.about} onToggle={() => toggleSection('about')}>
        <RichTextEditor value={draft.about_content || ''} onChange={v => setDraft(p => ({ ...p, about_content: v }))} placeholder="Write about Sweet Mothers Ghana..." />
      </CollapsibleSection>

      {/* ─── FOUNDATION CTA ─── */}
      <CollapsibleSection title="Foundation CTA Banner" subtitle="The support/donate call-to-action section" icon={<Heart className="w-4 h-4" />} isOpen={openSections.foundation_cta} onToggle={() => toggleSection('foundation_cta')}>
        <div className="space-y-3">
          <div>
            <SectionLabel>CTA Title</SectionLabel>
            <TextInput value={draft.section_foundation_cta_title || ''} onChange={v => setDraft(p => ({ ...p, section_foundation_cta_title: v }))} placeholder="Support Our Mission" />
          </div>
          <div>
            <SectionLabel>CTA Description</SectionLabel>
            <RichTextEditor value={draft.section_foundation_cta_description || ''} onChange={v => setDraft(p => ({ ...p, section_foundation_cta_description: v }))} placeholder="Description text for the foundation call-to-action..." minHeight="min-h-[150px]" />
          </div>
        </div>
      </CollapsibleSection>

      {/* ─── SOCIAL LINKS ─── */}
      <CollapsibleSection title="Social Media Links" subtitle="All social media profile URLs" icon={<Share2 className="w-4 h-4" />} isOpen={openSections.social} onToggle={() => toggleSection('social')}>
        <div className="space-y-3">
          {SOCIAL_LINKS.map(s => (
            <div key={s.key}>
              <SectionLabel>{s.label}</SectionLabel>
              <TextInput value={draft[s.key] || ''} onChange={v => setDraft(p => ({ ...p, [s.key]: v }))} placeholder={s.placeholder} />
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  )
}

function FoundationEditPanel({
  draft, setDraft,
}: {
  draft: Record<string, string>; setDraft: (fn: (p: Record<string, string>) => Record<string, string>) => void
}) {
  const [isOpen, setIsOpen] = useState(true)
  return (
    <div className="space-y-3">
      <CollapsibleSection title="Foundation Page Content" subtitle="Title, description for the foundation page" icon={<Heart className="w-4 h-4" />} isOpen={isOpen} onToggle={() => setIsOpen(v => !v)}>
        <div className="space-y-3">
          <div>
            <SectionLabel>Section Title</SectionLabel>
            <TextInput value={draft.section_foundation_title || ''} onChange={v => setDraft(p => ({ ...p, section_foundation_title: v }))} placeholder="Foundation Impact" />
          </div>
          <div>
            <SectionLabel>Foundation Description</SectionLabel>
            <RichTextEditor value={draft.foundation_description || ''} onChange={v => setDraft(p => ({ ...p, foundation_description: v }))} placeholder="Describe the SMGH Foundation..." />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  )
}

function ContactEditPanel({
  draft, setDraft, faqs, setFaqs,
}: {
  draft: Record<string, string>; setDraft: (fn: (p: Record<string, string>) => Record<string, string>) => void
  faqs: { q: string; a: string }[]; setFaqs: (fn: (p: { q: string; a: string }[]) => { q: string; a: string }[]) => void
}) {
  return (
    <div className="space-y-4">
      {/* Contact Info */}
      <div>
        <SectionLabel>Contact Phone</SectionLabel>
        <TextInput
          value={draft.contact_phone || ''}
          onChange={v => setDraft(p => ({ ...p, contact_phone: v }))}
          placeholder="+233 24 000 0000"
          className="mb-3"
        />
        <SectionLabel>Secondary Phone</SectionLabel>
        <TextInput
          value={draft.contact_phone2 || ''}
          onChange={v => setDraft(p => ({ ...p, contact_phone2: v }))}
          placeholder="+233 20 000 0000"
          className="mb-3"
        />
        <SectionLabel>Contact Email</SectionLabel>
        <TextInput
          value={draft.contact_email || ''}
          onChange={v => setDraft(p => ({ ...p, contact_email: v }))}
          placeholder="contact@sweetmothersgh.org"
          className="mb-3"
        />
        <SectionLabel>Contact Address</SectionLabel>
        <TextInput
          value={draft.contact_address || ''}
          onChange={v => setDraft(p => ({ ...p, contact_address: v }))}
          placeholder="Cape Coast, Central Region, Ghana"
          className="mb-3"
        />
        <SectionLabel>Office Hours</SectionLabel>
        <TextInput
          value={draft.contact_office_hours || ''}
          onChange={v => setDraft(p => ({ ...p, contact_office_hours: v }))}
          placeholder="Mon - Fri: 9:00 AM - 5:00 PM"
        />
      </div>

      {/* FAQs */}
      <div>
        <SectionLabel className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5" /> FAQ Items
        </SectionLabel>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-gray-700/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-xs font-medium">Question {idx + 1}</span>
                <button
                  onClick={() => setFaqs(prev => prev.filter((_, i) => i !== idx))}
                  className="text-red-400/70 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <TextInput
                value={faq.q}
                onChange={v => setFaqs(prev => prev.map((f, i) => i === idx ? { ...f, q: v } : f))}
                placeholder="Question..."
                className="mb-1.5"
              />
              <textarea
                value={faq.a}
                onChange={e => setFaqs(prev => prev.map((f, i) => i === idx ? { ...f, a: e.target.value } : f))}
                rows={2}
                placeholder="Answer..."
                className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-gray-700 text-white text-sm focus:outline-none focus:border-smgh-green resize-none placeholder:text-gray-600"
              />
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          onClick={() => setFaqs(prev => [...prev, { q: '', a: '' }])}
          className="border-gray-700 text-gray-300 hover:text-white mt-2 w-full"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add FAQ
        </Button>
      </div>
    </div>
  )
}

function CustomPageEditPanel({
  form, setForm,
}: {
  form: { title: string; slug: string; content: string; bannerImage: string; status: string }
  setForm: (fn: (p: typeof form) => typeof form) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <SectionLabel>Title</SectionLabel>
        <TextInput
          value={form.title}
          onChange={v => setForm(p => ({ ...p, title: v }))}
          placeholder="Page title"
        />
      </div>
      <div>
        <SectionLabel>URL Slug</SectionLabel>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 text-sm flex-shrink-0">/</span>
          <TextInput
            value={form.slug}
            onChange={v => setForm(p => ({ ...p, slug: v }))}
            placeholder="page-slug"
          />
        </div>
      </div>
      <div>
        <SectionLabel>Banner Image</SectionLabel>
        <MediaPicker
          value={form.bannerImage}
          onChange={url => setForm(p => ({ ...p, bannerImage: url }))}
          label=""
          previewHeight="h-28"
        />
      </div>
      <div>
        <SectionLabel>Status</SectionLabel>
        <div className="flex items-center gap-2">
          {(['published', 'draft'] as const).map(status => (
            <button
              key={status}
              onClick={() => setForm(p => ({ ...p, status }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                form.status === status
                  ? status === 'published'
                    ? 'bg-green-500/10 text-green-400 border-green-500/30'
                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                  : 'bg-white/5 text-gray-500 border-gray-700'
              }`}
            >
              {status === 'published' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <SectionLabel>Page Content</SectionLabel>
        <RichTextEditor
          value={form.content}
          onChange={html => setForm(p => ({ ...p, content: html }))}
          placeholder="Write your page content here..."
          minHeight="min-h-[250px]"
        />
      </div>
    </div>
  )
}

/* ────────────────────────── Main Site Editor ────────────────────────── */

export default function SiteEditor() {
  const [currentPage, setCurrentPage] = useState('/')
  const [customPages, setCustomPages] = useState<PageDef[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [previewKey, setPreviewKey] = useState(0)
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [faqs, setFaqs] = useState<{ q: string; a: string }[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [editingCustom, setEditingCustom] = useState<any>(null)
  const [customForm, setCustomForm] = useState({ title: '', slug: '', content: '', bannerImage: '', status: '' })
  const [customSaving, setCustomSaving] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // ── Fetch settings & custom pages ──
  useEffect(() => {
    Promise.all([
      fetchJSON('/api/settings').catch(() => ({})),
      fetchJSON('/api/custom-pages').catch(() => []),
    ]).then(([s, pages]) => {
      const sd = (s && typeof s === 'object' && !Array.isArray(s)) ? s : {}
      setSettings(sd)
      setDraft(sd)
      const cp = ensureArray(pages).map((p: any) => ({
        slug: '/' + (p.slug || ''),
        label: p.title || 'Untitled',
        icon: FileText,
        type: 'custom' as const,
        adminPath: '/admin/custom-pages',
        customPageId: p.id,
      }))
      setCustomPages(cp)
      setLoading(false)
      try {
        const parsed = JSON.parse(sd.faqs || '[]')
        if (Array.isArray(parsed)) setFaqs(parsed)
      } catch { /* ignore */ }
    }).catch(() => setLoading(false))
  }, [])

  // ── Derived state ──
  const allPages = useMemo(() => [...SITE_PAGES, ...customPages], [customPages])
  const currentIndex = useMemo(
    () => allPages.findIndex(p => p.slug === currentPage),
    [allPages, currentPage]
  )
  const pageDef = useMemo(
    () => allPages[currentIndex] || SITE_PAGES[0],
    [allPages, currentIndex]
  )

  // ── Navigate to a page ──
  const navigateTo = useCallback((slug: string) => {
    setCurrentPage(slug)
    window.location.hash = slug === '/' ? '#/' : `#${slug}`
    setTimeout(() => {
      if (previewRef.current) previewRef.current.scrollTop = 0
    }, 60)
  }, [])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) navigateTo(allPages[currentIndex - 1].slug)
  }, [currentIndex, allPages, navigateTo])

  const goNext = useCallback(() => {
    if (currentIndex < allPages.length - 1) navigateTo(allPages[currentIndex + 1].slug)
  }, [currentIndex, allPages, navigateTo])

  // ── Listen to hash changes from preview navbar ──
  useEffect(() => {
    const handler = () => {
      const raw = window.location.hash.replace(/^#\/?/, '') || '/'
      const clean = raw.split('?')[0]
      const slug = clean === '' ? '/' : '/' + clean
      if (slug !== currentPage) {
        const match = allPages.find(p => p.slug === slug)
        if (match) {
          setCurrentPage(slug)
          setTimeout(() => {
            if (previewRef.current) previewRef.current.scrollTop = 0
          }, 60)
        }
      }
    }
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [allPages, currentPage])

  // ── Open edit panel ──
  const openEdit = useCallback(async () => {
    if (pageDef.type === 'custom' && pageDef.customPageId) {
      try {
        const data = await fetchJSON(`/api/custom-pages/${pageDef.customPageId}`)
        setEditingCustom(data)
        setCustomForm({
          title: data.title || '',
          slug: data.slug || '',
          content: data.content || '',
          bannerImage: data.bannerImage || '',
          status: data.status || 'draft',
        })
      } catch {
        toast({ title: 'Failed to load page data', variant: 'destructive' })
        return
      }
    }
    setDraft({ ...settings })
    setEditOpen(true)
  }, [pageDef, settings, toast])

  // ── Save settings ──
  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const toSave = { ...draft, faqs: JSON.stringify(faqs) }
      const { ok } = await fetchWrite('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: toSave }),
      })
      if (!ok) throw new Error()
      setSettings(toSave)
      setPreviewKey(k => k + 1)
      toast({ title: 'Changes saved! Preview updated.' })
      setEditOpen(false)
    } catch {
      toast({ title: 'Failed to save changes', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ── Save custom page ──
  const handleSaveCustom = async () => {
    if (!customForm.title || !customForm.slug) {
      toast({ title: 'Title and slug are required', variant: 'destructive' })
      return
    }
    setCustomSaving(true)
    try {
      const { ok } = await fetchWrite(`/api/custom-pages/${editingCustom.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customForm),
      })
      if (!ok) throw new Error()
      toast({ title: 'Page updated!' })
      setPreviewKey(k => k + 1)
      setEditOpen(false)
    } catch {
      toast({ title: 'Failed to save page', variant: 'destructive' })
    } finally {
      setCustomSaving(false)
    }
  }

  // ── Cancel edit ──
  const cancelEdit = useCallback(() => {
    setDraft({ ...settings })
    setEditOpen(false)
  }, [settings])

  // ── Device width ──
  const deviceWidth = deviceMode === 'desktop' ? '100%' : deviceMode === 'tablet' ? '768px' : '375px'

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-green-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-4 md:-m-6 lg:-m-8">
      <PageLoadingOverlay visible={saving || customSaving} message="Saving changes..." />

      {/* ═══════════════ Page Sidebar ═══════════════ */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 0 }}
        transition={{ duration: 0.25 }}
        className="bg-[#0a0a0a] border-r border-gray-800 flex-shrink-0 overflow-hidden"
      >
        <div className="w-[240px] h-full flex flex-col">
          {/* Sidebar header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold text-sm">Pages</h2>
                <p className="text-gray-500 text-xs mt-0.5">{allPages.length} total</p>
              </div>
              <Link href="/admin">
                <button
                  className="text-gray-500 hover:text-white transition-colors"
                  title="Back to Dashboard"
                >
                  <LayoutDashboard className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>

          {/* Page list */}
          <nav className="flex-1 overflow-y-auto py-2 admin-scrollbar">
            {/* Site pages */}
            <div className="px-3 mb-2">
              <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">
                Site Pages
              </span>
            </div>
            {SITE_PAGES.map(page => (
              <PageSidebarItem
                key={page.slug}
                page={page}
                isActive={currentPage === page.slug}
                onClick={() => navigateTo(page.slug)}
              />
            ))}

            {/* Custom pages */}
            {customPages.length > 0 && (
              <>
                <div className="px-3 mt-4 mb-2">
                  <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">
                    Custom Pages
                  </span>
                </div>
                {customPages.map(page => (
                  <PageSidebarItem
                    key={page.slug}
                    page={page}
                    isActive={currentPage === page.slug}
                    onClick={() => navigateTo(page.slug)}
                  />
                ))}
              </>
            )}
          </nav>

          {/* Sidebar footer */}
          <div className="p-3 border-t border-gray-800">
            <Link href="/admin/custom-pages">
              <Button variant="ghost" size="sm" className="w-full text-gray-400 hover:text-white justify-start gap-2">
                <Plus className="w-4 h-4" /> New Custom Page
              </Button>
            </Link>
          </div>
        </div>
      </motion.aside>

      {/* ═══════════════ Main Area ═══════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Top Toolbar ── */}
        <div className="bg-[#0a0a0a] border-b border-gray-800 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Toggle sidebar */}
            <button
              onClick={() => setSidebarOpen(s => !s)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className={`w-4 h-4 transition-transform duration-200 ${sidebarOpen ? '' : 'rotate-180'}`} />
            </button>

            {/* Current page name */}
            <div className="flex items-center gap-2">
              <pageDef.icon className="w-4 h-4 text-smgh-green" />
              <h2 className="text-white font-semibold text-sm">{pageDef.label}</h2>
              <Badge
                variant="secondary"
                className="bg-white/5 text-gray-400 text-[10px] border-0 hidden sm:inline-flex"
              >
                {pageDef.type === 'custom' ? 'Custom' : pageDef.type === 'entity' ? 'Dynamic' : pageDef.type === 'none' ? 'Static' : 'Editable'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Device mode toggle */}
            <div className="hidden md:flex items-center bg-white/5 rounded-lg p-0.5">
              {([
                { mode: 'desktop' as const, Icon: Monitor },
                { mode: 'tablet' as const, Icon: Tablet },
                { mode: 'mobile' as const, Icon: Smartphone },
              ]).map(({ mode, Icon }) => (
                <button
                  key={mode}
                  onClick={() => setDeviceMode(mode)}
                  title={mode.charAt(0).toUpperCase() + mode.slice(1)}
                  className={`p-1.5 rounded-md transition-colors ${
                    deviceMode === mode ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Edit button */}
            {pageDef.type !== 'none' && (
              <Button
                onClick={openEdit}
                size="sm"
                className={`transition-all ${
                  editOpen
                    ? 'bg-white/10 text-white hover:bg-white/15'
                    : 'bg-smgh-green text-white hover:bg-smgh-green-dark'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}

            {/* Visit site */}
            <a href={`/#${pageDef.slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        </div>

        {/* ── Preview + Edit Panel ── */}
        <div className="flex-1 overflow-hidden flex">
          {/* Browser-like Preview */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Browser chrome (dots + URL bar) */}
            <div className="bg-[#1a1a1a] border-b border-gray-800/50 px-4 py-2 flex items-center gap-3 flex-shrink-0">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 bg-white/5 rounded-lg px-3 py-1.5 text-gray-500 text-xs font-mono truncate select-all">
                sweetmothersgh.org{pageDef.slug}
              </div>
            </div>

            {/* Scrollable preview container */}
            <div className="flex-1 overflow-hidden bg-gray-200/80 flex justify-center">
              <div
                ref={previewRef}
                className="bg-white shadow-2xl overflow-y-auto overflow-x-hidden transition-all duration-300 h-full"
                style={{ width: deviceWidth, maxWidth: '100%' }}
              >
                <RouterProvider key={previewKey}>
                  <PageShell />
                </RouterProvider>
              </div>
            </div>
          </div>

          {/* ── Edit Panel (slide-over) ── */}
          <AnimatePresence>
            {editOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 420, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="bg-[#0a0a0a] border-l border-gray-800 overflow-hidden flex-shrink-0"
              >
                <div className="w-[420px] h-full flex flex-col">
                  {/* Edit header */}
                  <div className="p-4 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
                    <div>
                      <h3 className="text-white font-semibold text-sm">Edit: {pageDef.label}</h3>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {pageDef.type === 'entity'
                          ? 'Manage dynamic content'
                          : pageDef.type === 'custom'
                            ? 'Custom page settings'
                            : pageDef.type === 'none'
                              ? 'No editable content'
                              : 'Edit page content'}
                      </p>
                    </div>
                    <button
                      onClick={cancelEdit}
                      className="text-gray-400 hover:text-white transition-colors p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Edit content */}
                  <div className="flex-1 overflow-y-auto p-4 admin-scrollbar">
                    {pageDef.type === 'entity' && <EntityEditPanel page={pageDef} />}
                    {pageDef.type === 'none' && <StaticEditPanel />}
                    {pageDef.type === 'settings' && pageDef.slug === '/' && (
                      <HomeEditPanel draft={draft} setDraft={setDraft} />
                    )}
                    {pageDef.type === 'settings' && pageDef.slug === '/foundation' && (
                      <FoundationEditPanel draft={draft} setDraft={setDraft} />
                    )}
                    {pageDef.type === 'settings' && pageDef.slug === '/contact' && (
                      <ContactEditPanel draft={draft} setDraft={setDraft} faqs={faqs} setFaqs={setFaqs} />
                    )}
                    {pageDef.type === 'custom' && editingCustom && (
                      <CustomPageEditPanel form={customForm} setForm={setCustomForm} />
                    )}
                  </div>

                  {/* Edit footer with save/cancel */}
                  {(pageDef.type === 'settings' || pageDef.type === 'custom') && (
                    <div className="p-4 border-t border-gray-800 flex items-center gap-2 flex-shrink-0">
                      <Button
                        onClick={pageDef.type === 'custom' ? handleSaveCustom : handleSaveSettings}
                        disabled={saving || customSaving}
                        variant="success"
                        className="flex-1"
                      >
                        {saving || customSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={cancelEdit}
                        className="border-gray-700 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Bottom Navigation Bar ── */}
        <div className="bg-[#0a0a0a] border-t border-gray-800 px-4 py-2 flex items-center justify-between flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={goPrev}
            disabled={currentIndex <= 0}
            className="text-gray-400 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
          </Button>

          <div className="flex items-center gap-2">
            {/* Page indicator dots */}
            <div className="hidden sm:flex items-center gap-1">
              {allPages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => navigateTo(allPages[idx].slug)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'bg-smgh-green w-4'
                      : 'bg-gray-600 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-500 text-xs font-medium ml-2">
              {currentIndex + 1} / {allPages.length}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={goNext}
            disabled={currentIndex >= allPages.length - 1}
            className="text-gray-400 hover:text-white disabled:opacity-30"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
