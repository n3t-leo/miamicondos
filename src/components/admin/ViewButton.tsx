'use client'

import React from 'react'
import { useField } from '@payloadcms/ui'

// Renders a "View" button in the admin that links to the frontend URL for the current page.
// It reads the `slug` field from the form state and builds a relative URL.
export function ViewButton(): React.ReactElement {
  const { value: slugValue } = useField<string>({ path: 'slug' })

  // Normalize URL: empty or '/' slug should link to homepage
  const slug = typeof slugValue === 'string' ? slugValue.trim().replace(/^\/+|\/+$/g, '') : ''
  const href = slug ? `/${slug}` : '/'

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px 10px',
          borderRadius: 6,
          background: 'var(--theme-elevation-800)',
          color: 'var(--theme-elevation-0)',
          textDecoration: 'none',
          fontSize: 14,
          lineHeight: 1,
          border: '1px solid var(--theme-elevation-600)',
        }}
      >
        View
      </a>
    </div>
  )
}

export default ViewButton
