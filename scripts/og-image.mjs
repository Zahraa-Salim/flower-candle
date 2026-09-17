/**
 * Generates public/og.jpg (1200×630) from scripts/og-template.html using the
 * brand name, tagline and site URL in .env. Run manually after changing any of
 * those:
 *
 *   node scripts/og-image.mjs
 *
 * Playwright is NOT a project dependency. Either install it temporarily
 * (`npm i --no-save playwright && npx playwright install chromium`) or point
 * PLAYWRIGHT_MODULE at an existing installation, e.g.
 *   PLAYWRIGHT_MODULE=C:/somewhere/node_modules/playwright node scripts/og-image.mjs
 */
import { createRequire } from 'node:module'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright')

const read = (value, fallback = '') => (value ?? '').trim() || fallback
const env = loadEnv('production', root, 'VITE_')
const brand = read(env.VITE_BRAND_NAME, 'شغف')
const tagline = read(env.VITE_TAGLINE, 'تفاصيل تُصنع بكل حب وشغف')
const siteUrl = read(env.VITE_SITE_URL, 'http://localhost:5173').replace(/\/+$/, '')
const siteHost = siteUrl.replace(/^https?:\/\//, '')

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const fontDataUrl = async (weight) => {
  const file = resolve(root, `public/fonts/ibm-plex-sans-arabic-arabic-${weight}-normal.woff2`)
  return `data:font/woff2;base64,${(await readFile(file)).toString('base64')}`
}

const template = await readFile(resolve(root, 'scripts/og-template.html'), 'utf8')
const html = template
  .replaceAll('%FONT_300%', await fontDataUrl(300))
  .replaceAll('%FONT_400%', await fontDataUrl(400))
  .replaceAll('%FONT_500%', await fontDataUrl(500))
  .replaceAll('%BRAND_NAME%', escapeHtml(brand))
  .replaceAll('%TAGLINE%', escapeHtml(tagline))
  .replaceAll('%SITE_HOST%', escapeHtml(siteHost))

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate('document.fonts.ready') // runs in the browser, hence the string form
const jpeg = await page.screenshot({ type: 'jpeg', quality: 82, fullPage: false })
await browser.close()

const out = resolve(root, 'public/og.jpg')
await writeFile(out, jpeg)
console.log(`wrote ${out} (${Math.round(jpeg.length / 1024)} KB) for "${brand}" — ${siteHost}`)
if (jpeg.length > 300 * 1024) console.warn('warning: WhatsApp ignores og:image above ~300 KB; lower the quality in scripts/og-image.mjs')
