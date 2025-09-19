import { BridgeApiError, BridgeSearchParams, BridgeSearchResponse, BridgeProperty } from './types'
import { searchMock } from './mock.js'

const BRIDGE_BASE_URL = process.env.BRIDGE_BASE_URL || 'https://api.bridgedataoutput.com'
const BRIDGE_DATASET = process.env.BRIDGE_DATASET || ''
const BRIDGE_SERVER_TOKEN = process.env.BRIDGE_SERVER_TOKEN || ''
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 10000)
const MAX_RETRIES = Number(process.env.MAX_RETRIES || 3)
const USE_MOCK = String(process.env.BRIDGE_USE_MOCK || '').toLowerCase() === 'true'

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

function buildListingsUrl(params: URLSearchParams) {
  const base = `${BRIDGE_BASE_URL}/api/v2/${BRIDGE_DATASET}/listings`
  params.set('access_token', BRIDGE_SERVER_TOKEN)
  return `${base}?${params.toString()}`
}

function mapParamsToQuery(p: BridgeSearchParams): URLSearchParams {
  const q = new URLSearchParams()
  if (p.q) q.set('q', p.q)
  if (p.minPrice) q.set('min_price', String(p.minPrice))
  if (p.maxPrice) q.set('max_price', String(p.maxPrice))
  if (p.minBeds) q.set('min_beds', String(p.minBeds))
  if (p.maxBeds) q.set('max_beds', String(p.maxBeds))
  if (p.minBaths) q.set('min_baths', String(p.minBaths))
  if (p.maxBaths) q.set('max_baths', String(p.maxBaths))
  if (p.status?.length) q.set('status', p.status.join(','))
  if (p.hoa?.maxFee) q.set('hoa_max', String(p.hoa.maxFee))
  if (p.hoa?.frequency) q.set('hoa_freq', p.hoa.frequency)
  if (p.propertyType?.length) q.set('property_type', p.propertyType.join(','))
  if (p.propertySubType?.length) q.set('property_subtype', p.propertySubType.join(','))
  if (p.city) q.set('city', p.city)
  if (p.state) q.set('state', p.state)
  if (p.coordinates) {
    q.set('near', `${p.coordinates.lat},${p.coordinates.lng}`)
    q.set('radius', String(p.coordinates.radiusMi))
  }
  if (p.sortBy) q.set('sort_by', p.sortBy)
  if (p.sortOrder) q.set('order', p.sortOrder)
  q.set('offset', String(Math.max(0, p.offset || 0)))
  q.set('limit', String(Math.min(100, Math.max(1, p.limit || 20))))
  return q
}

type RawBridgeRecord = Record<string, unknown>

function normalizeBridgeProperty(raw: RawBridgeRecord): BridgeProperty {
  return {
    listingId: String((raw['ListingKey'] ?? raw['_id'] ?? raw['listing_id']) as string),
    addressLine1:
      (raw['UnparsedAddress'] as string) ||
      (raw['StreetNumberNumeric'] as string) ||
      (raw['Address'] as string) ||
      undefined,
    city: (raw['City'] as string) || undefined,
    state: (raw['StateOrProvince'] as string) || undefined,
    postalCode: (raw['PostalCode'] as string) || undefined,
    lat: (raw['Latitude'] as number) ?? (raw['latitude'] as number) ?? undefined,
    lng: (raw['Longitude'] as number) ?? (raw['longitude'] as number) ?? undefined,
    propertyType: (raw['PropertyType'] as string) || undefined,
    propertySubType: (raw['PropertySubType'] as string) || undefined,
    bedrooms: (raw['BedroomsTotal'] as number) ?? undefined,
    bathrooms:
      (raw['BathroomsFull'] as number) ?? (raw['BathroomsTotalInteger'] as number) ?? undefined,
    halfBaths: (raw['BathroomsHalf'] as number) ?? undefined,
    squareFootage: (raw['LivingArea'] as number) ?? (raw['SqFtTotal'] as number) ?? undefined,
    yearBuilt: (raw['YearBuilt'] as number) ?? undefined,
    listPrice: (raw['ListPrice'] as number) ?? undefined,
    originalListPrice: (raw['OriginalListPrice'] as number) ?? undefined,
    pricePerSquareFoot: (raw['PricePerSquareFoot'] as number) ?? undefined,
    buildingName: (raw['BuildingName'] as string) ?? undefined,
    unitNumber: (raw['UnitNumber'] as string) ?? undefined,
    floor: (raw['FloorNumber'] as number) ?? undefined,
    totalFloorsInBuilding: (raw['StoriesTotal'] as number) ?? undefined,
    unitsInBuilding: (raw['UnitsInBuilding'] as number) ?? undefined,
    hoaFee: (raw['AssociationFee'] as number) ?? undefined,
    hoaFrequency: (raw['AssociationFeeFrequency'] as string) ?? undefined,
    listingDate: (raw['ListingContractDate'] as string) ?? (raw['ListDate'] as string) ?? undefined,
    daysOnMarket: (raw['DaysOnMarket'] as number) ?? undefined,
    listingAgent: raw['ListAgentFullName']
      ? {
          name: raw['ListAgentFullName'] as string,
          email: (raw['ListAgentEmail'] as string) || undefined,
          phone: (raw['ListAgentDirectPhone'] as string) || undefined,
        }
      : undefined,
    photos: Array.isArray(raw['Media'])
      ? (raw['Media'] as Array<Record<string, unknown>>)
          .map((m) => (m['MediaURL'] as string) || '')
          .filter(Boolean)
      : [],
    features: Array.isArray(raw['InteriorFeatures'])
      ? (raw['InteriorFeatures'] as string[])
      : undefined,
    appliances: Array.isArray(raw['Appliances']) ? (raw['Appliances'] as string[]) : undefined,
    amenities: Array.isArray(raw['AssociationAmenities'])
      ? (raw['AssociationAmenities'] as string[])
      : undefined,
    status: ((raw['StandardStatus'] as string) || (raw['MlsStatus'] as string)) ?? undefined,
    lastUpdated:
      ((raw['ModificationTimestamp'] as string) ||
        (raw['ModificationTimestampMs'] as string) ||
        (raw['UpdatedAt'] as string)) ??
      undefined,
    source: BRIDGE_DATASET,
  }
}

async function fetchWithRetries(url: string, attempt = 1): Promise<unknown> {
  const controller = new AbortController()
  const to = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (res.status === 429 && attempt <= MAX_RETRIES) {
      const delay = Math.min(2000 * attempt, 8000)
      await sleep(delay)
      return fetchWithRetries(url, attempt + 1)
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      const err: BridgeApiError = {
        statusCode: res.status,
        error: res.statusText || 'BridgeError',
        message: body || `Request failed with status ${res.status}`,
      }
      throw err
    }
    return res.json()
  } catch (e) {
    const errObj = e as { name?: string; statusCode?: number; message?: string }
    if (errObj && errObj.name === 'AbortError') {
      const err: BridgeApiError = {
        statusCode: 408,
        error: 'Timeout',
        message: 'Request timed out',
      }
      throw err
    }
    if (typeof errObj?.statusCode === 'number') throw e as unknown as BridgeApiError
    const err: BridgeApiError = {
      statusCode: 500,
      error: 'BridgeClientError',
      message: errObj?.message || 'Unknown error',
    }
    throw err
  } finally {
    clearTimeout(to)
  }
}

function hashParams(params: BridgeSearchParams): string {
  const s = JSON.stringify(params)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return `h${(h >>> 0).toString(16)}`
}

export async function searchProperties(params: BridgeSearchParams): Promise<BridgeSearchResponse> {
  if (USE_MOCK) {
    return searchMock(params)
  }
  const q = mapParamsToQuery(params)
  const url = buildListingsUrl(q)
  const json = (await fetchWithRetries(url)) as {
    records?: RawBridgeRecord[]
    total?: number
  }
  const records = Array.isArray(json.records) ? json.records : []
  const properties: BridgeProperty[] = records.map(normalizeBridgeProperty)
  const total = typeof json.total === 'number' ? json.total : properties.length
  const limit = Number(q.get('limit') || 20)
  const offset = Number(q.get('offset') || 0)
  const hasMore = offset + properties.length < total
  const nextOffset = hasMore ? offset + limit : undefined
  return { properties, totalCount: total, hasMore, nextOffset }
}

export const bridgeUtil = { hashParams }
