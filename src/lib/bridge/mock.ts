import { BridgeSearchParams, BridgeSearchResponse, BridgeProperty } from './types'

const MOCK_DATA: BridgeProperty[] = [
  {
    listingId: 'MOCK-1001',
    addressLine1: '123 Mockingbird Ln',
    city: 'Miami',
    state: 'FL',
    postalCode: '33101',
    lat: 25.7617,
    lng: -80.1918,
    propertyType: 'Condo',
    bedrooms: 2,
    bathrooms: 2,
    squareFootage: 1100,
    yearBuilt: 2010,
    listPrice: 550000,
    buildingName: 'Mock Tower',
    unitNumber: '1203',
    floor: 12,
    totalFloorsInBuilding: 30,
    hoaFee: 650,
    hoaFrequency: 'Monthly',
    listingDate: new Date().toISOString(),
    daysOnMarket: 7,
    photos: [],
    features: ['Pool', 'Gym'],
    amenities: ['Valet', 'Doorman'],
    status: 'Active',
    lastUpdated: new Date().toISOString(),
    source: 'mock',
  },
]

export async function searchMock(params: BridgeSearchParams): Promise<BridgeSearchResponse> {
  const limit = Math.min(100, Math.max(1, params.limit || 20))
  const offset = Math.max(0, params.offset || 0)
  const filtered = MOCK_DATA // could add filtering based on params
  const slice = filtered.slice(offset, offset + limit)
  return {
    properties: slice,
    totalCount: filtered.length,
    hasMore: offset + slice.length < filtered.length,
    nextOffset: offset + slice.length < filtered.length ? offset + limit : undefined,
  }
}
