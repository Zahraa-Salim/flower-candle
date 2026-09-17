import type { Product, ProductInput } from '@/types/product'
import { mockProducts } from '@/data/products'
import { storageKeys } from '@/config/site'
import { sleep, slugify, uid } from '@/lib/utils'

/**
 * Data access contract. The UI only talks to this interface, so swapping the
 * mock implementation for a Supabase-backed one is a one-line change below.
 */
export interface ProductRepository {
  list(): Promise<Product[]>
  get(id: string): Promise<Product | null>
  create(input: ProductInput): Promise<Product>
  update(id: string, input: Partial<ProductInput>): Promise<Product>
  remove(id: string): Promise<void>
}

/* ------------------------------------------------------------------ */
/* Mock implementation: seeds from demo data, persists to localStorage */
/* ------------------------------------------------------------------ */

function readStore(): Product[] {
  try {
    const raw = localStorage.getItem(storageKeys.products)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      // An empty array is a legitimate state (admin deleted everything); only fall back when nothing was ever written.
      if (Array.isArray(parsed)) return parsed as Product[]
    }
  } catch {
    /* corrupted storage falls back to seed data */
  }
  return structuredClone(mockProducts)
}

function writeStore(products: Product[]): void {
  try {
    localStorage.setItem(storageKeys.products, JSON.stringify(products))
  } catch {
    /* quota exceeded or storage disabled: keep the in-memory copy only */
  }
}

const LATENCY = 350

export class MockProductRepository implements ProductRepository {
  private cache: Product[] | null = null

  private all(): Product[] {
    if (!this.cache) this.cache = readStore()
    return this.cache
  }

  /** Mutations start from storage, not the in-memory cache, so another tab's writes are not overwritten. */
  private fresh(): Product[] {
    this.cache = readStore()
    return this.cache
  }

  /** Business rule: only one product per category can be its cover image. */
  private withSingleCover(list: Product[], product: Product): Product[] {
    if (!product.isCategoryCover) return list
    return list.map((p) =>
      p.id !== product.id && p.category === product.category && p.isCategoryCover ? { ...p, isCategoryCover: false } : p,
    )
  }

  private persist(next: Product[]): void {
    this.cache = next
    writeStore(next)
  }

  async list(): Promise<Product[]> {
    await sleep(LATENCY)
    return structuredClone(this.all())
  }

  async get(id: string): Promise<Product | null> {
    await sleep(LATENCY / 2)
    const found = this.all().find((p) => p.id === id)
    return found ? structuredClone(found) : null
  }

  async create(input: ProductInput): Promise<Product> {
    await sleep(LATENCY)
    const current = this.fresh()
    const existingIds = new Set(current.map((p) => p.id))
    const base = slugify(input.name) || 'product'
    const id = existingIds.has(base) ? uid(base) : base
    const product: Product = { ...input, id, createdAt: new Date().toISOString() }
    this.persist(this.withSingleCover([product, ...current], product))
    return structuredClone(product)
  }

  async update(id: string, input: Partial<ProductInput>): Promise<Product> {
    await sleep(LATENCY)
    const list = this.fresh()
    const index = list.findIndex((p) => p.id === id)
    if (index === -1) throw new Error('المنتج غير موجود')
    const updated: Product = { ...list[index], ...input, id }
    const next = [...list]
    next[index] = updated
    this.persist(this.withSingleCover(next, updated))
    return structuredClone(updated)
  }

  async remove(id: string): Promise<void> {
    await sleep(LATENCY)
    this.persist(this.fresh().filter((p) => p.id !== id))
  }
}

/**
 * Swap this for a Supabase-backed repository once credentials are available.
 * The rest of the app only depends on the ProductRepository interface.
 */
export const productRepository: ProductRepository = new MockProductRepository()
