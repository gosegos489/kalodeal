import type { MetadataRoute } from 'next'

const DOMAIN_URL = process.env.DOMAIN_URL

if (!DOMAIN_URL) {
  throw new Error('DOMAIN_URL is not defined')
}

const routes = [
  {
    path: '/',
    changeFrequency: 'daily',
    priority: 1
  }
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${DOMAIN_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }))
}
