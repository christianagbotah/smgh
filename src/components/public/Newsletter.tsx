'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { Mail, Send, Phone, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

export default function Newsletter() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setSettings).catch(() => {})
  }, [])

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      toast({ title: 'Please enter a valid email address', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        toast({ title: 'Successfully subscribed!', description: 'You will receive our latest updates.' })
        setEmail('')
      }
    } catch {
      toast({ title: 'Something went wrong', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-20 md:py-32 relative overflow-hidden" ref={ref}>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-smgh-teal/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#101010] via-smgh-navy/20 to-[#101010]" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="glass rounded-3xl p-8 md:p-16 relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-smgh-teal/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-smgh-gold/10 rounded-full blur-3xl" />

          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                Stay <span className="text-gradient-teal">Connected</span>
              </h2>
              <p className="text-gray-300 mb-6">
                Subscribe to our newsletter for event updates, ministry news, and inspiring stories of impact.
              </p>
              <div className="flex flex-col gap-3 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-smgh-teal" />
                  <span>{settings.contact_email || 'contact@sweetmothersgh.org'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-smgh-teal" />
                  <span>{settings.contact_phone || '024 361 8186 / 024 761 2799'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-smgh-teal" />
                  {(settings.whatsapp_link || settings.contact_phone) ? (
                    <a href={settings.whatsapp_link || `https://wa.me/${(settings.contact_phone || '').replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-smgh-teal hover:underline">
                      Chat with us on WhatsApp
                    </a>
                  ) : (
                    <a href="https://wa.link/jdnvkt" target="_blank" rel="noopener noreferrer" className="text-smgh-teal hover:underline">
                      Chat with us on WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="glass rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Send className="w-4 h-4 text-smgh-teal" />
                  Subscribe to Newsletter
                </h3>
                <div className="flex gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
                    className="flex-1 bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
                  />
                  <Button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="gradient-teal text-black font-semibold px-6"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-gray-500 text-xs mt-3">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
