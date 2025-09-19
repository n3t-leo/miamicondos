import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
// Next Image not used in this basic example

// Helper to normalize slug array to string path
function slugToPath(slugParts: string[] | undefined): string {
  const parts = Array.isArray(slugParts) ? slugParts : []
  const joined = parts.join('/')
  return joined.replace(/^\/+|\/+$/g, '')
}

type PageDoc = { slug?: string | null }

export async function generateStaticParams() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'pages', select: { slug: true }, limit: 1000 })
  return (docs as PageDoc[])
    .map((d) => (typeof d.slug === 'string' ? d.slug : ''))
    .filter(Boolean)
    .map((s: string) => ({ slug: s.split('/') }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}): Promise<Metadata> {
  const { slug: slugParts } = await params
  const slug = slugToPath(slugParts)
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    limit: 1,
    where: { slug: { equals: slug } },
  })
  const pageDoc = docs[0] as unknown as Record<string, unknown> | undefined
  if (!pageDoc) return { title: 'Not found' }
  // Prefer page meta, then fall back to settings meta, then basic
  const settings = (await payload.findGlobal({ slug: 'settings' }).catch(() => null)) as
    | (Record<string, unknown> & { meta?: Record<string, unknown> })
    | null

  const pageMeta = (pageDoc['meta'] as Record<string, unknown> | undefined) || undefined
  const settingsMeta = (settings?.meta as Record<string, unknown> | undefined) || undefined

  const pageTitleField =
    typeof pageDoc['title'] === 'string' ? (pageDoc['title'] as string) : undefined
  const metaTitle =
    (pageMeta && typeof pageMeta['title'] === 'string'
      ? (pageMeta['title'] as string)
      : undefined) ||
    (settingsMeta && typeof settingsMeta['title'] === 'string'
      ? (settingsMeta['title'] as string)
      : undefined) ||
    pageTitleField ||
    'Page'

  const metaDescription =
    (pageMeta && typeof pageMeta['description'] === 'string'
      ? (pageMeta['description'] as string)
      : undefined) ||
    (settingsMeta && typeof settingsMeta['description'] === 'string'
      ? (settingsMeta['description'] as string)
      : undefined) ||
    undefined

  return { title: metaTitle, description: metaDescription }
}

export default async function PageRoute({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug: slugParts } = await params
  const slug = slugToPath(slugParts)
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    limit: 1,
    where: { slug: { equals: slug } },
  })
  type ContentBlock = {
    blockType: 'content'
    title?: string | null
    content?: unknown
    cta?: { label?: string | null; url?: string | null }
    image?: { url?: string | null; alt?: string | null }
  }
  type PageWithLayout = { title?: string | null; layout?: ContentBlock[] }
  const page = docs[0] as PageWithLayout | undefined
  if (!page) return notFound()

  return (
    <article style={{ padding: '2rem 1rem', maxWidth: 860, margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
        {(page.title ?? slug) || 'Untitled'}
      </h1>
      {/* Render content blocks */}
      {Array.isArray(page.layout) && page.layout.length > 0 ? (
        page.layout.map((block, idx) => {
          if (block.blockType === 'content') {
            const img = block.image
            const ctaLabel = block.cta?.label
            const ctaUrl = block.cta?.url
            return (
              <section key={idx} style={{ margin: '1.5rem 0' }}>
                {block.title && (
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    {block.title}
                  </h2>
                )}
                {block.content ? (
                  <div style={{ marginBottom: '0.75rem' }}>
                    {/* Basic rich text rendering; TODO: replace with a proper renderer */}
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {typeof block.content === 'string' ? block.content : ''}
                    </div>
                  </div>
                ) : null}
                {ctaLabel && ctaUrl && (
                  <a
                    href={ctaUrl}
                    style={{
                      display: 'inline-block',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'hsl(var(--primary, 220 90% 56%))',
                      color: 'white',
                      textDecoration: 'none',
                      border: '1px solid hsl(var(--primary-foreground, 220 90% 40%))',
                    }}
                  >
                    {ctaLabel}
                  </a>
                )}
                {img?.url && (
                  <div style={{ marginTop: '0.75rem' }}>
                    {/* Using standard img for now */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.alt || ''}
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  </div>
                )}
              </section>
            )
          }
          return null
        })
      ) : (
        <p>Slug: /{slug}</p>
      )}
    </article>
  )
}
