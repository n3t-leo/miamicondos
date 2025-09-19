import '@/setup-dns'

import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'
import { fileURLToPath } from 'url'

import config from '@/payload.config'
import './styles.scss'
import { Menu } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import styles from './Header.module.scss'

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.row}>
        <Link href="/" className={styles.brand}>
          <Image src="/favicon.ico" alt="Logo" width={28} height={28} className={styles.logo} />
          <span>CondoHub</span>
        </Link>
        <nav className={styles.nav} aria-label="Main Navigation">
          {/* Add shadcn nav links later */}
        </nav>
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button aria-label="Open menu" className={styles.iconButton}>
              <Menu size={20} />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className={styles.overlay} />
            <Dialog.Content className={styles.sheet}>
              <Dialog.Title className={styles.title}>Menu</Dialog.Title>
              <Link href="/" className={styles.link}>
                Home
              </Link>
              <Link href="/admin" className={styles.link}>
                Admin
              </Link>
              <Link href="/media" className={styles.link}>
                Media
              </Link>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  )
}

type ContentBlock = {
  blockType: 'content'
  title?: string | null
  content?: unknown
  cta?: { label?: string | null; url?: string | null }
  image?: { url?: string | null; alt?: string | null }
}

type PageDoc = { title?: string | null; slug?: string | null; layout?: ContentBlock[] }

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const fileURL = `vscode://file/${fileURLToPath(import.meta.url)}`

  // Try to load homepage from Settings
  const settings = await payload.findGlobal({ slug: 'settings' }).catch(() => null)
  type RelDocRef =
    | { relationTo: 'pages'; value: string }
    | { id: string }
    | string
    | null
    | undefined
  const homeRel = settings?.homePage as RelDocRef

  // If a homepage is set, fetch and render it like the slug route does
  if (homeRel && typeof homeRel === 'object' && 'id' in homeRel) {
    const pageRes = await payload.findByID({ collection: 'pages', id: homeRel.id })
    const page = pageRes as PageDoc
    return (
      <div className="home">
        <Header />
        <div className="content">
          <h1>{page.title || 'Homepage'}</h1>
          {Array.isArray(page.layout) && page.layout.length > 0
            ? page.layout.map((block, idx) => {
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
            : null}
        </div>
      </div>
    )
  }
  if (homeRel && typeof homeRel === 'object' && 'relationTo' in homeRel && 'value' in homeRel) {
    const pageRes = await payload.findByID({ collection: 'pages', id: homeRel.value })
    const page = pageRes as PageDoc
    return (
      <div className="home">
        <Header />
        <div className="content">
          <h1>{page.title || 'Homepage'}</h1>
          {Array.isArray(page.layout) && page.layout.length > 0
            ? page.layout.map((block, idx) => {
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
            : null}
        </div>
      </div>
    )
  }

  // Fallback to default welcome if no homepage is set
  return (
    <div className="home">
      <Header />
      <div className="content">
        <picture>
          <source srcSet="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg" />
          <Image
            alt="Payload Logo"
            height={65}
            src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg"
            width={65}
          />
        </picture>
        {!user && <h1>Welcome to your new project.</h1>}
        {user && <h1>Welcome back, {user.email}</h1>}
        <div className="links">
          <a
            className="admin"
            href={payloadConfig.routes.admin}
            rel="noopener noreferrer"
            target="_blank"
          >
            Go to admin panel
          </a>
          <a
            className="docs"
            href="https://payloadcms.com/docs"
            rel="noopener noreferrer"
            target="_blank"
          >
            Documentation
          </a>
        </div>
      </div>
      <div className="footer">
        <p>Update this page by editing</p>
        <a className="codeLink" href={fileURL}>
          <code>app/(frontend)/page.tsx</code>
        </a>
      </div>
    </div>
  )
}
