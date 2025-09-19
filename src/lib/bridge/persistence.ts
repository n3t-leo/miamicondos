import type { Payload, CollectionSlug } from 'payload'
import type { BridgeProperty } from './types'

export function mapBridgeToListing(p: BridgeProperty) {
  return {
    listingId: p.listingId,
    addressLine1: p.addressLine1,
    city: p.city,
    state: p.state,
    postalCode: p.postalCode,
    location:
      p.lat != null && p.lng != null ? { type: 'Point', coordinates: [p.lng, p.lat] } : undefined,
    propertyType: p.propertyType,
    propertySubType: p.propertySubType,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    halfBaths: p.halfBaths,
    squareFootage: p.squareFootage,
    yearBuilt: p.yearBuilt,
    listPrice: p.listPrice,
    originalListPrice: p.originalListPrice,
    pricePerSquareFoot: p.pricePerSquareFoot,
    buildingName: p.buildingName,
    unitNumber: p.unitNumber,
    floor: p.floor,
    totalFloorsInBuilding: p.totalFloorsInBuilding,
    unitsInBuilding: p.unitsInBuilding,
    hoaFee: p.hoaFee,
    hoaFrequency: p.hoaFrequency,
    listingDate: p.listingDate,
    daysOnMarket: p.daysOnMarket,
    listingAgent: p.listingAgent,
    photos: (p.photos || []).map((url) => ({ url })),
    features: (p.features || []).map((value) => ({ value })),
    appliances: (p.appliances || []).map((value) => ({ value })),
    amenities: (p.amenities || []).map((value) => ({ value })),
    status: p.status,
    lastUpdated: p.lastUpdated,
    source: p.source,
  }
}

export function mapListingDocToBridgeProperty(doc: Record<string, unknown>): BridgeProperty {
  const s = (v: unknown) => (typeof v === 'string' ? v : undefined)
  const n = (v: unknown) => (typeof v === 'number' ? v : undefined)
  const loc = doc.location as { type?: string; coordinates?: [number, number] } | undefined
  const lat = loc?.coordinates?.[1]
  const lng = loc?.coordinates?.[0]
  return {
    listingId: String(doc.listingId),
    addressLine1: s((doc as Record<string, unknown>)['addressLine1']),
    city: s((doc as Record<string, unknown>)['city']),
    state: s((doc as Record<string, unknown>)['state']),
    postalCode: s((doc as Record<string, unknown>)['postalCode']),
    lat: typeof lat === 'number' ? lat : undefined,
    lng: typeof lng === 'number' ? lng : undefined,
    propertyType: s((doc as Record<string, unknown>)['propertyType']),
    propertySubType: s((doc as Record<string, unknown>)['propertySubType']),
    bedrooms: n((doc as Record<string, unknown>)['bedrooms']),
    bathrooms: n((doc as Record<string, unknown>)['bathrooms']),
    halfBaths: n((doc as Record<string, unknown>)['halfBaths']),
    squareFootage: n((doc as Record<string, unknown>)['squareFootage']),
    yearBuilt: n((doc as Record<string, unknown>)['yearBuilt']),
    listPrice: n((doc as Record<string, unknown>)['listPrice']),
    originalListPrice: n((doc as Record<string, unknown>)['originalListPrice']),
    pricePerSquareFoot: n((doc as Record<string, unknown>)['pricePerSquareFoot']),
    buildingName: s((doc as Record<string, unknown>)['buildingName']),
    unitNumber: s((doc as Record<string, unknown>)['unitNumber']),
    floor: n((doc as Record<string, unknown>)['floor']),
    totalFloorsInBuilding: n((doc as Record<string, unknown>)['totalFloorsInBuilding']),
    unitsInBuilding: n((doc as Record<string, unknown>)['unitsInBuilding']),
    hoaFee: n((doc as Record<string, unknown>)['hoaFee']),
    hoaFrequency: s((doc as Record<string, unknown>)['hoaFrequency']),
    listingDate: s((doc as Record<string, unknown>)['listingDate']),
    daysOnMarket: n((doc as Record<string, unknown>)['daysOnMarket']),
    listingAgent:
      typeof (doc as Record<string, unknown>)['listingAgent'] === 'object' &&
      (doc as Record<string, unknown>)['listingAgent'] !== null
        ? {
            id: s(
              (doc as Record<string, unknown>)['listingAgent'] as Record<string, unknown>['id'],
            ),
            name: s(
              (doc as Record<string, unknown>)['listingAgent'] as Record<string, unknown>['name'],
            ),
            email: s(
              (doc as Record<string, unknown>)['listingAgent'] as Record<string, unknown>['email'],
            ),
            phone: s(
              (doc as Record<string, unknown>)['listingAgent'] as Record<string, unknown>['phone'],
            ),
          }
        : undefined,
    photos: Array.isArray(doc.photos)
      ? (doc.photos as unknown[])
          .map((p) =>
            p && typeof p === 'object' ? (p as Record<string, unknown>)['url'] : undefined,
          )
          .filter((v): v is string => typeof v === 'string')
      : undefined,
    features: Array.isArray(doc.features)
      ? (doc.features as unknown[])
          .map((f) =>
            f && typeof f === 'object' ? (f as Record<string, unknown>)['value'] : undefined,
          )
          .filter((v): v is string => typeof v === 'string')
      : undefined,
    appliances: Array.isArray(doc.appliances)
      ? (doc.appliances as unknown[])
          .map((a) =>
            a && typeof a === 'object' ? (a as Record<string, unknown>)['value'] : undefined,
          )
          .filter((v): v is string => typeof v === 'string')
      : undefined,
    amenities: Array.isArray(doc.amenities)
      ? (doc.amenities as unknown[])
          .map((a) =>
            a && typeof a === 'object' ? (a as Record<string, unknown>)['value'] : undefined,
          )
          .filter((v): v is string => typeof v === 'string')
      : undefined,
    status: s((doc as Record<string, unknown>)['status']),
    lastUpdated: s((doc as Record<string, unknown>)['lastUpdated']),
    source: s((doc as Record<string, unknown>)['source']),
  }
}

export async function upsertListings(payload: Payload, listings: BridgeProperty[]) {
  let upserted = 0
  let updated = 0
  let unchanged = 0
  const LISTINGS = 'listings' as unknown as CollectionSlug
  for (const item of listings) {
    const data = mapBridgeToListing(item) as Record<string, unknown>
    const existing = await payload.find({
      collection: LISTINGS,
      limit: 1,
      where: { listingId: { equals: item.listingId } },
    })
    const doc = existing.docs[0]
    if (!doc) {
      await payload.create({ collection: LISTINGS, data })
      upserted++
    } else {
      // Naive compare by lastUpdated
      const prev = (doc as unknown as Record<string, unknown>)['lastUpdated'] as string | undefined
      if (item.lastUpdated && prev && item.lastUpdated <= prev) {
        unchanged++
      } else {
        await payload.update({
          collection: LISTINGS,
          id: (doc as unknown as Record<string, unknown>)['id'] as string,
          data,
        })
        updated++
      }
    }
  }
  return { upserted, updated, unchanged }
}
