import { createContext, useContext } from 'react'
import type { CartItem } from '@/types/cart'
import type { Product } from '@/types/product'

export interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: number
  total: number
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  clear: () => void
  quantityOf: (productId: string) => number
}

export const CartContext = createContext<CartContextValue | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
