import { NextRequest, NextResponse } from 'next/server'
import { searchProperties } from '@/lib/bridge/client'
import { getPayload } from 'payload'
import config from '@payload-config'
import { upsertListings } from '@/lib/bridge/persistence'
import type { BridgeSearchParams } from '@/lib/bridge/types'

const ADMIN_TOKEN = process.env.BRIDGE_ADMIN_TOKEN || ''

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : auth
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as Partial<BridgeSearchParams>
  const params: BridgeSearchParams = {
    limit: Math.min(100, Math.max(1, Number(body.limit || 100))),
    offset: Math.max(0, Number(body.offset || 0)),
    status: body.status || ['Active'],
    city: body.city,
    state: body.state,
    propertyType: body.propertyType,
    propertySubType: body.propertySubType,
  }

  try {
    const data = await searchProperties(params)
    const payload = await getPayload({ config })
    const up = await upsertListings(payload, data.properties)
    return NextResponse.json({ ...up, fetched: data.properties.length })
  } catch (e) {
    const err = e as { statusCode?: number; error?: string; message?: string }
    return NextResponse.json(
      { error: err.error || 'BridgeError', message: err.message || 'Unknown error' },
      { status: err.statusCode || 500 },
    )
  }
}
