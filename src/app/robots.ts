import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const isProd = process.env.NODE_ENV === 'production'

export default function robots(): MetadataRoute.Robots {
  if (!isProd) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
    }
  }

  const url = new URL(siteUrl)
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/graphql', '/graphql-playground'],
      },
    ],
    sitemap: `${url.origin}/sitemap.xml`,
    host: url.hostname,
  }
}
