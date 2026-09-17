/// <reference types="vite/client" />

/** Owner-editable values, read from `.env` (see `.env.example`). All are optional; `src/config/site.ts` supplies defaults. */
interface ImportMetaEnv {
  readonly VITE_BRAND_NAME?: string
  readonly VITE_TAGLINE?: string
  readonly VITE_SITE_DESCRIPTION?: string
  readonly VITE_SITE_URL?: string
  readonly VITE_WHATSAPP_NUMBER?: string
  readonly VITE_INSTAGRAM_URL?: string
  readonly VITE_CURRENCY?: string
  readonly VITE_ADMIN_USERNAME?: string
  readonly VITE_ADMIN_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
