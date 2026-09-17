import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'

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

  return {
    plugins: [react(), tailwindcss(), htmlEnv],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
