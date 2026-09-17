import type { CategoryId, Product, ProductInput } from '@/types/product'
import { mockProducts } from '@/data/products'
import { categories } from '@/data/categories'
import { storageKeys } from '@/config/site'
import { idbGet, idbSet } from '@/lib/idb'
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
  /** Replaces the whole catalogue (backup import). Rejects with an Arabic message when storage cannot hold it. */
  replaceAll(products: Product[]): Promise<void>
}

/* ------------------------------------------------------------------ */
/* Mock implementation: seeds from demo data, persists to IndexedDB    */
/* (uploaded product photos are data URLs, too large for localStorage) */
/* ------------------------------------------------------------------ */

const CATEGORY_IDS = new Set<string>(categories.map((c) => c.id))
const SAVE_ERROR = 'تعذّر حفظ المنتج في هذا المتصفح. تأكدي من السماح بتخزين بيانات الموقع وتوفر مساحة كافية.'

const nonEmpty = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() !== '' ? v : undefined)

/** Validates one stored record; returns null for anything the UI could not render safely. */
export function sanitizeProduct(raw: unknown): Product | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || r.id.trim() === '') return null
  if (typeof r.name !== 'string' || typeof r.image !== 'string') return null
  if (typeof r.price !== 'number' || !Number.isFinite(r.price) || r.price < 0) return null
  if (typeof r.category !== 'string' || !CATEGORY_IDS.has(r.category)) return null
  const images = Array.isArray(r.images)
    ? Array.from(new Set(r.images.filter((u): u is string => typeof u === 'string' && u.trim() !== '')))
    : []
  const flowersCount =
    typeof r.flowersCount === 'number' && Number.isInteger(r.flowersCount) && r.flowersCount >= 0 ? r.flowersCount : undefined
  return {
    id: r.id,
    name: r.name,
    description: typeof r.description === 'string' ? r.description : '',
    price: r.price,
    category: r.category as CategoryId,
    image: r.image,
    images,
    available: r.available !== false,
    featured: Boolean(r.featured),
    isNew: Boolean(r.isNew),
    isCategoryCover: Boolean(r.isCategoryCover),
    flowersCount,
    color: nonEmpty(r.color),
    size: nonEmpty(r.size),
    handmade: r.handmade !== false,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : '',
  }
}

function sanitizeList(raw: unknown): Product[] | null {
  if (!Array.isArray(raw)) return null
  return raw.map(sanitizeProduct).filter((p): p is Product => p !== null)
}

/** The pre-IndexedDB store (localStorage). Read once for migration, then removed. */
function readLegacyStore(): Product[] | null {
  try {
    const raw = localStorage.getItem(storageKeys.products)
    return raw ? sanitizeList(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

/**
 * IndexedDB first; then a one-time migration of the old localStorage store;
 * then the demo seed. An empty stored array is a legitimate state (the admin
 * deleted everything) and is never replaced by the seed.
 */
async function readStore(): Promise<Product[]> {
  let stored: unknown
  let idbAvailable = true
  try {
    stored = await idbGet<unknown>(storageKeys.products)
  } catch {
    idbAvailable = false
  }
  if (stored !== undefined) {
    const list = sanitizeList(stored)
    if (list) return list
  }
  const legacy = readLegacyStore()
  if (legacy) {
    if (idbAvailable) {
      try {
        await idbSet(storageKeys.products, legacy)
        localStorage.removeItem(storageKeys.products)
      } catch {
        /* keep serving the legacy copy; the next write reports SAVE_ERROR if storage is unusable */
      }
    }
    return legacy
  }
  return structuredClone(mockProducts)
}

async function writeStore(products: Product[]): Promise<void> {
  try {
    await idbSet(storageKeys.products, products)
  } catch {
    throw new Error(SAVE_ERROR)
  }
}

const LATENCY = 350

export class MockProductRepository implements ProductRepository {
  private cache: Product[] | null = null
  private loading: Promise<Product[]> | null = null
  // Mutations are serialized so concurrent toggles never overwrite each other.
  private queue: Promise<unknown> = Promise.resolve()
  private readonly latency: number

  constructor(latency = LATENCY) {
    this.latency = latency
  }

  /** Memoized first read, so StrictMode's double effect migrates once. */
  private all(): Promise<Product[]> {
    if (this.cache) return Promise.resolve(this.cache)
    if (!this.loading) {
      this.loading = readStore()
        .then((list) => {
          this.cache = list
          return list
        })
        .finally(() => {
          this.loading = null
        })
    }
    return this.loading
  }

  /** Mutations start from storage, not the in-memory cache, so another tab's writes are not overwritten. */
  private async fresh(): Promise<Product[]> {
    this.cache = await readStore()
    return this.cache
  }

  private async persist(next: Product[]): Promise<void> {
    await writeStore(next)
    this.cache = next
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task)
    this.queue = run.catch(() => undefined)
    return run
  }

  /** Business rule: only one product per category can be its cover image. */
  private withSingleCover(list: Product[], product: Product): Product[] {
    if (!product.isCategoryCover) return list
    return list.map((p) =>
      p.id !== product.id && p.category === product.category && p.isCategoryCover ? { ...p, isCategoryCover: false } : p,
    )
  }

  async list(): Promise<Product[]> {
    await sleep(this.latency)
    return structuredClone(await this.all())
  }

  async get(id: string): Promise<Product | null> {
    await sleep(this.latency / 2)
    const found = (await this.all()).find((p) => p.id === id)
    return found ? structuredClone(found) : null
  }

  async create(input: ProductInput): Promise<Product> {
    await sleep(this.latency)
    return this.enqueue(async () => {
      const current = await this.fresh()
      const existingIds = new Set(current.map((p) => p.id))
      const base = slugify(input.name) || 'product'
      const id = existingIds.has(base) ? uid(base) : base
      const product: Product = { ...input, id, createdAt: new Date().toISOString() }
      await this.persist(this.withSingleCover([product, ...current], product))
      return structuredClone(product)
    })
  }

  async update(id: string, input: Partial<ProductInput>): Promise<Product> {
    await sleep(this.latency)
    return this.enqueue(async () => {
      const list = await this.fresh()
      const index = list.findIndex((p) => p.id === id)
      if (index === -1) throw new Error('المنتج غير موجود')
      const updated: Product = { ...list[index], ...input, id }
      const next = [...list]
      next[index] = updated
      await this.persist(this.withSingleCover(next, updated))
      return structuredClone(updated)
    })
  }

  async remove(id: string): Promise<void> {
    await sleep(this.latency)
    await this.enqueue(async () => {
      const list = await this.fresh()
      await this.persist(list.filter((p) => p.id !== id))
    })
  }

  async replaceAll(products: Product[]): Promise<void> {
    await sleep(this.latency)
    await this.enqueue(async () => {
      const seen = new Set<string>()
      const coverByCategory = new Set<string>()
      const next: Product[] = []
      for (const raw of products) {
        const p = sanitizeProduct(raw)
        if (!p || seen.has(p.id)) continue
        seen.add(p.id)
        const keepCover = p.isCategoryCover === true && !coverByCategory.has(p.category)
        if (keepCover) coverByCategory.add(p.category)
        next.push({ ...p, isCategoryCover: keepCover })
      }
      await this.persist(next)
    })
  }
}

/**
 * Swap this for a Supabase-backed repository once credentials are available.
 * The rest of the app only depends on the ProductRepository interface.
 */
export const productRepository: ProductRepository = new MockProductRepository()
