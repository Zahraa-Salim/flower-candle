# شغف — Handmade Flower-Candle Store

An Arabic, right-to-left storefront for **شغف**, a boutique that makes flower-shaped candles, bouquets, and gifts by hand. Orders go through WhatsApp: there is no online payment and no customer accounts at this stage.

## Getting started

```bash
cp .env.example .env   # then edit the values (see "Settings" below)
npm install
npm run dev            # http://localhost:5173
npm run build          # tsc -b && vite build
npm run lint
```

## Stack

React 19 · Vite 8 · TypeScript · Tailwind CSS v4 (`@tailwindcss/vite`) · React Router 7 · Lucide React · Framer Motion · self-hosted IBM Plex Sans Arabic (OFL, `public/fonts`)

## Pages

| Route | What it is |
| --- | --- |
| `/` | Home page |
| `/products` | The collection, with search, filters and sorting (state is kept in the URL) |
| `/products/:id` | Product details, cart, WhatsApp inquiry, share |
| `/about` | Our story |
| `/cart` | Cart and "send the order via WhatsApp" |
| `/admin/login` | Admin sign-in |
| `/admin` | Dashboard: stats, hero images, latest products, backup export/import |
| `/admin/products` | Product management (search, filters, availability, featured, category cover, delete) |
| `/admin/products/new` · `/admin/products/:id/edit` | Product form with photo upload and validation |

Any render error or a failed page chunk after a redeploy shows an Arabic error page with a reload button (a stale chunk reloads automatically once). In development, `/__dev/throw` renders that page for checking; it is removed from production builds.

## Settings (`.env`)

Everything an owner might change later lives in `.env` (copy it from `.env.example`). Values are read in `src/config/site.ts`, which supplies defaults for anything left unset.

| Variable | Meaning |
| --- | --- |
| `VITE_BRAND_NAME` · `VITE_TAGLINE` · `VITE_SITE_DESCRIPTION` | Brand name, tagline and description |
| `VITE_SITE_URL` | Final public URL of the site (canonical and Open Graph tags, robots.txt, sitemap.xml) |
| `VITE_WHATSAPP_NUMBER` | WhatsApp number in international format, digits only (e.g. `9647701234567`) |
| `VITE_INSTAGRAM_URL` | Instagram profile link; leave empty to hide the link |
| `VITE_CURRENCY` | Currency symbol shown before prices |
| `VITE_ADMIN_USERNAME` · `VITE_ADMIN_PASSWORD` | Admin sign-in credentials |

Notes:

- A `$` inside any value is treated by Vite as the start of a variable (`$word`), so write it as `\$` (e.g. `pa\$sword`).
- `npm run build` stops with a clear message if `VITE_WHATSAPP_NUMBER` is empty or is not 8–15 digits, so the site can never ship with broken WhatsApp links.
- The title, description, share tags, `robots.txt` and `sitemap.xml` are generated from these values at build time.
- After editing `.env`, restart `npm run dev` or run `npm run build` again.
- After changing the brand name or tagline, regenerate the share image: `node scripts/og-image.mjs` (needs Playwright: `npm i --no-save playwright && npx playwright install chromium`, or set `PLAYWRIGHT_MODULE` to an existing install). Keep `public/og.jpg` under ~300 KB or WhatsApp ignores it.

> **Important:** Vite embeds every variable that starts with `VITE_` into the site's public JavaScript, which means **the admin password can be read from the site's source**. This is acceptable while the admin area only edits data stored in the admin's own browser (see "Storage" below), but it is not real protection. Once a real database is connected, password checks must move to the server.

## Admin area

- **Sign-in:** username and password from `.env`. There are no user accounts; the session lives in `sessionStorage` until the tab is closed.
- **Products:** the form takes a main photo (upload from the device, or paste an https link) and up to six additional photos. Uploads are resized in the browser to 1200px JPEG. Leaving the form with unsaved changes asks for confirmation.
- **Hero images:** from the dashboard the admin can upload a replacement for the main or secondary hero photo, or restore the default (resized to 1600px JPEG).
- **Category cover:** every product has a "غلاف التصنيف" switch. The flagged product's photo becomes its category tile on the home page. One product per category; flagging a new one clears the previous one automatically.
- **Backup:** the dashboard exports all products and hero images as a JSON file and imports one back (replacing everything). Because storage is browser-local, export before clearing site data or moving to another device. The same file can seed a future backend.

## Central configuration in code

- `src/config/site.ts` — reads `.env` and provides defaults.
- `src/data/images.ts` — central image registry (temporary Unsplash photos) and the default hero images.
- `src/data/products.ts` · `src/data/categories.ts` — demo data (also the source of the sitemap's product URLs).
- `src/styles/index.css` — design tokens (colours, font, shadows) via `@theme`; all text/background pairs meet WCAG AA contrast.
- `scripts/og-template.html` — the share-image design.

## Data layer and storage

The UI never imports the demo data directly. Everything goes through interfaces whose implementation can later be swapped for a cloud database (Supabase or similar) without touching any component:

| Interface | File | Current implementation |
| --- | --- | --- |
| `ProductRepository` | `src/services/products.ts` | Seeds from the demo data, persists admin edits in IndexedDB (an older localStorage store is migrated once, then removed) |
| `SiteContentRepository` | `src/services/siteContent.ts` | Hero image overrides in IndexedDB |
| `ImageStorage` | `src/services/images.ts` | Resizes the photo in the browser and returns a data URL |
| `AuthService` | `src/services/auth.ts` | Compares against the `.env` credentials |

> **Storage is local for now:** product edits, uploaded photos and category covers are saved in the admin's own browser only. Visitors will not see them until a cloud store is connected. To connect one, write a new implementation of each interface above and replace the last line of the corresponding file.

## Deploying

`npm run build` writes a static site to `dist/`. The host must serve `index.html` for unknown paths (an "SPA fallback" rewrite), otherwise refreshing `/products/…` or `/admin` returns a 404; the product URLs in `sitemap.xml` depend on it. Examples: Netlify `public/_redirects` with `/* /index.html 200`, Vercel `rewrites` in `vercel.json`, nginx `try_files $uri /index.html`.

## Cart

`src/context/CartContext.tsx` — a client-side cart persisted in `localStorage` (`shaghaf:cart:v1`). Adding a product does not reserve stock; availability is confirmed over WhatsApp. Uploaded (data URL) photos are never written to the cart; the live photo is shown from the catalogue.

The cart page (`src/pages/Cart.tsx`) reconciles the stored items with the live catalogue when it renders: price and availability come from the current product, and a deleted product is shown as "no longer available" and excluded from the total and the WhatsApp message. Maximum 20 of any product.
