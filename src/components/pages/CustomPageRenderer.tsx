'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar } from 'lucide-react'
import { Link } from '@/lib/router'
import { Button } from '@/components/ui/button'

interface CustomPageData {
  id: string
  slug: string
  title: string
  content: string
  bannerImage: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export default function CustomPageRenderer({ slug }: { slug: string }) {
  const [page, setPage] = useState<CustomPageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/custom-pages?status=published')
      .then(r => r.json())
      .then(pages => {
        const found = pages.find((p: CustomPageData) => p.slug === slug)
        setPage(found || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-6">The page you&apos;re looking for doesn&apos;t exist.</p>
          <Link to="/">
            <Button className="bg-smgh-green hover:bg-smgh-green-dark text-white rounded-full">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Banner */}
      {page.bannerImage && (
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img src={page.bannerImage} alt={page.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-8 left-0 right-0 px-4">
            <div className="max-w-4xl mx-auto">
              <Link to="/" className="text-white/70 text-sm hover:text-white flex items-center gap-1 mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold text-white">{page.title}</h1>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          {!page.bannerImage && (
            <div className="mb-8">
              <Link to="/" className="text-smgh-green text-sm hover:underline flex items-center gap-1 mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{page.title}</h1>
            </div>
          )}

          {/* Content body */}
          <div
            className="prose prose-lg max-w-none text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />

          {/* Last updated */}
          {page.updatedAt && (
            <p className="text-gray-400 text-xs mt-12 flex items-center gap-1 pt-8 border-t border-gray-100">
              <Calendar className="w-3 h-3" /> Last updated: {new Date(page.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </div>
      </section>
    </motion.div>
  )
}
