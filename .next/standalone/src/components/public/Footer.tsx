'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/lib/router'
import { Heart, Facebook, Instagram, Youtube, Twitter, ArrowUp, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setSettings).catch(() => {})
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const siteName = settings.site_name || 'Sweet Mothers Ghana'
  const siteTagline = settings.site_tagline ||
    'Sweet Mothers Ghana (SMGH) is a faith-based organization dedicated to honouring and supporting mothers, especially single mothers, widows, and the less privileged.'
  const contactPhone = settings.contact_phone || ''
  const contactEmail = settings.contact_email || 'contact@sweetmothersgh.org'
  const contactAddress = settings.contact_address || 'Cape Coast, Central Region, Ghana'

  const contactPhone2 = settings.contact_phone2 || ''
  const phoneLines = [
    ...contactPhone.split(/[,;\n]/).map(s => s.trim()).filter(Boolean),
    ...contactPhone2.split(/[,;\n]/).map(s => s.trim()).filter(Boolean),
  ]

  const socialLinks = [
    { key: 'social_facebook', Icon: Facebook },
    { key: 'social_instagram', Icon: Instagram },
    { key: 'social_youtube', Icon: Youtube },
    { key: 'social_twitter', Icon: Twitter },
    { key: 'social_tiktok', Icon: Heart }, // TikTok icon fallback
  ].filter(link => settings[link.key])

  return (
    <footer className="bg-smgh-dark text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/images/logo/smgh-logo.png" alt={siteName} className="h-10" />
              <span className="font-bold text-lg">SM<span className="text-green-400">GH</span></span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              {siteTagline}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {socialLinks.map(({ key, Icon }) => (
                  <a key={key} href={settings[key]} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {(() => {
                try {
                  const links = JSON.parse(settings.footer_links || '[]')
                  if (Array.isArray(links) && links.length > 0) {
                    return links.map((link: {label: string, href: string}, idx: number) => (
                      <li key={idx}>
                        <Link to={link.href} className="text-gray-400 hover:text-smgh-green transition-colors text-sm">
                          {link.label}
                        </Link>
                      </li>
                    ))
                  }
                } catch {}
                // Fallback
                return [
                  { href: '/events', label: 'Events' },
                  { href: '/foundation', label: 'Foundation' },
                  { href: '/team', label: 'Our Team' },
                  { href: '/gallery', label: 'Gallery' },
                  { href: '/artists', label: 'Artists' },
                  { href: '/donate', label: 'Donate' },
                ].map(link => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-gray-400 hover:text-smgh-green transition-colors text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))
              })()}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-smgh-green mt-0.5 flex-shrink-0" />
                <p className="text-gray-400 text-sm">{contactAddress}</p>
              </div>
              {phoneLines.length > 0 && (
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-smgh-green mt-0.5 flex-shrink-0" />
                  <div>
                    {phoneLines.map((phone, idx) => (
                      <p key={idx} className="text-gray-400 text-sm">{phone}</p>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-smgh-green mt-0.5 flex-shrink-0" />
                <p className="text-gray-400 text-sm">{contactEmail}</p>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-4">Stay Updated</h3>
            <p className="text-gray-400 text-sm mb-4">Subscribe to receive updates on events and foundation activities.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.target as HTMLFormElement
                const email = (form.elements.namedItem('email') as HTMLInputElement)?.value
                if (email) {
                  fetch('/api/newsletter', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                  })
                  form.reset()
                }
              }}
              className="flex gap-2"
            >
              <input
                type="email"
                name="email"
                placeholder="Your email"
                required
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-smgh-green"
              />
              <button type="submit" className="px-4 py-2.5 rounded-lg bg-smgh-green text-white text-sm font-medium hover:bg-smgh-green-dark transition-colors">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/donate" className="text-gray-500 hover:text-smgh-red text-sm transition-colors flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" /> Donate
            </Link>
            <button onClick={scrollToTop} className="text-gray-500 hover:text-white text-sm transition-colors flex items-center gap-1">
              Back to top <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
