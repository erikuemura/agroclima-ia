import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://campoclima.com.br'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${BASE}/`,            lastModified: now, changeFrequency: 'weekly',  priority: 1 },
    { url: `${BASE}/precos`,      lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/demo`,        lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/login`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${BASE}/privacidade`, lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/termos`,      lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]
}
