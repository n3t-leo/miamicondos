import { NextRequest, NextResponse } from 'next/server'
import { getPayload, type CollectionSlug, type Where } from 'payload'
import config from '@payload-config'
import { BridgeSearchParams } from '@/lib/bridge/types'
import { searchProperties, bridgeUtil } from '@/lib/bridge/client'
import { mapListingDocToBridgeProperty, upsertListings } from '@/lib/bridge/persistence'

const TTL_MS_DEFAULT = 15 * 60 * 1000

function parseParams(req: NextRequest): BridgeSearchParams {
  const url = new URL(req.url)
  const qp = url.searchParams
  const arr = (v?: string | null) =>
    v
      ? v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined
  const num = (v?: string | null) => (v != null ? Number(v) : undefined)
  const p: BridgeSearchParams = {
    q: qp.get('q') || undefined,
    minPrice: num(qp.get('minPrice')),
    maxPrice: num(qp.get('maxPrice')),
    minBeds: num(qp.get('minBeds')),
    maxBeds: num(qp.get('maxBeds')),
    minBaths: num(qp.get('minBaths')),
    maxBaths: num(qp.get('maxBaths')),
    status: arr(qp.get('status')),
    hoa: {
      maxFee: num(qp.get('hoaMaxFee')),
      frequency: qp.get('hoaFrequency') || undefined,
    },
    propertyType: arr(qp.get('propertyType')),
    propertySubType: arr(qp.get('propertySubType')),
    city: qp.get('city') || undefined,
    state: qp.get('state') || undefined,
    coordinates: qp.get('near')
      ? (() => {
          const [lat, lng] = (qp.get('near') || '').split(',').map((n) => Number(n))
          const radiusMi = Number(qp.get('radius') || 0)
          if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(radiusMi)) {
            return { lat, lng, radiusMi }
          }
          return undefined
        })()
      : undefined,
    sortBy: (qp.get('sortBy') as BridgeSearchParams['sortBy']) || undefined,
    sortOrder: (qp.get('sortOrder') as 'asc' | 'desc') || undefined,
    offset: Math.max(0, Number(qp.get('offset') || 0)),
    limit: Math.min(100, Math.max(1, Number(qp.get('limit') || 20))),
  }
  return p
}

export async function GET(req: NextRequest) {
  const params = parseParams(req)
  const cacheKey = bridgeUtil.hashParams(params)
  const payload = await getPayload({ config })

  const now = Date.now()
  const ttlMs = TTL_MS_DEFAULT

  // Try DB cache-first: build a simple where clause supported by our schema
  const whereObj: Record<string, unknown> = {}
  if (params.city) whereObj['city'] = { equals: params.city }
  if (params.state) whereObj['state'] = { equals: params.state }
  if (params.status && params.status.length) whereObj['status'] = { in: params.status }
  if (typeof params.minPrice === 'number' || typeof params.maxPrice === 'number') {
    whereObj['listPrice'] = {
      ...(typeof params.minPrice === 'number' ? { greater_than_equal: params.minPrice } : {}),
      ...(typeof params.maxPrice === 'number' ? { less_than_equal: params.maxPrice } : {}),
    }
  }
  const where = whereObj as unknown as Where
  // Pagination
  const pageLimit = Math.min(100, Math.max(1, params.limit || 20))
  const pagePage = Math.floor((params.offset || 0) / pageLimit) + 1
  try {
    const sort: string[] = []
    if (params.sortBy) {
      const dir = params.sortOrder === 'asc' ? '' : '-'
      sort.push(`${dir}${params.sortBy}`)
    }
    const dbRes = await payload.find({
      collection: 'listings' as unknown as CollectionSlug,
      where,
      sort,
      limit: pageLimit,
      page: pagePage,
    })
    const docs = dbRes.docs || []
    if (docs.length) {
      const properties = docs.map((d) =>
        mapListingDocToBridgeProperty(d as unknown as Record<string, unknown>),
      )
      const totalCount = dbRes.totalDocs || properties.length
      const hasMore = dbRes.hasNextPage || false
      const nextOffset = hasMore ? (params.offset || 0) + properties.length : undefined
      return NextResponse.json({
        _source: 'db',
        cacheKey,
        now,
        ttlMs,
        properties,
        totalCount,
        hasMore,
        nextOffset,
      })
    }
  } catch {
    // ignore DB errors and fall through to Bridge
  }

  try {
    const result = await searchProperties(params)
    // upsert into Payload listings collection for cache
    try {
      const up = await upsertListings(payload, result.properties)
      // Optionally could re-query DB for normalized paging; return live result for now
      return NextResponse.json({
        _source: process.env.BRIDGE_USE_MOCK === 'true' ? 'mock' : 'bridge',
        cacheKey,
        now,
        ttlMs,
        upsert: up,
        ...result,
      })
    } catch {
      return NextResponse.json({
        _source: process.env.BRIDGE_USE_MOCK === 'true' ? 'mock' : 'bridge',
        cacheKey,
        now,
        ttlMs,
        ...result,
      })
    }
  } catch (e) {
    const err = e as { statusCode?: number; error?: string; message?: string }
    const status = err.statusCode || 500
    return NextResponse.json(
      { error: err.error || 'BridgeError', message: err.message || 'Unknown error' },
      { status },
    )
  }
}
