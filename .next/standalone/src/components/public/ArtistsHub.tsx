'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Music, MapPin, Star, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Artist {
  id: string
  name: string
  location: string | null
  bio: string | null
  image: string | null
  featured: boolean
}

export default function ArtistsHub() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [artists, setArtists] = useState<Artist[]>([])

  useEffect(() => {
    fetch('/api/artists')
      .then(res => res.json())
      .then(data => setArtists(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  return (
    <section id="artists" className="py-20 md:py-32 relative overflow-hidden" ref={ref}>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
      <div className="absolute top-1/3 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-4 block">
            Gospel Music
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Artists <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Hub</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Talented gospel artists available for booking at your events
          </p>
        </motion.div>

        {/* Artists Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {artists.map((artist, index) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="glass rounded-2xl overflow-hidden group hover:border-purple-500/20 transition-all duration-300"
            >
              <div className="relative h-48 bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center overflow-hidden">
                {artist.image ? (
                  <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <Music className="w-16 h-16 text-purple-400/50 mx-auto mb-2" />
                    <p className="text-purple-300/50 text-sm">Artist Photo</p>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  {artist.featured && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-smgh-gold/20 text-smgh-gold text-xs font-medium">
                      <Star className="w-3 h-3" />
                      Featured
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-1">{artist.name}</h3>
                {artist.location && (
                  <p className="flex items-center gap-1 text-gray-400 text-sm mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    {artist.location}
                  </p>
                )}
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  {artist.bio || 'Ghanaian gospel artist'}
                </p>
                <a href="https://wa.link/jdnvkt" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                    <Music className="w-4 h-4 mr-2" />
                    Book Artist
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
