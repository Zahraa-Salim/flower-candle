/**
 * Production server: serves the JSON API and the built storefront (dist/)
 * from one Node process. Run after `npm run build`:
 *
 *   npm start            (reads .env if present; PORT defaults to 3000)
 *
 * Requires Node 22.18+ (TypeScript is run directly via type stripping).
 */
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { Hono, type Context, type Next } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { createApp } from './app.ts'
import { query } from './db.ts'
import { pruneOrphanImagesInBackground } from './images.ts'
import { buildSitemapXml, listSitemapEntries } from './sitemap.ts'

const root = resolve(import.meta.dirname, '..')
const dist = resolve(root, 'dist')
if (!existsSync(resolve(dist, 'index.html'))) {
  console.error('dist/index.html not found — run `npm run build` first.')
  process.exit(1)
}

const app = new Hono()
app.route('/', createApp())

/* ---------- sitemap.xml: generated from the database on every request ---------- */
let warnedSiteUrl = false
app.get('/sitemap.xml', async (c) => {
  let siteUrl = (process.env.VITE_SITE_URL ?? '').trim().replace(/\/+$/, '')
  if (!siteUrl) {
    siteUrl = new URL(c.req.url).origin
    if (!warnedSiteUrl) {
      warnedSiteUrl = true
      console.warn(`[شغف] VITE_SITE_URL is not set; sitemap.xml uses the request origin (${siteUrl}). Set it in .env to the public URL.`)
    }
  }
  let entries: Awaited<ReturnType<typeof listSitemapEntries>> = []
  try {
    entries = await listSitemapEntries()
  } catch (err) {
    console.error('[شغف] sitemap: database unavailable, serving static pages only', err)
  }
  c.header('Content-Type', 'application/xml; charset=utf-8')
  c.header('Cache-Control', 'public, max-age=3600')
  return c.body(buildSitemapXml(siteUrl, entries))
})

/* ---------- static site ---------- */
// Hashed build output and self-hosted fonts never change under the same URL. Set the header after
// the file has been served (serveStatic's onFound cannot: the response is already built by then).
// A missing hashed asset falls through to the SPA fallback (index.html) and must not be cached.
const immutable = async (c: Context, next: Next) => {
  await next()
  const type = c.res.headers.get('content-type') ?? ''
  if (c.res.status === 200 && !type.startsWith('text/html')) c.header('Cache-Control', 'public, max-age=31536000, immutable')
}
app.use('/assets/*', immutable)
app.use('/fonts/*', immutable)
app.use('/*', serveStatic({ root: './dist' }))
// SPA fallback: every unknown path renders the app (client-side routing).
app.get('*', serveStatic({ path: './dist/index.html' }))

/* ---------- start ---------- */
const port = Number(process.env.PORT) || 3000
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`شغف is running on http://localhost:${info.port}`)
})

// Warm the database connection (Neon wakes a suspended compute on first contact), then
// sweep photos nobody references any more; repeat the sweep daily while the process lives.
query('select 1')
  .then(() => {
    console.log('[شغف] database connection ready')
    pruneOrphanImagesInBackground()
    setInterval(pruneOrphanImagesInBackground, 24 * 60 * 60 * 1000).unref()
  })
  .catch((err: unknown) => console.warn('[شغف] database warm-up failed (requests will retry):', (err as Error).message))
