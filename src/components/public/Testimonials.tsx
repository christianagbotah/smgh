'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Quote, Star } from 'lucide-react'

interface Testimonial {
  name: string
  role: string
  message: string
  image?: string
}

const testimonials: Testimonial[] = [
  {
    name: 'Agnes Mensah',
    role: 'Beneficiary, Accra',
    message: 'The SMGH Foundation has been a blessing to me and my children. When I lost my husband, I thought all was lost, but their support gave me hope and a new beginning.',
  },
  {
    name: 'Pastor Emmanuel',
    role: 'Rural Pastor, Eastern Region',
    message: 'The support from SMGH Foundation has helped my wife and me continue our ministry in our rural community. We are truly grateful for their love and generosity.',
  },
  {
    name: 'Beatrice Owusu',
    role: 'Single Mother, Kumasi',
    message: 'Through the worship nights and the foundation, I have found a community of believers who truly care. God bless Sweet Mothers Ghana for their tireless efforts.',
  },
  {
    name: 'Mary Adjei',
    role: 'Widow, Cape Coast',
    message: 'I attended the 2023 Worship Night in Cape Coast and it was a life-changing experience. The love and support I received were overwhelming. Thank you SMGH!',
  },
]

export default function Testimonials() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive(prev => (prev + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="py-20 md:py-32 relative overflow-hidden" ref={ref}>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-smgh-gold/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#101010] via-smgh-navy/10 to-[#101010]" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-smgh-gold text-sm font-semibold uppercase tracking-widest mb-4 block">
            Impact Stories
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Voices of <span className="text-gradient-gold">Gratitude</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Hear from those whose lives have been touched by the SMGH Foundation
          </p>
        </motion.div>

        {/* Testimonial Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="glass rounded-3xl p-8 md:p-12 relative overflow-hidden"
        >
          <div className="absolute top-4 left-6">
            <Quote className="w-16 h-16 text-smgh-gold/10" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            {/* Stars */}
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-smgh-gold text-smgh-gold" />
              ))}
            </div>

            {/* Message */}
            <motion.p
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-lg md:text-xl text-gray-200 leading-relaxed italic mb-8"
            >
              &ldquo;{testimonials[active].message}&rdquo;
            </motion.p>

            {/* Author */}
            <motion.div
              key={`author-${active}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="w-16 h-16 rounded-full gradient-teal mx-auto mb-3 flex items-center justify-center text-black font-bold text-xl">
                {testimonials[active].name.charAt(0)}
              </div>
              <p className="text-white font-semibold text-lg">{testimonials[active].name}</p>
              <p className="text-gray-400 text-sm">{testimonials[active].role}</p>
            </motion.div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  active === i ? 'bg-smgh-gold w-8' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
