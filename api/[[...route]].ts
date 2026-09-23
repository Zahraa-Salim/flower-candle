/**
 * Vercel entry point: exposes the same Hono API (server/app.ts) as one serverless
 * function that answers every /api/* path (optional catch-all file name). The
 * built site in dist/ is served by Vercel's CDN; vercel.json rewrites
 * /sitemap.xml here and deep links to index.html.
 *
 * Vercel compiles this file and the traced server/*.ts files with the project's
 * TypeScript, rewriting the `.ts` import specifiers to `.js` to match the emitted
 * files (rewriteRelativeImportExtensions in tsconfig.json).
 *
 * The exported Hono instance satisfies Vercel's Web-standard `{ fetch(request) }`
 * function signature.
 */
import { createApp } from '../server/app.ts'

export default createApp()
