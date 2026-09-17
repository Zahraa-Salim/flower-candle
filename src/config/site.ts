/**
 * Central site configuration.
 * Owner-editable values come from `.env` (see `.env.example`); everything else
 * has a sensible default so the app runs without one. Nothing brand-related is
 * duplicated across components.
 *
 * Note: Vite embeds every `VITE_*` value into the public bundle, including the
 * admin password. This is acceptable for a single-owner storefront where the
 * admin area only edits data in the same browser; it is NOT a security boundary.
 */
const env = import.meta.env

/** Trimmed env value, or the fallback when unset/blank. */
function read(value: string | undefined, fallback = ''): string {
  const v = (value ?? '').trim()
  return v || fallback
}

export const siteConfig = {
  name: read(env.VITE_BRAND_NAME, 'شغف'),
  tagline: read(env.VITE_TAGLINE, 'تفاصيل تُصنع بكل حب وشغف'),
  description: read(
    env.VITE_SITE_DESCRIPTION,
    'شغف يقدم شموعاً مصنوعة يدوياً على شكل ورود وباقات وهدايا بتفاصيل ناعمة صُممت بكل حب وشغف.',
  ),
  url: read(env.VITE_SITE_URL, 'http://localhost:5173').replace(/\/+$/, ''),
  /** International format without "+" or spaces, e.g. 9647701234567. Leading zeros ("00964…") are dropped: wa.me rejects them. */
  whatsappNumber: read(env.VITE_WHATSAPP_NUMBER).replace(/\D/g, '').replace(/^0+/, ''),
  currency: read(env.VITE_CURRENCY, '$'),
  social: {
    /** Empty string hides the Instagram links. */
    instagram: read(env.VITE_INSTAGRAM_URL),
  },
  /** Where data lives: the PostgreSQL API (default) or the browser-only demo storage. */
  dataSource: (read(env.VITE_DATA_SOURCE, 'api') === 'local' ? 'local' : 'api') as 'api' | 'local',
  /** API origin when served separately from the site; empty means same origin. */
  apiUrl: read(env.VITE_API_URL).replace(/\/+$/, ''),
  /** Browser-only demo login (VITE_DATA_SOURCE=local). With the API, credentials live on the server. */
  admin: {
    username: read(env.VITE_ADMIN_USERNAME),
    password: env.VITE_ADMIN_PASSWORD ?? '',
  },
}

export const storageKeys = {
  cart: 'shaghaf:cart:v1',
  products: 'shaghaf:products:v1',
  session: 'shaghaf:admin-session:v1',
  siteContent: 'shaghaf:site-content:v1',
  /** sessionStorage: timestamp of the last automatic reload after a stale-chunk error. */
  chunkReload: 'shaghaf:chunk-reload:v1',
} as const

if (import.meta.env.DEV) {
  const localMode = siteConfig.dataSource === 'local'
  const missing = [
    !siteConfig.whatsappNumber && 'VITE_WHATSAPP_NUMBER',
    localMode && !siteConfig.admin.username && 'VITE_ADMIN_USERNAME',
    localMode && !siteConfig.admin.password && 'VITE_ADMIN_PASSWORD',
  ].filter(Boolean)
  if (missing.length > 0) {
    console.warn(`[شغف] متغيرات .env غير مضبوطة: ${missing.join(', ')} — انظري .env.example`)
  }
}
