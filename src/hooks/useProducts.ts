import { createContext, useContext } from 'react'
import type { Product, ProductInput } from '@/types/product'

export type LoadStatus = 'loading' | 'ready' | 'error'

export interface ProductsContextValue {
  products: Product[]
  status: LoadStatus
  error: string | null
  reload: () => Promise<void>
  getById: (id: string) => Product | undefined
  createProduct: (input: ProductInput) => Promise<Product>
  updateProduct: (id: string, input: Partial<ProductInput>) => Promise<Product>
  deleteProduct: (id: string) => Promise<void>
  /** Backup import: replaces the whole catalogue, then reloads. */
  replaceAll: (products: Product[]) => Promise<void>
}

export const ProductsContext = createContext<ProductsContextValue | null>(null)

export function useProducts() {
  const ctx = useContext(ProductsContext)
  if (!ctx) throw new Error('useProducts must be used inside <ProductsProvider>')
  return ctx
}
