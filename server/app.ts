import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Context, Next } from 'hono'
import { checkCredentials, isAuthConfigured, issueToken, verifyToken } from './auth.ts'
import { getPool } from './db.ts'
import {
  ValidationError,
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  parseProductInput,
  replaceAllProducts,
  updateProduct,
  type ProductInput,
} from './products.ts'

const MAX_IMAGE_BYTES = 12 * 1024 * 1024
const DATA_URL = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/

const fail = (c: Context, status: 400 | 401 | 404 | 409 | 413 | 500 | 503, error: string) => c.json({ error }, status)

async function requireAuth(c: Context, next: Next) {
  const header = c.req.header('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : undefined
  const session = verifyToken(token)
  if (!session) return fail(c, 401, 'يجب تسجيل الدخول أولاً.')
  c.set('username', session.username)
  await next()
}

/**
 * The JSON API used by the storefront. Mounted under /api by both the
 * production server (server/index.ts) and the Vite dev server (vite.config.ts).
 */
export function createApp() {
  const app = new Hono<{ Variables: { username: string } }>().basePath('/api')

  const origin = process.env.CORS_ORIGIN?.trim()
  if (origin) app.use('*', cors({ origin: origin.split(',').map((o) => o.trim()), allowHeaders: ['Content-Type', 'Authorization'] }))

  app.onError((err, c) => {
    if (err instanceof ValidationError) return fail(c, 400, err.message)
    const pgCode = (err as { code?: string }).code
    if (pgCode === '23503') return fail(c, 400, 'التصنيف غير موجود.')
    if (pgCode === '23505') return fail(c, 409, 'يوجد منتج آخر بنفس المعرّف أو الغلاف.')
    console.error('[شغف api]', err)
    return fail(c, 500, 'حدث خطأ في الخادم.')
  })

  app.get('/health', async (c) => {
    try {
      await getPool().query('select 1')
      return c.json({ ok: true, auth: isAuthConfigured() })
    } catch (err) {
      console.error('[شغف api] database unreachable', err)
      return fail(c, 503, 'تعذّر الوصول إلى قاعدة البيانات.')
    }
  })

  /* ---------- auth ---------- */
  app.post('/auth/login', async (c) => {
    if (!isAuthConfigured()) return fail(c, 503, 'لم يتم ضبط بيانات الدخول على الخادم (ADMIN_USERNAME / ADMIN_PASSWORD).')
    const body = (await c.req.json().catch(() => null)) as { username?: unknown; password?: unknown } | null
    const username = typeof body?.username === 'string' ? body.username : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    if (!checkCredentials(username, password)) return fail(c, 401, 'اسم المستخدم أو كلمة المرور غير صحيحة')
    const name = username.trim().toLowerCase()
    return c.json({ token: issueToken(name), username: name })
  })
  app.get('/auth/session', requireAuth, (c) => c.json({ username: c.get('username') }))

  /* ---------- products ---------- */
  app.get('/products', async (c) => c.json(await listProducts()))
  app.get('/products/:id', async (c) => {
    const product = await getProduct(c.req.param('id') ?? '')
    return product ? c.json(product) : fail(c, 404, 'المنتج غير موجود')
  })
  app.post('/products', requireAuth, async (c) => {
    const input = parseProductInput(await c.req.json().catch(() => null)) as ProductInput
    return c.json(await createProduct(input), 201)
  })
  app.patch('/products/:id', requireAuth, async (c) => {
    const patch = parseProductInput(await c.req.json().catch(() => null), true)
    const updated = await updateProduct(c.req.param('id') ?? '', patch)
    return updated ? c.json(updated) : fail(c, 404, 'المنتج غير موجود')
  })
  app.delete('/products/:id', requireAuth, async (c) => {
    return (await deleteProduct(c.req.param('id') ?? '')) ? c.body(null, 204) : fail(c, 404, 'المنتج غير موجود')
  })
  /** Backup import: replaces the whole catalogue. */
  app.put('/products', requireAuth, async (c) => {
    const body = (await c.req.json().catch(() => null)) as { products?: unknown } | null
    if (!body || !Array.isArray(body.products)) return fail(c, 400, 'قائمة المنتجات مطلوبة.')
    const items = body.products.map((raw) => {
      const r = raw as Record<string, unknown>
      return {
        ...(parseProductInput(raw) as ProductInput),
        id: typeof r.id === 'string' ? r.id : undefined,
        createdAt: typeof r.createdAt === 'string' ? r.createdAt : undefined,
      }
    })
    await replaceAllProducts(items)
    return c.json({ count: items.length })
  })

  /* ---------- site content (hero images) ---------- */
  app.get('/site-content', async (c) => {
    const { rows } = await getPool().query<{ value: unknown }>(`select value from site_content where key = 'hero'`)
    return c.json({ hero: rows[0]?.value ?? {} })
  })
  app.patch('/site-content', requireAuth, async (c) => {
    const body = (await c.req.json().catch(() => null)) as { hero?: Record<string, unknown> } | null
    const hero: Record<string, string> = {}
    for (const slot of ['main', 'detail']) {
      const v = body?.hero?.[slot]
      if (typeof v === 'string') hero[slot] = v
    }
    const { rows } = await getPool().query<{ value: Record<string, string> }>(
      `insert into site_content (key, value) values ('hero', $1::jsonb)
       on conflict (key) do update set value = site_content.value || excluded.value, updated_at = now()
       returning value`,
      [JSON.stringify(hero)],
    )
    return c.json({ hero: rows[0].value })
  })

  /* ---------- images ---------- */
  app.post('/images', requireAuth, async (c) => {
    const body = (await c.req.json().catch(() => null)) as { dataUrl?: unknown } | null
    const match = typeof body?.dataUrl === 'string' ? DATA_URL.exec(body.dataUrl) : null
    if (!match) return fail(c, 400, 'الصورة غير صالحة.')
    const bytes = Buffer.from(match[2], 'base64')
    if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) return fail(c, 413, 'حجم الصورة كبير جداً.')
    const { rows } = await getPool().query<{ id: string }>(
      'insert into images (mime, bytes, size) values ($1, $2, $3) returning id',
      [match[1], bytes, bytes.length],
    )
    return c.json({ url: `/api/images/${rows[0].id}` }, 201)
  })
  app.get('/images/:id', async (c) => {
    const id = c.req.param('id') ?? ''
    if (!/^[0-9a-f-]{36}$/i.test(id)) return fail(c, 404, 'الصورة غير موجودة')
    const { rows } = await getPool().query<{ mime: string; bytes: Buffer }>('select mime, bytes from images where id = $1', [id])
    if (!rows[0]) return fail(c, 404, 'الصورة غير موجودة')
    return c.body(new Uint8Array(rows[0].bytes), 200, {
      'Content-Type': rows[0].mime,
      'Content-Length': String(rows[0].bytes.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
    })
  })

  return app
}
