/**
 * Vercel entry point: exposes the same Hono API (server/app.ts) as one serverless
 * function. vercel.json rewrites every /api/* path and /sitemap.xml to this
 * function (a rewritten request keeps its original URL, so Hono routes it as
 * usual) and deep links to index.html; the built site in dist/ is served by
 * Vercel's CDN. Vercel only matches one path segment per dynamic file name, which
 * is why an explicit rewrite is used instead of a catch-all file.
 *
 * Vercel compiles this file and the traced server/*.ts files with the project's
 * TypeScript, rewriting the `.ts` import specifiers to `.js` to match the emitted
 * files (rewriteRelativeImportExtensions in tsconfig.json).
 *
 * The exported Hono instance satisfies Vercel's Web-standard `{ fetch(request) }`
 * function signature.
 */
import { Hono } from 'hono'
import { createApp } from '../server/app.ts'
import { sitemapHandler } from '../server/sitemap.ts'

const app = new Hono()
app.route('/', createApp())
app.get('/sitemap.xml', sitemapHandler)

export default app
