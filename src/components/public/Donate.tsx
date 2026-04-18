'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { Heart, CreditCard, Gift, DollarSign, Phone, Smartphone, Landmark, Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from '@/lib/router'

const donationAmounts = [50, 100, 200, 500, 1000, 2000]

export default function Donate() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const navigate = useNavigate()
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100)
  const [customAmount, setCustomAmount] = useState('')
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [donorPhone, setDonorPhone] = useState('')
  const [donorMessage, setDonorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setSettings).catch(() => {})
  }, [])

  const handleSubmit = async () => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount
    if (!amount || amount <= 0) {
      toast({ title: 'Please enter a valid amount', variant: 'destructive' })
      return
    }
    if (!donorName || !donorPhone) {
      toast({ title: 'Please fill in your name and phone number', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    try {
      await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: donorName,
          email: donorEmail || null,
          phone: donorPhone,
          amount,
          currency: 'GHS',
          paymentMethod: 'manual',
          message: donorMessage,
        }),
      })
      toast({ title: 'Thank you for your donation!', description: 'Our team will contact you shortly with payment details.' })
      setDonorName('')
      setDonorEmail('')
      setDonorPhone('')
      setDonorMessage('')
      setCustomAmount('')
    } catch {
      toast({ title: 'Something went wrong. Please try again.', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="donate" className="py-20 md:py-32 relative overflow-hidden" ref={ref}>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-smgh-teal/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#101010] via-smgh-navy/20 to-[#101010]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-smgh-teal/3 rounded-full blur-3xl" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-smgh-teal text-sm font-semibold uppercase tracking-widest mb-4 block">
            Support Our Cause
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            <span className="text-gradient-teal">Donate</span> to SMGH Foundation
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Your generous donation helps us support mothers, widows, and the less privileged in our communities
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left - Donation Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass rounded-2xl p-6 md:p-8"
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Heart className="w-5 h-5 text-smgh-rose" />
              Quick Donation
            </h3>

            {/* Amount Selection */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {donationAmounts.map(amount => (
                <button
                  key={amount}
                  onClick={() => { setSelectedAmount(amount); setCustomAmount('') }}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                    selectedAmount === amount && !customAmount
                      ? 'gradient-teal text-black'
                      : 'glass text-gray-300 hover:text-white hover:border-smgh-teal/30'
                  }`}
                >
                  ₵{amount}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="relative mb-6">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Custom amount (₵)"
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null) }}
                className="pl-10 bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Donor Info */}
            <div className="space-y-4 mb-6">
              <Input
                placeholder="Your Name *"
                value={donorName}
                onChange={e => setDonorName(e.target.value)}
                className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
              />
              <Input
                placeholder="Phone Number *"
                value={donorPhone}
                onChange={e => setDonorPhone(e.target.value)}
                className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
              />
              <Input
                placeholder="Email (optional)"
                type="email"
                value={donorEmail}
                onChange={e => setDonorEmail(e.target.value)}
                className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
              />
              <Input
                placeholder="Message (optional)"
                value={donorMessage}
                onChange={e => setDonorMessage(e.target.value)}
                className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full gradient-teal text-black font-semibold py-6 text-base"
            >
              {isSubmitting ? 'Processing...' : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Donate Now
                </>
              )}
            </Button>

            {/* Link to full donation page */}
            <button
              onClick={() => navigate('/donate')}
              className="w-full mt-4 flex items-center justify-center gap-2 text-smgh-teal text-sm font-medium hover:underline py-2 transition-colors"
            >
              Go to full donation page for online payment
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>

          {/* Right - Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Payment Options */}
            <div className="glass rounded-2xl p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-smgh-teal" />
                Payment Methods
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Paystack</p>
                    <p className="text-gray-400 text-xs">Mobile Money, Cards & Bank Transfer</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Hubtel</p>
                    <p className="text-gray-400 text-xs">Mobile Money, Cards & Bank Transfer</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Manual / Offline</p>
                    <p className="text-gray-400 text-xs">Contact us for direct transfer</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Supported Methods */}
            <div className="glass rounded-2xl p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-smgh-teal" />
                All Methods Supported
              </h4>
              <div className="space-y-2">
                {[
                  { label: 'Mobile Money', desc: 'MTN MoMo, Telecel Cash, AT Money', color: 'text-smgh-green' },
                  { label: 'Visa / Mastercard', desc: 'Debit and credit cards', color: 'text-blue-400' },
                  { label: 'Bank Transfer', desc: 'Direct deposit or transfer', color: 'text-purple-400' },
                ].map(method => (
                  <div key={method.label} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${method.color} bg-current`} />
                    <div>
                      <span className="text-white text-sm font-medium">{method.label}</span>
                      <span className="text-gray-500 text-xs ml-2">{method.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Impact Card */}
            <div className="glass rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-smgh-teal/10 rounded-full blur-3xl" />
              <h4 className="text-white font-semibold mb-3">Your Impact</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>₵50</span>
                  <span className="text-smgh-teal">Feeds a family for a week</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>₵200</span>
                  <span className="text-smgh-teal">Supports 2 mothers</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>₵500</span>
                  <span className="text-smgh-teal">Sponsors a program</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>₵1000+</span>
                  <span className="text-smgh-teal">Transforms lives</span>
                </div>
              </div>
            </div>

            {/* Contact */}
            <a
              href={settings.whatsapp_link || 'https://wa.link/jdnvkt'}
              target="_blank"
              rel="noopener noreferrer"
              className="glass rounded-2xl p-6 block hover:border-smgh-teal/20 transition-colors"
            >
              <h4 className="text-white font-semibold mb-2">Need Help?</h4>
              <p className="text-gray-400 text-sm">
                Contact us on WhatsApp for donation inquiries and other payment methods.
              </p>
              <p className="text-smgh-teal text-sm font-medium mt-2">
                Chat on WhatsApp →
              </p>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
