import type { Product } from './product'

export interface CartItem {
  productId: string
  quantity: number
  /** Snapshot so the cart still renders if a product is edited/removed later. */
  product: Pick<Product, 'id' | 'name' | 'price' | 'image' | 'category' | 'available'>
}

/**
 * A cart item reconciled against the live catalogue: `product` carries the
 * current price/availability when the product still exists, and `missing`
 * is true when it has been removed from the store.
 */
export interface ResolvedCartItem extends CartItem {
  missing: boolean
}

export interface CartState {
  items: CartItem[]
}
