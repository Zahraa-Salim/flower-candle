import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'
// Explicit extension: Vite's future native config loader requires it.
import { mockProducts } from './src/data/products.ts'

/** Trimmed env value, or the fallback when unset/blank (mirrors src/config/site.ts). */
const read = (value: string | undefined, fallback = ''): string => (value ?? '').trim() || fallback

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
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
   * robots.txt and sitemap.xml need the absolute site URL, so they are generated
   * here (emitted into dist/ on build, served by middleware in dev) instead of
   * living as static files in public/.
   */
  const robotsTxt = () => ['User-agent: *', 'Disallow: /admin', 'Disallow: /cart', `Sitemap: ${siteUrl}/sitemap.xml`, ''].join('\n')
  const sitemapXml = () => {
    const urls: { loc: string; lastmod?: string }[] = [
      { loc: '/' },
      { loc: '/products' },
      { loc: '/about' },
      ...mockProducts.map((p) => ({ loc: `/products/${encodeURI(p.id)}`, lastmod: p.createdAt.slice(0, 10) })),
    ]
    const entries = urls.map(
      (u) => `  <url><loc>${escapeHtml(siteUrl + u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`,
    )
    return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...entries, '</urlset>', ''].join('\n')
  }
  const seoFiles: Plugin = {
    name: 'shaghaf:seo-files',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt() })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml() })
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/robots.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(robotsTxt())
          return
        }
        if (req.url === '/sitemap.xml') {
          res.setHeader('Content-Type', 'application/xml; charset=utf-8')
          res.end(sitemapXml())
          return
        }
        next()
      })
    },
  }

  return {
    plugins: [react(), tailwindcss(), htmlEnv, seoFiles],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
