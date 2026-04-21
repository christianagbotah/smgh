'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Music, Star } from 'lucide-react'

interface Artist {
  id: string
  name: string
  location: string | null
  bio: string | null
  image: string | null
  featured: boolean
}

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/artists')
      .then(r => r.json())
      .then(data => { setArtists(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const featured = artists.filter(a => a.featured)
  const all = artists

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Hero */}
      <section className="relative bg-smgh-dark py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-smgh-green-dark/30 via-smgh-dark to-smgh-red-dark/10" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/70 text-sm mb-6">
            <Music className="w-4 h-4 text-smgh-gold" /> Artists Hub
          </motion.div>
          <motion.h1 variants={item} className="text-4xl md:text-5xl font-bold text-white mb-6">
            Featured Gospel Artists
          </motion.h1>
          <motion.p variants={item} className="text-gray-400 text-lg max-w-2xl mx-auto">
            Anointed men and women of God who have graced the SMGH stage with their gifts
          </motion.p>
        </div>
      </section>

      {/* Featured Artists */}
      {featured.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div variants={item} className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                <Star className="w-6 h-6 text-smgh-gold" /> Featured Artists
              </h2>
              <p className="text-gray-600">Regular features at SMGH worship nights</p>
              <div className="w-16 h-1 bg-smgh-gold mx-auto rounded-full mt-4" />
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featured.map(artist => (
                <motion.div key={artist.id} variants={item} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-smgh-green-dark to-smgh-dark">
                    <img
                      src={artist.image || `https://picsum.photos/seed/${artist.id}/400/400`}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 bg-smgh-gold text-black text-xs font-bold rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" /> Featured
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 text-xl mb-2">{artist.name}</h3>
                    {artist.location && (
                      <p className="text-gray-500 text-sm flex items-center gap-1 mb-4">
                        <MapPin className="w-3 h-3" />{artist.location}
                      </p>
                    )}
                    {artist.bio && <p className="text-gray-600 text-sm leading-relaxed">{artist.bio}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Artists */}
      {all.length > featured.length && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <motion.div variants={item} className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">All Artists</h2>
              <p className="text-gray-600">Every artist who has ministered at SMGH</p>
              <div className="w-16 h-1 bg-smgh-green mx-auto rounded-full mt-4" />
            </motion.div>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {all.filter(a => !a.featured).map(artist => (
                <motion.div key={artist.id} variants={item} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <img
                    src={artist.image || `https://picsum.photos/seed/${artist.id}/200/200`}
                    alt={artist.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-4 ring-3 ring-smgh-green/10"
                  />
                  <h3 className="font-bold text-gray-900">{artist.name}</h3>
                  {artist.location && <p className="text-gray-500 text-sm flex items-center justify-center gap-1 mt-1"><MapPin className="w-3 h-3" />{artist.location}</p>}
                  {artist.bio && <p className="text-gray-600 text-xs mt-3 line-clamp-2">{artist.bio}</p>}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {loading && (
        <div className="py-20 flex justify-center">
          <div className="animate-pulse text-gray-400">Loading artists...</div>
        </div>
      )}
    </motion.div>
  )
}
