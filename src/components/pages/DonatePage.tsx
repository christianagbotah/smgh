'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Building2, Users, Phone, Mail, MapPin,
  CheckCircle, DollarSign, Gift, ArrowRight, Repeat,
  Shield, ChevronDown, ChevronUp, Sparkles,
  CreditCard, Smartphone, Landmark, X, Loader2,
  Banknote
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

const presetAmounts = [50, 100, 200, 500, 1000, 2000, 5000]
const frequencyOptions = [
  { value: 'one-time', label: 'One-Time', icon: Gift, desc: 'Make a single donation' },
  { value: 'monthly', label: 'Monthly', icon: Repeat, desc: 'Monthly recurring gift' },
  { value: 'quarterly', label: 'Quarterly', icon: Repeat, desc: 'Every 3 months' },
  { value: 'annually', label: 'Annually', icon: Repeat, desc: 'Once a year' },
]

type PaymentProvider = 'paystack' | 'hubtel' | 'manual'
type DonorType = 'individual' | 'corporate' | 'church'

interface PaymentOption {
  id: PaymentProvider
  name: string
  desc: string
  methods: string[]
  icon: typeof CreditCard
  color: string
  bgColor: string
}

const allPaymentOptions: PaymentOption[] = [
  {
    id: 'paystack',
    name: 'Pay with Paystack',
    desc: 'Mobile Money, Visa/Mastercard & Bank Transfer via Paystack',
    methods: ['Mobile Money (MTN, Telecel, AT)', 'Visa / Mastercard', 'Bank Transfer'],
    icon: CreditCard,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  {
    id: 'hubtel',
    name: 'Pay with Hubtel',
    desc: 'Mobile Money, Visa/Mastercard & Bank Transfer via Hubtel',
    methods: ['Mobile Money (MTN, Telecel, AT)', 'Visa / Mastercard', 'Bank Transfer'],
    icon: Smartphone,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
  },
  {
    id: 'manual',
    name: 'Manual / Offline',
    desc: 'We will contact you with payment details',
    methods: ['Mobile Money transfer', 'Bank deposit/transfer', 'Cash at our office'],
    icon: Banknote,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
  },
]

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export default function DonatePage() {
  const [donorType, setDonorType] = useState<DonorType>('individual')
  const [selectedAmount, setSelectedAmount] = useState<number | null>(200)
  const [customAmount, setCustomAmount] = useState('')
  const [frequency, setFrequency] = useState('one-time')
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>('paystack')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showFaq, setShowFaq] = useState<number | null>(null)
  const [paystackLoaded, setPaystackLoaded] = useState(false)
  const [activeProvider, setActiveProvider] = useState<string | null>(null)
  const { toast } = useToast()

  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', organization: '', message: '',
  })

  const finalAmount = customAmount ? parseFloat(customAmount) : (selectedAmount || 0)

  // Fetch payment provider setting
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        const provider = data.active_payment_provider || 'paystack'
        setActiveProvider(provider)
        // Auto-select the active provider as default payment method
        if (provider === 'hubtel') {
          setPaymentProvider('hubtel')
        } else if (provider === 'paystack') {
          setPaymentProvider('paystack')
        } else {
          setPaymentProvider('paystack') // 'both' defaults to paystack
        }
      })
      .catch(() => setActiveProvider('paystack'))
  }, [])

  // Build payment options based on admin setting
  const paymentOptions = (() => {
    const manual = allPaymentOptions.find(p => p.id === 'manual')!
    if (!activeProvider) return [allPaymentOptions[0], manual]
    if (activeProvider === 'both') return [allPaymentOptions[0], allPaymentOptions[1], manual]
    const selected = allPaymentOptions.find(p => p.id === activeProvider)
    return selected ? [selected, manual] : [allPaymentOptions[0], manual]
  })()

  // Read ?mode=partner from hash
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('mode=partner') || hash.includes('type=partner')) {
      setDonorType('corporate')
    }
    // Check for payment status in URL
    if (hash.includes('status=success')) {
      toast({ title: 'Payment successful! Thank you for your donation.' })
    } else if (hash.includes('status=cancelled')) {
      toast({ title: 'Payment was cancelled.', variant: 'destructive' })
    }
  }, [])

  // Load Paystack inline JS
  useEffect(() => {
    if (paymentProvider === 'paystack' && !paystackLoaded) {
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v2/inline.js'
      script.async = true
      script.onload = () => setPaystackLoaded(true)
      document.body.appendChild(script)
    }
  }, [paymentProvider, paystackLoaded])

  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (step === 1) {
      if (!finalAmount || finalAmount <= 0) {
        toast({ title: 'Please select or enter an amount', variant: 'destructive' })
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (!form.name.trim()) {
        toast({ title: 'Please enter your name', variant: 'destructive' })
        return
      }
      if (!form.phone.trim()) {
        toast({ title: 'Please enter your phone number', variant: 'destructive' })
        return
      }
      setStep(3)
    }
  }

  const openPaystackPopup = (accessCode: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (window as any).PaystackPop?.setup({
      key: '', // Will be set by the server initialization
      access_code: accessCode,
      onClose: () => {
        toast({ title: 'Payment window closed', description: 'You can try again whenever you are ready.' })
        setLoading(false)
      },
      callback: async () => {
        toast({ title: 'Payment successful!', description: 'Thank you for your generous donation.' })
        setSubmitted(true)
        setLoading(false)
      },
    })
    handler?.openIframe()
  }

  const handleSubmit = async () => {
    setLoading(true)

    try {
      // First create the donation record
      const donationRes = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          address: form.address || null,
          amount: finalAmount,
          currency: 'GHS',
          paymentMethod: paymentProvider === 'manual' ? 'manual' : 'online',
          paymentProvider: paymentProvider === 'manual' ? null : paymentProvider,
          message: form.message || null,
          donorType,
          donationFrequency: frequency === 'one-time' ? null : frequency,
          organization: donorType !== 'individual' ? form.organization || null : null,
        }),
      })

      const donation = await donationRes.json()

      if (!donationRes.ok) {
        throw new Error(donation.error || 'Failed to create donation record')
      }

      // For manual/offline payment, we're done
      if (paymentProvider === 'manual') {
        setSubmitted(true)
        toast({
          title: donorType === 'individual' ? 'Thank you for your generous donation!' : 'Thank you for your partnership interest!',
          description: 'Our team will contact you shortly with payment details.',
        })
        setLoading(false)
        return
      }

      // For Paystack - initialize transaction and open popup
      if (paymentProvider === 'paystack') {
        const initRes = await fetch('/api/paystack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'initialize',
            amount: finalAmount,
            email: form.email,
            donationId: donation.id,
          }),
        })

        const initData = await initRes.json()

        if (initData.success && initData.authorization_url) {
          // Open Paystack payment page in a new tab
          window.open(initData.authorization_url, '_blank', 'noopener,noreferrer')
          setSubmitted(true)
          toast({
            title: 'Payment page opened!',
            description: 'Complete your payment in the new tab. Thank you!',
          })
        } else {
          throw new Error(initData.error || 'Failed to initialize Paystack payment')
        }
        setLoading(false)
        return
      }

      // For Hubtel - initialize checkout and redirect
      if (paymentProvider === 'hubtel') {
        const initRes = await fetch('/api/hubtel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'initialize',
            amount: finalAmount,
            email: form.email,
            phone: form.phone,
            donationId: donation.id,
          }),
        })

        const initData = await initRes.json()

        if (initData.success && initData.checkout_url) {
          // Open Hubtel payment page in a new tab
          window.open(initData.checkout_url, '_blank', 'noopener,noreferrer')
          setSubmitted(true)
          toast({
            title: 'Payment page opened!',
            description: 'Complete your payment in the new tab. Thank you!',
          })
        } else {
          throw new Error(initData.error || 'Failed to initialize Hubtel payment')
        }
        setLoading(false)
        return
      }
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSubmitted(false)
    setStep(1)
    setSelectedAmount(200)
    setCustomAmount('')
    setPaymentProvider(activeProvider === 'hubtel' ? 'hubtel' : 'paystack')
    setForm({ name: '', email: '', phone: '', address: '', organization: '', message: '' })
  }

  if (submitted) {
    return (
      <motion.div variants={container} initial="hidden" animate="show">
        <section className="py-32 px-4">
          <div className="max-w-lg mx-auto text-center">
            <motion.div variants={item} className="w-20 h-20 rounded-full bg-smgh-green/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-smgh-green" />
            </motion.div>
            <motion.h1 variants={item} className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {donorType === 'individual' ? 'Thank You!' : 'Partnership Received!'}
            </motion.h1>
            <motion.p variants={item} className="text-gray-600 mb-2">
              {donorType === 'individual'
                ? `Your donation of ₵${finalAmount.toLocaleString()} has been recorded.`
                : `Your ${donorType} partnership request for ₵${finalAmount.toLocaleString()} has been received.`}
            </motion.p>
            {paymentProvider !== 'manual' ? (
              <motion.p variants={item} className="text-gray-500 text-sm mb-8">
                {paymentProvider === 'paystack'
                  ? 'Please complete your payment in the Paystack tab that was opened. Your donation will be confirmed automatically.'
                  : 'Please complete your payment in the Hubtel tab that was opened. Your donation will be confirmed automatically.'}
              </motion.p>
            ) : (
              <motion.p variants={item} className="text-gray-500 text-sm mb-8">
                Our team will contact you at {form.phone || form.email} with payment details for Mobile Money, bank transfer, or cash payment.
              </motion.p>
            )}
            <motion.div variants={item} className="flex items-center justify-center gap-3">
              <Button onClick={resetForm} className="bg-smgh-green hover:bg-smgh-green-dark text-white rounded-full px-8">
                Make Another Donation
              </Button>
            </motion.div>
          </div>
        </section>
      </motion.div>
    )
  }

  const selectedPaymentOption = paymentOptions.find(p => p.id === paymentProvider)

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Hero */}
      <section className="relative bg-smgh-dark py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-smgh-green-dark/40 via-smgh-dark to-smgh-red-dark/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(220,38,38,0.1),transparent_50%)]" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/70 text-sm mb-6 backdrop-blur-sm border border-white/5">
            <Heart className="w-4 h-4 text-smgh-red" />
            {donorType === 'individual' ? 'Make a Difference' : 'Become a Partner'}
          </motion.div>
          <motion.h1 variants={item} className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            {donorType === 'individual' && <>Support Our <span className="text-gradient-green">Mission</span></>}
            {donorType === 'corporate' && <>Corporate <span className="text-gradient-green">Partnership</span></>}
            {donorType === 'church' && <>Church <span className="text-gradient-green">Partnership</span></>}
          </motion.h1>
          <motion.p variants={item} className="text-white/70 text-lg max-w-2xl mx-auto mb-8">
            {donorType === 'individual'
              ? 'Your generous donation helps us support widows, single mothers, and the less privileged across Ghana.'
              : 'Partner with SMGH Foundation to expand our reach and create lasting impact in communities across Ghana.'}
          </motion.p>

          {/* Donor Type Toggle */}
          <motion.div variants={item} className="inline-flex bg-white/10 backdrop-blur-sm rounded-2xl p-1.5 border border-white/10">
            {([
              { type: 'individual' as DonorType, label: 'Individual', icon: Heart },
              { type: 'corporate' as DonorType, label: 'Corporate', icon: Building2 },
              { type: 'church' as DonorType, label: 'Church', icon: Gift },
            ]).map(opt => (
              <button
                key={opt.type}
                onClick={() => setDonorType(opt.type)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  donorType === opt.type
                    ? 'bg-white text-smgh-dark shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <opt.icon className="w-4 h-4" />
                {opt.label}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Choose Amount' },
              { num: 2, label: 'Your Details' },
              { num: 3, label: 'Pay & Confirm' },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step >= s.num
                      ? 'bg-smgh-green text-white shadow-md shadow-smgh-green/25'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
                  </div>
                  <span className={`text-sm font-medium hidden sm:inline ${step >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 rounded-full transition-all ${step > s.num ? 'bg-smgh-green' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Content */}
      <section className="py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {/* Step 1: Amount & Frequency */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Choose Your Donation</h2>
                      <p className="text-gray-500 text-sm mb-6">Select how much you would like to contribute</p>

                      {/* Frequency Selection */}
                      <div className="mb-8">
                        <p className="text-sm font-medium text-gray-700 mb-3">Donation Frequency</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {frequencyOptions.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setFrequency(opt.value)}
                              className={`flex items-center gap-2 p-3 rounded-xl text-left transition-all ${
                                frequency === opt.value
                                  ? 'bg-smgh-green/10 border-2 border-smgh-green text-smgh-green'
                                  : 'bg-gray-50 border-2 border-transparent text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <opt.icon className="w-4 h-4 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-semibold">{opt.label}</p>
                                <p className="text-xs opacity-70 hidden sm:block">{opt.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Amount Presets */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-3">Select amount (₵)</p>
                        <div className="grid grid-cols-4 gap-2">
                          {presetAmounts.map(amt => (
                            <button
                              key={amt}
                              onClick={() => { setSelectedAmount(amt); setCustomAmount('') }}
                              className={`py-3 rounded-xl text-center font-semibold transition-all ${
                                selectedAmount === amt && !customAmount
                                  ? 'bg-smgh-green text-white shadow-md shadow-smgh-green/25 scale-[1.02]'
                                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                              }`}
                            >
                              ₵{amt.toLocaleString()}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Amount */}
                      <div className="relative mb-6">
                        <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="number"
                          placeholder="Enter custom amount"
                          value={customAmount}
                          onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null) }}
                          className="border-gray-200 focus:border-smgh-green pl-10"
                          min={1}
                        />
                      </div>

                      {/* Impact */}
                      {finalAmount > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-green-50 rounded-xl p-4 mb-6 border border-green-100"
                        >
                          <p className="text-sm font-medium text-smgh-green mb-1 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" /> Your Impact
                          </p>
                          <p className="text-gray-600 text-sm">
                            {finalAmount >= 5000
                              ? 'Fund a full outreach program reaching multiple communities across Ghana'
                              : finalAmount >= 2000
                              ? 'Sponsor skill training for 10 women and provide startup capital'
                              : finalAmount >= 1000
                              ? 'Fund skill training for 5 women and feed families for a month'
                              : finalAmount >= 500
                              ? 'Provide startup capital for 2 women entrepreneurs'
                              : finalAmount >= 200
                              ? 'Feed a family for 2 weeks and provide school supplies'
                              : 'Provide essential food items and school supplies for children'}
                          </p>
                        </motion.div>
                      )}

                      <Button onClick={handleNext} className="w-full bg-smgh-green hover:bg-smgh-green-dark text-white py-6 rounded-xl font-semibold text-lg shadow-lg shadow-smgh-green/25">
                        Continue <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Personal Information */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Your Information</h2>
                      <p className="text-gray-500 text-sm mb-6">
                        {donorType === 'individual'
                          ? 'Tell us about yourself so we can acknowledge your gift'
                          : 'Tell us about your organization so we can discuss the partnership'}
                      </p>

                      <div className="space-y-5">
                        {/* Full Name */}
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                            Full Name <span className="text-smgh-red">*</span>
                          </label>
                          <Input
                            value={form.name}
                            onChange={e => updateForm('name', e.target.value)}
                            placeholder="Enter your full name"
                            className="border-gray-200 focus:border-smgh-green"
                          />
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                            Phone Number <span className="text-smgh-red">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              type="tel"
                              inputMode="numeric"
                              value={form.phone}
                              onChange={e => updateForm('phone', e.target.value)}
                              placeholder="+233 XX XXX XXXX"
                              className="border-gray-200 focus:border-smgh-green pl-10"
                            />
                          </div>
                        </div>

                        {/* Email */}
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                            Email Address <span className="text-gray-400 font-normal text-xs">(optional)</span>
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              type="email"
                              value={form.email}
                              onChange={e => updateForm('email', e.target.value)}
                              placeholder='your@email.com (optional)'
                              className="border-gray-200 focus:border-smgh-green pl-10"
                            />
                          </div>
                        </div>

                        {/* Address */}
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Address</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              value={form.address}
                              onChange={e => updateForm('address', e.target.value)}
                              placeholder="Residential or office address"
                              className="border-gray-200 focus:border-smgh-green pl-10"
                            />
                          </div>
                        </div>

                        {/* Organization (for corporate/church) */}
                        {donorType !== 'individual' && (
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                              {donorType === 'corporate' ? 'Company / Organization Name' : 'Church Name'}{' '}
                              <span className="text-smgh-red">*</span>
                            </label>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input
                                value={form.organization}
                                onChange={e => updateForm('organization', e.target.value)}
                                placeholder={donorType === 'corporate' ? 'Enter organization name' : 'Enter church name'}
                                className="border-gray-200 focus:border-smgh-green pl-10"
                              />
                            </div>
                          </div>
                        )}

                        {/* Message */}
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                            Message <span className="text-gray-400 font-normal">(optional)</span>
                          </label>
                          <textarea
                            value={form.message}
                            onChange={e => updateForm('message', e.target.value)}
                            placeholder={
                              donorType === 'individual'
                                ? 'Any note or message with your donation'
                                : 'Tell us about your partnership goals and how you would like to support'
                            }
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-smgh-green focus:outline-none focus:ring-1 focus:ring-smgh-green resize-none text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-6">
                        <Button
                          variant="outline"
                          onClick={() => setStep(1)}
                          className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-5"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={handleNext}
                          className="flex-1 bg-smgh-green hover:bg-smgh-green-dark text-white py-5 rounded-xl font-semibold"
                        >
                          Review <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Payment Method & Submit */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Choose Payment Method</h2>
                      <p className="text-gray-500 text-sm mb-6">Select how you would like to pay</p>

                      {/* Payment Provider Selection */}
                      <div className="space-y-3 mb-8">
                        {paymentOptions.map(pm => (
                          <button
                            key={pm.id}
                            onClick={() => setPaymentProvider(pm.id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                              paymentProvider === pm.id
                                ? `${pm.bgColor} ${pm.color} shadow-sm`
                                : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              paymentProvider === pm.id ? 'bg-white shadow-sm' : 'bg-gray-100'
                            }`}>
                              <pm.icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">{pm.name}</p>
                              <p className="text-xs opacity-70 mt-0.5">{pm.desc}</p>
                            </div>
                            {paymentProvider === pm.id && (
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${pm.bgColor}`}>
                                <CheckCircle className="w-4 h-4" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Selected Payment Methods Detail */}
                      {selectedPaymentOption && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-50 rounded-2xl p-5 mb-6"
                        >
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Available payment methods with {selectedPaymentOption.name}
                          </p>
                          <div className="space-y-2">
                            {selectedPaymentOption.methods.map(method => (
                              <div key={method} className="flex items-center gap-3 text-sm text-gray-700">
                                <div className="w-2 h-2 rounded-full bg-smgh-green flex-shrink-0" />
                                {method}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Summary Card */}
                      <div className="bg-gray-50 rounded-2xl p-5 mb-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Donation Type</span>
                          <Badge className={
                            donorType === 'individual' ? 'bg-smgh-green/10 text-smgh-green border-0' :
                            donorType === 'corporate' ? 'bg-blue-50 text-blue-700 border-0' :
                            'bg-purple-50 text-purple-700 border-0'
                          }>
                            {donorType === 'individual' ? 'Individual Donation' :
                             donorType === 'corporate' ? 'Corporate Partnership' : 'Church Partnership'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Frequency</span>
                          <span className="text-sm font-medium text-gray-900 capitalize">{frequency.replace('-', ' ')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Payment</span>
                          <span className="text-sm font-medium text-gray-900 capitalize">{selectedPaymentOption?.name}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Amount</span>
                            <span className="text-2xl font-bold text-smgh-green">₵{finalAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Donor Details */}
                      <div className="space-y-3 mb-6">
                        <h3 className="font-semibold text-gray-900 text-sm">Your Details</h3>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                          <div>
                            <span className="text-gray-400 block">Name</span>
                            <span className="font-medium text-gray-900">{form.name}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Phone</span>
                            <span className="font-medium text-gray-900">{form.phone}</span>
                          </div>
                          {form.email && (
                            <div>
                              <span className="text-gray-400 block">Email</span>
                              <span className="font-medium text-gray-900">{form.email}</span>
                            </div>
                          )}
                          {donorType !== 'individual' && form.organization && (
                            <div>
                              <span className="text-gray-400 block">{donorType === 'corporate' ? 'Organization' : 'Church'}</span>
                              <span className="font-medium text-gray-900">{form.organization}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setStep(2)}
                          className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-5"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          disabled={loading}
                          className="flex-1 bg-smgh-red hover:bg-smgh-red-dark text-white py-5 rounded-xl font-semibold shadow-lg shadow-smgh-red/25"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Heart className="w-4 h-4 mr-2" />
                              {paymentProvider === 'manual' ? 'Submit Donation' : `Pay ₵${finalAmount.toLocaleString()}`}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-5">
              {/* Summary Card */}
              <motion.div variants={item} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Donation Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type</span>
                    <span className="font-medium capitalize">{donorType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Frequency</span>
                    <span className="font-medium capitalize">{frequency.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment</span>
                    <span className="font-medium capitalize">{selectedPaymentOption?.name.replace('Pay with ', '')}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Amount</span>
                      <span className="text-xl font-bold text-smgh-green">
                        {finalAmount > 0 ? `₵${finalAmount.toLocaleString()}` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Payment Methods Info */}
              <motion.div variants={item} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">We Accept</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-smgh-green/10 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-smgh-green" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-xs">Mobile Money (MoMo)</p>
                      <p className="text-gray-400 text-xs">MTN MoMo, Telecel Cash, AT Money</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-xs">Visa / Mastercard</p>
                      <p className="text-gray-400 text-xs">Debit & credit cards</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                      <Landmark className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-xs">Bank Transfer</p>
                      <p className="text-gray-400 text-xs">Direct bank deposit or transfer</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Impact List */}
              <motion.div variants={item} className="bg-smgh-green/5 rounded-2xl p-5 border border-smgh-green/10">
                <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-smgh-green" /> Your Impact
                </h3>
                <div className="space-y-2">
                  {[
                    'Food items for widows & mothers',
                    'Educational scholarships',
                    'Skill training workshops',
                    'Micro-loans for entrepreneurs',
                    'Monthly food pantry program',
                    'Free health screenings',
                  ].map(impact => (
                    <div key={impact} className="flex items-start gap-2 text-xs text-gray-700">
                      <CheckCircle className="w-3.5 h-3.5 text-smgh-green mt-0.5 flex-shrink-0" />
                      <span>{impact}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Total Raised */}
              <motion.div variants={item} className="bg-smgh-dark rounded-2xl p-5 text-white">
                <DollarSign className="w-7 h-7 text-smgh-gold mb-2" />
                <h3 className="font-bold mb-1 text-sm">Total Raised So Far</h3>
                <p className="text-2xl font-bold text-smgh-gold">₵145,000+</p>
                <p className="text-gray-400 text-xs mt-1">400+ beneficiaries across Ghana</p>
              </motion.div>

              {/* FAQ */}
              <motion.div variants={item} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Frequently Asked</h3>
                <div className="space-y-2">
                  {[
                    { q: 'How will my donation be used?', a: '100% of donations go directly to supporting beneficiaries through food distribution, skill training, educational support, and micro-loans.' },
                    { q: 'Is online payment safe?', a: 'Yes. We use Paystack and Hubtel, both PCI DSS compliant payment processors trusted across Africa. Your card details are never stored on our servers.' },
                    { q: 'Can I specify what my donation supports?', a: 'Yes! Use the message field to specify if you want your donation directed to a particular program or area of support.' },
                    { q: 'Is my donation tax-deductible?', a: 'SMGH Foundation is a registered non-profit. Contact us for official receipts for tax purposes.' },
                  ].map((faq, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setShowFaq(showFaq === i ? null : i)}
                        className="w-full flex items-center justify-between p-3 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {faq.q}
                        {showFaq === i ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      {showFaq === i && (
                        <p className="px-3 pb-3 text-xs text-gray-500 leading-relaxed">{faq.a}</p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  )
}
