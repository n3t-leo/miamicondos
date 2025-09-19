// src/lib/supabaseUpload.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export async function uploadImage(file: File) {
  const contentType = file.type
  const ext = contentType.split('/')[1]

  // ask server for signed upload URL
  const resp = await fetch('/api/signed-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentType, ext, folder: 'listings' }),
  })

  if (!resp.ok) {
    const { error } = await resp.json().catch(() => ({ error: 'Failed to get signed URL' }))
    throw new Error(error || 'Failed to get signed URL')
  }

  const { path, token } = (await resp.json()) as { path: string; token: string }

  const { data, error } = await supabase.storage
    .from('media')
    .uploadToSignedUrl(path, token, file, { contentType })

  if (error) throw error
  return data
}
