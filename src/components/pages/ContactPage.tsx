'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Send, Clock, MessageSquare, Facebook, Instagram, Youtube } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setSettings).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.message) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      toast({ title: 'Message sent successfully!', description: 'We will get back to you shortly.' })
      setForm({ name: '', phone: '', email: '', message: '' })
    } catch {
      toast({ title: 'Failed to send message', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  const defaultFaqs = [
    { q: 'When is the next SMGH worship night?', a: 'SMGH worship nights are held annually on Mother\'s Day (second Sunday in May). Follow our social media for specific dates and announcements.' },
    { q: 'How can I volunteer?', a: 'We always need volunteers for our events and outreach programs. Contact us via this form or reach out through our social media channels.' },
    { q: 'How are donations used?', a: '100% of donations go directly to supporting beneficiaries. We provide food, clothing, education, skill training, and micro-loans to widows, single mothers, and the less privileged.' },
    { q: 'Can I nominate a beneficiary?', a: 'Yes! If you know a widow, single mother, or less privileged person who needs support, please contact us with their details.' },
    { q: 'How can I perform at SMGH?', a: 'Gospel artists interested in performing at SMGH events can reach out through our contact form or social media.' },
  ]

  const faqs = (() => {
    try {
      const parsed = JSON.parse(settings.faqs || '[]')
      return Array.isArray(parsed) && parsed.length > 0 ? parsed.filter((f: any) => f.q && f.a) : defaultFaqs
    } catch { return defaultFaqs }
  })()

  const contactPhone = settings.contact_phone || ''
  const contactPhone2 = settings.contact_phone2 || ''
  const phoneLines = [
    ...contactPhone.split(/[,;\n]/).map(s => s.trim()).filter(Boolean),
    ...contactPhone2.split(/[,;\n]/).map(s => s.trim()).filter(Boolean),
  ]
  const contactEmail = settings.contact_email || 'contact@sweetmothersgh.org'
  const contactAddress = settings.contact_address || 'Cape Coast, Central Region, Ghana'

  // Extract handle from social URL
  const extractHandle = (url: string, platform: string) => {
    try {
      const u = new URL(url)
      const path = u.pathname.replace(/^\//, '').replace(/\/$/, '')
      if (platform === 'facebook') return `facebook.com/${path}`
      if (platform === 'instagram') return `@${path}`
      if (platform === 'youtube') return path || 'YouTube Channel'
      if (platform === 'twitter') return `@${path}`
      if (platform === 'tiktok') return `@${path}`
      return path
    } catch {
      return url
    }
  }

  const socialLinks = [
    { key: 'social_facebook', name: 'Facebook', platform: 'facebook', color: 'text-blue-600 bg-blue-50', Icon: Facebook },
    { key: 'social_instagram', name: 'Instagram', platform: 'instagram', color: 'text-pink-600 bg-pink-50', Icon: Instagram },
    { key: 'social_youtube', name: 'YouTube', platform: 'youtube', color: 'text-red-600 bg-red-50', Icon: Youtube },
  ].filter(s => settings[s.key])

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Hero */}
      <section className="relative bg-smgh-dark py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-smgh-green-dark/30 via-smgh-dark to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <motion.h1 variants={item} className="text-4xl md:text-5xl font-bold text-white mb-6">Get in Touch</motion.h1>
          <motion.p variants={item} className="text-gray-400 text-lg max-w-2xl mx-auto">
            We&apos;d love to hear from you. Whether you have questions, want to volunteer, or need more information about our programs.
          </motion.p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <motion.div variants={item}>
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name *</label>
                        <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name" required className="border-gray-200 focus:border-smgh-green" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Phone Number *</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+233 XX XXX XXXX" required className="border-gray-200 focus:border-smgh-green pl-10" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" className="border-gray-200 focus:border-smgh-green pl-10" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Message *</label>
                      <textarea
                        value={form.message}
                        onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                        placeholder="How can we help you?"
                        rows={5}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-smgh-green focus:outline-none focus:ring-1 focus:ring-smgh-green resize-none text-sm"
                      />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-smgh-green hover:bg-smgh-green-dark text-white py-6 rounded-xl font-semibold">
                      {loading ? 'Sending...' : <><Send className="w-4 h-4 mr-2" /> Send Message</>}
                    </Button>
                  </form>
                </div>
              </motion.div>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div variants={item} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-smgh-green" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Location</p>
                      <p className="text-gray-500 text-sm">{contactAddress}</p>
                    </div>
                  </div>
                  {phoneLines.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-smgh-green" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Phone</p>
                        {phoneLines.map((phone, idx) => (
                          <p key={idx} className="text-gray-500 text-sm">{phone}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-smgh-green" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Email</p>
                      <p className="text-gray-500 text-sm">{contactEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-smgh-green" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Office Hours</p>
                      <p className="text-gray-500 text-sm">{settings.contact_office_hours || 'Mon - Fri: 9:00 AM - 5:00 PM'}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {socialLinks.length > 0 && (
                <motion.div variants={item} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4">Follow Us</h3>
                  <div className="space-y-3">
                    {socialLinks.map(social => (
                      <a key={social.key} href={settings[social.key]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className={`w-10 h-10 rounded-xl ${social.color} flex items-center justify-center`}>
                          <social.Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{social.name}</p>
                          <p className="text-gray-500 text-xs">{extractHandle(settings[social.key], social.platform)}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <motion.div variants={item} className="text-center mb-12">
            <MessageSquare className="w-8 h-8 text-smgh-green mx-auto mb-3" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h2>
            <p className="text-gray-600">Find answers to common questions</p>
          </motion.div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <motion.div key={idx} variants={item} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  )
}
