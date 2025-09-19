import { NextRequest, NextResponse } from 'next/server'
import { searchProperties } from '@/lib/bridge/client'
import type { BridgeSearchParams } from '@/lib/bridge/types'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const qp = url.searchParams
  const limit = Math.min(100, Math.max(1, Number(qp.get('limit') || 20)))
  const offset = Math.max(0, Number(qp.get('offset') || 0))

  const params: BridgeSearchParams = {
    city: 'Miami',
    state: 'FL',
    propertyType: ['Condo', 'Condominium', 'Co-op'],
    status: ['Active'],
    sortBy: 'listPrice',
    sortOrder: 'desc',
    limit,
    offset,
  }

  try {
    const data = await searchProperties(params)
    return NextResponse.json({
      _source: process.env.BRIDGE_USE_MOCK === 'true' ? 'mock' : 'bridge',
      ...data,
    })
  } catch (e) {
    const err = e as { statusCode?: number; error?: string; message?: string }
    const status = err.statusCode || 500
    return NextResponse.json(
      { error: err.error || 'BridgeError', message: err.message || 'Unknown error' },
      { status },
    )
  }
}
