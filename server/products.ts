import type pg from 'pg'
import { getPool, withTransaction, type Queryable } from './db.ts'

/** Wire shape returned to the client (matches src/types/product.ts `Product`). */
export interface ProductRow {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string
  images: string[]
  available: boolean
  featured: boolean
  isNew: boolean
  isCategoryCover: boolean
  flowersCount?: number
  color?: string
  size?: string
  handmade: boolean
  createdAt: string
}

export type ProductInput = Omit<ProductRow, 'id' | 'createdAt'>

const COLUMNS =
  'id, name, description, price::float8 as price, category, image, images, available, featured, is_new, is_category_cover, flowers_count, color, size, handmade, created_at'

interface DbRow {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string
  images: string[]
  available: boolean
  featured: boolean
  is_new: boolean
  is_category_cover: boolean
  flowers_count: number | null
  color: string | null
  size: string | null
  handmade: boolean
  created_at: Date
}

function toProduct(r: DbRow): ProductRow {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    price: r.price,
    category: r.category,
    image: r.image,
    images: r.images ?? [],
    available: r.available,
    featured: r.featured,
    isNew: r.is_new,
    isCategoryCover: r.is_category_cover,
    flowersCount: r.flowers_count ?? undefined,
    color: r.color ?? undefined,
    size: r.size ?? undefined,
    handmade: r.handmade,
    createdAt: r.created_at.toISOString(),
  }
}

export class ValidationError extends Error {}

const str = (v: unknown, max = 1000): string | null => (typeof v === 'string' && v.trim().length <= max ? v.trim() : null)

/** Validates client input; throws ValidationError with an Arabic message. */
export function parseProductInput(raw: unknown, partial = false): Partial<ProductInput> {
  if (!raw || typeof raw !== 'object') throw new ValidationError('بيانات المنتج غير صالحة.')
  const r = raw as Record<string, unknown>
  const out: Partial<ProductInput> = {}
  const has = (k: string) => Object.prototype.hasOwnProperty.call(r, k)

  if (has('name') || !partial) {
    const name = str(r.name, 80)
    if (!name || name.length < 2) throw new ValidationError('اسم المنتج مطلوب (حرفان على الأقل).')
    out.name = name
  }
  if (has('description') || !partial) {
    const description = str(r.description, 2000) ?? ''
    out.description = description
  }
  if (has('price') || !partial) {
    const price = typeof r.price === 'number' ? r.price : Number(r.price)
    if (!Number.isFinite(price) || price < 0) throw new ValidationError('السعر غير صحيح.')
    out.price = Math.round(price * 100) / 100
  }
  if (has('category') || !partial) {
    const category = str(r.category, 40)
    if (!category) throw new ValidationError('التصنيف مطلوب.')
    out.category = category
  }
  if (has('image') || !partial) {
    const image = str(r.image, 4000)
    if (!image) throw new ValidationError('الصورة الرئيسية مطلوبة.')
    out.image = image
  }
  if (has('images') || !partial) {
    const images = Array.isArray(r.images) ? r.images : []
    const clean = Array.from(new Set(images.filter((u): u is string => typeof u === 'string' && u.trim() !== '' && u.length <= 4000)))
    if (clean.length > 12) throw new ValidationError('عدد الصور الإضافية كبير جداً.')
    out.images = clean
  }
  for (const key of ['available', 'featured', 'isNew', 'isCategoryCover', 'handmade'] as const) {
    if (has(key)) out[key] = Boolean(r[key])
    else if (!partial) out[key] = key === 'available' || key === 'handmade'
  }
  if (has('flowersCount')) {
    const n = r.flowersCount
    if (n === undefined || n === null || n === '') out.flowersCount = undefined
    else if (typeof n === 'number' && Number.isInteger(n) && n >= 0) out.flowersCount = n
    else throw new ValidationError('عدد الورود يجب أن يكون رقماً صحيحاً.')
  }
  if (has('color')) out.color = str(r.color, 40) || undefined
  if (has('size')) out.size = str(r.size, 40) || undefined
  return out
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
}

export async function listProducts(db: Queryable = getPool()): Promise<ProductRow[]> {
  const { rows } = await db.query<DbRow>(`select ${COLUMNS} from products order by created_at desc, id`)
  return rows.map(toProduct)
}

export async function getProduct(id: string, db: Queryable = getPool()): Promise<ProductRow | null> {
  const { rows } = await db.query<DbRow>(`select ${COLUMNS} from products where id = $1`, [id])
  return rows[0] ? toProduct(rows[0]) : null
}

async function uniqueId(client: pg.PoolClient, name: string): Promise<string> {
  const base = slugify(name) || 'product'
  const { rows } = await client.query<{ id: string }>('select id from products where id = $1 or id like $2', [base, `${base}-%`])
  const taken = new Set(rows.map((r) => r.id))
  if (!taken.has(base)) return base
  for (let n = 2; n < 1000; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`
  return `${base}-${Date.now().toString(36)}`
}

async function clearOtherCovers(client: pg.PoolClient, category: string, keepId: string): Promise<void> {
  await client.query('update products set is_category_cover = false where category = $1 and id <> $2 and is_category_cover', [category, keepId])
}

export async function createProduct(input: ProductInput): Promise<ProductRow> {
  return withTransaction(async (client) => {
    const id = await uniqueId(client, input.name)
    if (input.isCategoryCover) await clearOtherCovers(client, input.category, id)
    const { rows } = await client.query<DbRow>(
      `insert into products (id, name, description, price, category, image, images, available, featured, is_new, is_category_cover, flowers_count, color, size, handmade)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       returning ${COLUMNS}`,
      [
        id, input.name, input.description, input.price, input.category, input.image, input.images,
        input.available, input.featured, input.isNew, input.isCategoryCover,
        input.flowersCount ?? null, input.color ?? null, input.size ?? null, input.handmade,
      ],
    )
    return toProduct(rows[0])
  })
}

export async function updateProduct(id: string, patch: Partial<ProductInput>): Promise<ProductRow | null> {
  return withTransaction(async (client) => {
    const current = await getProduct(id, client)
    if (!current) return null
    const next: ProductInput = { ...current, ...patch }
    if (next.isCategoryCover) await clearOtherCovers(client, next.category, id)
    const { rows } = await client.query<DbRow>(
      `update products set name = $2, description = $3, price = $4, category = $5, image = $6, images = $7,
         available = $8, featured = $9, is_new = $10, is_category_cover = $11, flowers_count = $12, color = $13, size = $14, handmade = $15
       where id = $1 returning ${COLUMNS}`,
      [
        id, next.name, next.description, next.price, next.category, next.image, next.images,
        next.available, next.featured, next.isNew, next.isCategoryCover,
        next.flowersCount ?? null, next.color ?? null, next.size ?? null, next.handmade,
      ],
    )
    return toProduct(rows[0])
  })
}

export async function deleteProduct(id: string): Promise<boolean> {
  const { rowCount } = await getPool().query('delete from products where id = $1', [id])
  return (rowCount ?? 0) > 0
}

/** Backup import: replaces the whole catalogue in one transaction. Ids are kept; covers deduplicated per category. */
export async function replaceAllProducts(products: (ProductInput & { id?: string; createdAt?: string })[]): Promise<void> {
  await withTransaction(async (client) => {
    await client.query('delete from products')
    const seen = new Set<string>()
    const coverByCategory = new Set<string>()
    for (const p of products) {
      let id = typeof p.id === 'string' && p.id.trim() ? p.id.trim() : await uniqueId(client, p.name)
      while (seen.has(id)) id = `${id}-${seen.size}`
      seen.add(id)
      const cover = p.isCategoryCover && !coverByCategory.has(p.category)
      if (cover) coverByCategory.add(p.category)
      const createdAt = p.createdAt && !Number.isNaN(Date.parse(p.createdAt)) ? new Date(p.createdAt) : new Date()
      await client.query(
        `insert into products (id, name, description, price, category, image, images, available, featured, is_new, is_category_cover, flowers_count, color, size, handmade, created_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          id, p.name, p.description, p.price, p.category, p.image, p.images,
          p.available, p.featured, p.isNew, cover,
          p.flowersCount ?? null, p.color ?? null, p.size ?? null, p.handmade, createdAt,
        ],
      )
    }
  })
}
