'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Heart, Quote, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SiteSettings {
  [key: string]: string
}

export default function About() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [settings, setSettings] = useState<SiteSettings>({})

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(() => {})
  }, [])

  return (
    <section id="about" className="py-20 md:py-32 relative overflow-hidden" ref={ref}>
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-smgh-teal/30 to-transparent" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-smgh-teal/3 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Image / Visual */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
              <img
                src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800"
                alt="Mothers worshipping"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101010]/80 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full gradient-teal flex items-center justify-center">
                      <Heart className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">8+ Years</p>
                      <p className="text-gray-400 text-sm">Of Honouring Mothers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative */}
            <div className="absolute -top-4 -right-4 w-24 h-24 border-2 border-smgh-teal/20 rounded-2xl" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 border-2 border-smgh-gold/20 rounded-2xl" />
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-smgh-teal text-sm font-semibold uppercase tracking-widest mb-4 block">
              About Us
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Honouring Mothers,{' '}
              <span className="text-gradient-teal">Changing Lives</span>
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              {settings.about_content || 'Sweet Mothers Ghana (SMGH) is a faith-based organization dedicated to honouring and supporting mothers, especially single mothers, widows, and the less privileged. Founded by Minister Bobby Essuon, SMGH organizes annual worship night programs that bring together communities to celebrate and appreciate mothers for their invaluable contributions to society and family life.'}
            </p>

            {/* Visioneer's Message */}
            <div className="glass rounded-2xl p-6 relative mb-8">
              <Quote className="absolute top-4 left-4 w-8 h-8 text-smgh-teal/20" />
              <div className="pl-8">
                <p className="text-smgh-gold text-xs font-semibold uppercase tracking-wider mb-2">
                  Visionary&apos;s Message
                </p>
                <p className="text-gray-300 text-sm leading-relaxed italic">
                  &ldquo;{settings.visionary_message?.substring(0, 250) || 'The love of God has led us to show that same Love, Care and Appreciation to our dear mothers and to encourage them to keep up with the task God has entrusted into their hands.'}&rdquo;
                </p>
                <p className="text-smgh-teal font-semibold mt-3">
                  — {settings.visionary_name || 'Minister Bobby Essuon'}
                </p>
              </div>
            </div>

            <Button
              onClick={() => document.querySelector('#foundation')?.scrollIntoView({ behavior: 'smooth' })}
              variant="outline"
              className="border-smgh-teal/50 text-smgh-teal hover:bg-smgh-teal/10"
            >
              Learn About Our Foundation
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
