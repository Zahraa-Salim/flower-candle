import type { Product, ProductFilters } from '@/types/product'
import { categoryName } from '@/data/categories'
import { normalizeSearch } from './utils'

export const defaultFilters: ProductFilters = {
  query: '',
  category: 'all',
  availability: 'all',
  maxPrice: null,
  sort: 'featured',
}

export function matchesQuery(product: Product, query: string): boolean {
  const q = normalizeSearch(query)
  if (!q) return true
  const haystack = normalizeSearch(
    [product.name, product.description, categoryName(product.category), product.color ?? ''].join(' '),
  )
  return q.split(/\s+/).every((term) => haystack.includes(term))
}

export function applyFilters(products: Product[], filters: ProductFilters): Product[] {
  const list = products.filter((p) => {
    if (filters.category !== 'all' && p.category !== filters.category) return false
    if (filters.availability === 'available' && !p.available) return false
    if (filters.availability === 'unavailable' && p.available) return false
    if (filters.maxPrice !== null && p.price > filters.maxPrice) return false
    return matchesQuery(p, filters.query)
  })

  // ISO-8601 strings order lexicographically; tolerate a missing value from hand-edited storage.
  const byDate = (a: Product, b: Product) => {
    const da = a.createdAt ?? ''
    const db = b.createdAt ?? ''
    return da === db ? 0 : da < db ? 1 : -1
  }
  switch (filters.sort) {
    case 'newest':
      return list.sort(byDate)
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price)
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price)
    case 'featured':
    default:
      return list.sort((a, b) => {
        const fa = a.featured ? 1 : 0
        const fb = b.featured ? 1 : 0
        if (fa !== fb) return fb - fa
        const aa = a.available ? 1 : 0
        const ab = b.available ? 1 : 0
        if (aa !== ab) return ab - aa
        return byDate(a, b)
      })
  }
}

export function countActiveFilters(filters: ProductFilters): number {
  let n = 0
  if (filters.category !== 'all') n++
  if (filters.availability !== 'all') n++
  if (filters.maxPrice !== null) n++
  return n
}
