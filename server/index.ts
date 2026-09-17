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
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { createApp } from './app.ts'

const root = resolve(import.meta.dirname, '..')
const dist = resolve(root, 'dist')
if (!existsSync(resolve(dist, 'index.html'))) {
  console.error('dist/index.html not found — run `npm run build` first.')
  process.exit(1)
}

const app = new Hono()
app.route('/', createApp())

const immutable = (path: string) => /^\/(assets|fonts)\//.test(path)
app.use(
  '/*',
  serveStatic({
    root: './dist',
    onFound: (path, c) => {
      if (immutable(path.replace(/^\.?\/?dist/, ''))) c.header('Cache-Control', 'public, max-age=31536000, immutable')
    },
  }),
)
// SPA fallback: every unknown path renders the app (client-side routing).
app.get('*', serveStatic({ path: './dist/index.html' }))

const port = Number(process.env.PORT) || 3000
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`شغف is running on http://localhost:${info.port}`)
})
