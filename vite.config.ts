import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { getRequestListener } from '@hono/node-server'
// Explicit extensions: Vite's future native config loader requires them.
import { mockProducts } from './src/data/products.ts'
import { createApp } from './server/app.ts'
import { buildSitemapXml, escapeXml as escapeHtml, listSitemapEntries } from './server/sitemap.ts'

/** Server-only variables the dev API bridge needs (never exposed to the client bundle). */
const SERVER_ENV = ['DATABASE_URL', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'AUTH_SECRET', 'CORS_ORIGIN'] as const

/** Trimmed env value, or the fallback when unset/blank (mirrors src/config/site.ts). */
const read = (value: string | undefined, fallback = ''): string => (value ?? '').trim() || fallback

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const localData = read(env.VITE_DATA_SOURCE, 'api') === 'local'

  /** Copies the server-only .env values into process.env for the dev API and sitemap (idempotent). */
  const loadServerEnv = () => {
    const all = loadEnv(mode, process.cwd(), '')
    for (const key of SERVER_ENV) if (all[key] !== undefined && process.env[key] === undefined) process.env[key] = all[key]
  }
  const brand = read(env.VITE_BRAND_NAME, 'شغف')
  const description = read(
    env.VITE_SITE_DESCRIPTION,
    'شغف يقدم شموعاً مصنوعة يدوياً على شكل ورود وباقات وهدايا بتفاصيل ناعمة صُممت بكل حب وشغف.',
  )
  const siteUrl = read(env.VITE_SITE_URL, 'http://localhost:5173').replace(/\/+$/, '')
  const whatsapp = read(env.VITE_WHATSAPP_NUMBER).replace(/\D/g, '')

  // Never ship dead wa.me links: WhatsApp is the only order channel.
  if (command === 'build' && !/^\d{8,15}$/.test(whatsapp)) {
    throw new Error(
      `VITE_WHATSAPP_NUMBER is "${env.VITE_WHATSAPP_NUMBER ?? ''}" — set it in .env to the shop's number in international format, digits only (8–15 digits, e.g. 9647701234567), then build again.`,
    )
  }

  /** Fills the %BRAND_NAME%, %SITE_DESCRIPTION% and %SITE_URL% placeholders in index.html. */
  const htmlEnv: Plugin = {
    name: 'shaghaf:html-env',
    transformIndexHtml(html) {
      return html
        .replaceAll('%BRAND_NAME%', escapeHtml(brand))
        .replaceAll('%SITE_DESCRIPTION%', escapeHtml(description))
        .replaceAll('%SITE_URL%', escapeHtml(siteUrl))
    },
  }

  /**
   * robots.txt needs the absolute site URL, so it is generated here (emitted into
   * dist/ on build, served by middleware in dev) instead of living in public/.
   * sitemap.xml is built from the database at request time (server/sitemap.ts):
   * by server/index.ts in production and by the middleware below in dev, where
   * the browser-only demo mode (VITE_DATA_SOURCE=local) lists the demo catalogue.
   */
  const robotsTxt = () => ['User-agent: *', 'Disallow: /admin', 'Disallow: /cart', `Sitemap: ${siteUrl}/sitemap.xml`, ''].join('\n')
  const sitemapXml = async () => {
    if (localData) return buildSitemapXml(siteUrl, mockProducts.map((p) => ({ id: p.id, lastmod: p.createdAt })))
    try {
      return buildSitemapXml(siteUrl, await listSitemapEntries())
    } catch (err) {
      console.warn('[شغف] sitemap: database unavailable, serving static pages only:', (err as Error).message)
      return buildSitemapXml(siteUrl, [])
    }
  }
  const seoFiles: Plugin = {
    name: 'shaghaf:seo-files',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt() })
    },
    configureServer(server) {
      loadServerEnv()
      server.middlewares.use((req, res, next) => {
        if (req.url === '/robots.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(robotsTxt())
          return
        }
        if (req.url === '/sitemap.xml') {
          void sitemapXml().then((xml) => {
            res.setHeader('Content-Type', 'application/xml; charset=utf-8')
            res.end(xml)
          })
          return
        }
        next()
      })
    },
  }

  /**
   * Dev bridge: runs the same API (server/app.ts) inside the Vite dev server at /api,
   * so `npm run dev` needs no second process. Skipped when VITE_DATA_SOURCE=local.
   */
  const devApi: Plugin = {
    name: 'shaghaf:dev-api',
    apply: 'serve',
    configureServer(server) {
      if (localData) return
      loadServerEnv()
      if (!process.env.DATABASE_URL) {
        server.config.logger.warn('[شغف] DATABASE_URL is not set: /api requests will fail. Set it in .env or use VITE_DATA_SOURCE=local.')
      }
      const listener = getRequestListener(createApp().fetch)
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/')) return void listener(req, res)
        next()
      })
    },
  }

  return {
    plugins: [react(), tailwindcss(), htmlEnv, seoFiles, devApi],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
