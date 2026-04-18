'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Heart, Users, Gift, TrendingUp, ArrowRight, HandHeart } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SiteSettings {
  [key: string]: string
}

export default function Foundation() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [settings, setSettings] = useState<SiteSettings>({})

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(() => {})
  }, [])

  const stats = [
    { icon: Heart, value: '500+', label: 'Mothers Supported', color: 'text-smgh-rose' },
    { icon: Users, value: '50+', label: 'Rural Pastors\' Wives', color: 'text-smgh-teal' },
    { icon: Gift, value: '100+', label: 'Donations Received', color: 'text-smgh-gold' },
    { icon: TrendingUp, value: '2021', label: 'Full Operations Started', color: 'text-purple-400' },
  ]

  return (
    <section id="foundation" className="py-20 md:py-32 relative overflow-hidden" ref={ref}>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-smgh-rose/30 to-transparent" />
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-smgh-rose/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-smgh-rose text-sm font-semibold uppercase tracking-widest mb-4 block">
            Making A Difference
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            SMGH <span className="bg-gradient-to-r from-smgh-rose to-pink-400 bg-clip-text text-transparent">Foundation</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Empowering mothers and supporting families in need through love and generosity
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass rounded-2xl p-4 md:p-6 text-center hover:border-smgh-rose/20 transition-colors"
            >
              <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
              <p className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Supporting the Less Privileged
            </h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              {settings.foundation_description || 'The SMGH Foundation was established in 2017 and started full operations in 2021. We provide support including cash, food, and consumables to less privileged widows and rural pastors\' wives. Our funds are raised from organizations and individuals who share our vision of supporting mothers in need.'}
            </p>

            <div className="space-y-4 mb-8">
              {[
                'Cash and food items distribution',
                'Support for rural pastors\' wives',
                'Partnership with organizations',
                'Community impact programs',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full gradient-rose flex items-center justify-center flex-shrink-0">
                    <HandHeart className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => document.querySelector('#donate')?.scrollIntoView({ behavior: 'smooth' })}
              className="gradient-rose text-white font-semibold"
            >
              Support the Foundation
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="relative">
            <div className="rounded-2xl overflow-hidden aspect-square">
              <img
                src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800"
                alt="Foundation work"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101010]/60 to-transparent" />
            </div>
            <div className="absolute -bottom-4 -right-4 glass rounded-xl p-4">
              <p className="text-smgh-gold font-bold text-xl">Est. 2017</p>
              <p className="text-gray-400 text-xs">Founded with Love</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
