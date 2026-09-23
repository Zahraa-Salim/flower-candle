import type { Context } from 'hono'
import { query } from './db.ts'

/**
 * sitemap.xml is generated at request time from the catalogue in PostgreSQL,
 * so products added or removed in the dashboard are reflected without a
 * rebuild. Served by server/index.ts (npm start), by the Vercel function
 * (api/[[...route]].ts via the /sitemap.xml rewrite in vercel.json) and by
 * vite.config.ts in development.
 */
export interface SitemapEntry {
  /** Product id (URL slug; may contain Arabic letters). */
  id: string
  /** ISO-8601 timestamp of the last change. */
  lastmod: string
}

const STATIC_PATHS = ['/', '/products', '/about']

export const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Pure: builds the XML for the static pages plus one URL per product. */
export function buildSitemapXml(siteUrl: string, entries: SitemapEntry[]): string {
  const origin = siteUrl.replace(/\/+$/, '')
  const urls = [
    ...STATIC_PATHS.map((path) => `  <url><loc>${escapeXml(origin + path)}</loc></url>`),
    ...entries.map(
      (e) => `  <url><loc>${escapeXml(`${origin}/products/${encodeURI(e.id)}`)}</loc><lastmod>${escapeXml(e.lastmod)}</lastmod></url>`,
    ),
  ]
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, '</urlset>', ''].join('\n')
}

/** Every product, newest first. `updated_at` is kept fresh by the products_set_updated_at trigger. */
export async function listSitemapEntries(): Promise<SitemapEntry[]> {
  const { rows } = await query<{ id: string; updated_at: Date }>('select id, updated_at from products order by created_at desc, id')
  return rows.map((r) => ({ id: r.id, lastmod: r.updated_at.toISOString() }))
}

let warnedSiteUrl = false

/**
 * Hono handler for GET /sitemap.xml. The public origin comes from VITE_SITE_URL;
 * without it the request origin is used (warned once). A database failure still
 * answers 200 with the static pages so crawlers never see an error.
 */
export async function sitemapHandler(c: Context): Promise<Response> {
  let siteUrl = (process.env.VITE_SITE_URL ?? '').trim().replace(/\/+$/, '')
  if (!siteUrl) {
    siteUrl = new URL(c.req.url).origin
    if (!warnedSiteUrl) {
      warnedSiteUrl = true
      console.warn(`[شغف] VITE_SITE_URL is not set; sitemap.xml uses the request origin (${siteUrl}). Set it to the public URL.`)
    }
  }
  let entries: SitemapEntry[] = []
  try {
    entries = await listSitemapEntries()
  } catch (err) {
    console.error('[شغف] sitemap: database unavailable, serving static pages only', err)
  }
  c.header('Content-Type', 'application/xml; charset=utf-8')
  c.header('Cache-Control', 'public, max-age=3600')
  return c.body(buildSitemapXml(siteUrl, entries))
}
