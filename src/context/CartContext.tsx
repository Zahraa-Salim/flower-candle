import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { CartItem, CartState } from '@/types/cart'
import type { Product } from '@/types/product'
import { storageKeys } from '@/config/site'
import { CartContext, type CartContextValue } from '@/hooks/useCart'

type CartAction =
  | { type: 'add'; product: Product; quantity: number }
  | { type: 'remove'; productId: string }
  | { type: 'setQuantity'; productId: string; quantity: number }
  | { type: 'replace'; items: CartItem[] }
  | { type: 'clear' }

export const MAX_QTY = 20

const clampQty = (n: number) => Math.min(MAX_QTY, Math.max(1, Math.trunc(n)))

function snapshot(product: Product): CartItem['product'] {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    category: product.category,
    available: product.available,
  }
}

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const existing = state.items.find((i) => i.productId === action.product.id)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === action.product.id
              ? { ...i, quantity: clampQty(i.quantity + action.quantity), product: snapshot(action.product) }
              : i,
          ),
        }
      }
      return {
        items: [
          ...state.items,
          { productId: action.product.id, quantity: clampQty(action.quantity), product: snapshot(action.product) },
        ],
      }
    }
    case 'remove':
      return { items: state.items.filter((i) => i.productId !== action.productId) }
    case 'setQuantity': {
      if (action.quantity <= 0) return { items: state.items.filter((i) => i.productId !== action.productId) }
      return {
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, quantity: clampQty(action.quantity) } : i,
        ),
      }
    }
    case 'replace':
      return { items: action.items }
    case 'clear':
      return { items: [] }
    default:
      return state
  }
}

/** Validate one stored entry; returns null for anything malformed so bad data never reaches totals. */
function sanitizeItem(raw: unknown): CartItem | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Partial<CartItem>
  const product = item.product as Partial<CartItem['product']> | undefined
  if (typeof item.productId !== 'string' || !product || typeof product !== 'object') return null
  if (typeof product.name !== 'string' || typeof product.price !== 'number' || !Number.isFinite(product.price)) {
    return null
  }
  const quantity = Number(item.quantity)
  if (!Number.isFinite(quantity) || quantity <= 0) return null
  return {
    productId: item.productId,
    quantity: clampQty(quantity),
    product: {
      id: typeof product.id === 'string' ? product.id : item.productId,
      name: product.name,
      price: product.price,
      image: typeof product.image === 'string' ? product.image : '',
      category: product.category as CartItem['product']['category'],
      available: product.available !== false,
    },
  }
}

function parseState(raw: string | null): CartState {
  if (!raw) return { items: [] }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { items?: unknown[] }).items)) {
      const seen = new Set<string>()
      const items: CartItem[] = []
      for (const entry of (parsed as { items: unknown[] }).items) {
        const item = sanitizeItem(entry)
        if (!item || seen.has(item.productId)) continue
        seen.add(item.productId)
        items.push(item)
      }
      return { items }
    }
  } catch {
    /* ignore corrupted storage */
  }
  return { items: [] }
}

function loadInitial(): CartState {
  try {
    return parseState(localStorage.getItem(storageKeys.cart))
  } catch {
    return { items: [] }
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial)

  useEffect(() => {
    try {
      localStorage.setItem(storageKeys.cart, JSON.stringify(state))
    } catch {
      /* storage unavailable */
    }
  }, [state])

  // Keep multiple tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKeys.cart) dispatch({ type: 'replace', items: parseState(e.newValue).items })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const addItem = useCallback((product: Product, quantity = 1) => dispatch({ type: 'add', product, quantity }), [])
  const removeItem = useCallback((productId: string) => dispatch({ type: 'remove', productId }), [])
  const setQuantity = useCallback(
    (productId: string, quantity: number) => dispatch({ type: 'setQuantity', productId, quantity }),
    [],
  )
  const clear = useCallback(() => dispatch({ type: 'clear' }), [])

  const value = useMemo<CartContextValue>(() => {
    const count = state.items.reduce((n, i) => n + i.quantity, 0)
    const subtotal = state.items.reduce((n, i) => n + i.quantity * i.product.price, 0)
    return {
      items: state.items,
      count,
      subtotal,
      total: subtotal,
      addItem,
      removeItem,
      setQuantity,
      clear,
      quantityOf: (id) => state.items.find((i) => i.productId === id)?.quantity ?? 0,
    }
  }, [state.items, addItem, removeItem, setQuantity, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
