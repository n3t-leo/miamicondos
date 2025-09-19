export type SortOrder = 'asc' | 'desc'

export type BridgeSearchParams = {
  q?: string
  minPrice?: number
  maxPrice?: number
  minBeds?: number
  maxBeds?: number
  minBaths?: number
  maxBaths?: number
  status?: string[]
  hoa?: {
    maxFee?: number
    frequency?: string
  }
  propertyType?: string[]
  propertySubType?: string[]
  city?: string
  state?: string
  coordinates?: { lat: number; lng: number; radiusMi: number }
  sortBy?: 'listPrice' | 'daysOnMarket' | 'listingDate' | 'updatedAt'
  sortOrder?: SortOrder
  offset?: number
  limit?: number
}

export type BridgeProperty = {
  listingId: string
  addressLine1?: string
  city?: string
  state?: string
  postalCode?: string
  lat?: number
  lng?: number
  propertyType?: string
  propertySubType?: string
  bedrooms?: number
  bathrooms?: number
  halfBaths?: number
  squareFootage?: number
  yearBuilt?: number
  listPrice?: number
  originalListPrice?: number
  pricePerSquareFoot?: number
  buildingName?: string
  unitNumber?: string
  floor?: number
  totalFloorsInBuilding?: number
  unitsInBuilding?: number
  hoaFee?: number
  hoaFrequency?: string
  listingDate?: string
  daysOnMarket?: number
  listingAgent?: { id?: string; name?: string; email?: string; phone?: string }
  photos?: string[]
  features?: string[]
  appliances?: string[]
  amenities?: string[]
  status?: string
  lastUpdated?: string
  source?: string
}

export type BridgeSearchResponse = {
  properties: BridgeProperty[]
  totalCount: number
  hasMore: boolean
  nextOffset?: number
}

export type BridgeApiError = {
  statusCode: number
  error: string
  message: string
}
