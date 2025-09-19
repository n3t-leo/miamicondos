import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Page } from '@/payload-types'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]

  const payload = await getPayload({ config })

  const pages = await payload.find({
    collection: 'pages',
    depth: 0,
    limit: 1000,
    select: { slug: true, updatedAt: true },
  })

  const pageDocs = pages.docs as Array<Pick<Page, 'slug' | 'updatedAt'>>
  const origin = siteUrl.replace(/\/$/, '')

  for (const p of pageDocs) {
    const slug = typeof p.slug === 'string' ? p.slug : ''
    if (!slug) continue
    const lastModified = p.updatedAt ? new Date(p.updatedAt) : new Date()
    urls.push({
      url: `${origin}/${slug.replace(/^\//, '')}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  return urls
}
