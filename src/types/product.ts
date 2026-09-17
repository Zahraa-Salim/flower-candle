export type CategoryId = 'bouquets' | 'roses' | 'gifts' | 'favors'

export interface Category {
  id: CategoryId
  name: string
  description: string
  image: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: CategoryId
  image: string
  images?: string[]
  available: boolean
  featured?: boolean
  isNew?: boolean
  /** This product's image is the cover of its category tile on the home page (one per category). */
  isCategoryCover?: boolean
  flowersCount?: number
  color?: string
  size?: string
  handmade?: boolean
  createdAt: string
}

/** Fields an admin can edit. Everything else is derived by the data layer. */
export type ProductInput = Omit<Product, 'id' | 'createdAt'>

export type SortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc'
export type AvailabilityFilter = 'all' | 'available' | 'unavailable'

export interface ProductFilters {
  query: string
  category: CategoryId | 'all'
  availability: AvailabilityFilter
  maxPrice: number | null
  sort: SortOption
}
