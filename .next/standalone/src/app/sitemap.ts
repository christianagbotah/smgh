import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sweetmothersgh.org'

  // Hash-based routes still listed for discovery
  const routes = [
    '', '/', '/events', '/foundation', '/team', '/gallery',
    '/artists', '/donate', '/shop', '/contact', '/track-order'
  ]

  return routes.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' || route === '/donate' ? 1.0 : 0.8,
  }))
}
