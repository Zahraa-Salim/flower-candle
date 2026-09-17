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

React 19 · Vite 8 · TypeScript · Tailwind CSS v4 (`@tailwindcss/vite`) · React Router 7 · Lucide React · Framer Motion

## Pages

| Route | What it is |
| --- | --- |
| `/` | Home page |
| `/products` | The collection, with search, filters and sorting (state is kept in the URL) |
| `/products/:id` | Product details, cart, WhatsApp inquiry, share |
| `/about` | Our story |
| `/cart` | Cart and "send the order via WhatsApp" |
| `/admin/login` | Admin sign-in |
| `/admin` | Dashboard: stats, **home-page hero images**, latest products |
| `/admin/products` | Product management (search, filters, availability, featured, **category cover**, delete) |
| `/admin/products/new` · `/admin/products/:id/edit` | Product form with validation |

## Settings (`.env`)

Everything an owner might change later lives in `.env` (copy it from `.env.example`). Values are read in `src/config/site.ts`, which supplies defaults for anything left unset.

| Variable | Meaning |
| --- | --- |
| `VITE_BRAND_NAME` · `VITE_TAGLINE` · `VITE_SITE_DESCRIPTION` | Brand name, tagline and description |
| `VITE_SITE_URL` | Final public URL of the site (used for canonical and Open Graph tags) |
| `VITE_WHATSAPP_NUMBER` | WhatsApp number in international format, digits only (e.g. `9647701234567`) |
| `VITE_INSTAGRAM_URL` | Instagram profile link; leave empty to hide the link |
| `VITE_CURRENCY` | Currency symbol shown before prices |
| `VITE_ADMIN_USERNAME` · `VITE_ADMIN_PASSWORD` | Admin sign-in credentials |

Notes:

- A `$` inside any value is treated by Vite as the start of a variable (`$word`), so write it as `\$` (e.g. `pa\$sword`).
- `npm run build` stops with a clear message if `VITE_WHATSAPP_NUMBER` is empty or is not 8–15 digits, so the site can never ship with broken WhatsApp links.
- The title, description and share tags in `index.html` are filled from these values at build time.
- After editing `.env`, restart `npm run dev` or run `npm run build` again.

> **Important:** Vite embeds every variable that starts with `VITE_` into the site's public JavaScript, which means **the admin password can be read from the site's source**. This is acceptable while the admin area only edits data stored in the admin's own browser (see "Storage" below), but it is not real protection. Once a real database is connected, password checks must move to the server.

## Admin area

- **Sign-in:** username and password from `.env`. There are no user accounts; the session lives in `sessionStorage` until the tab is closed.
- **Hero images:** from the dashboard the admin can upload a replacement for the main or secondary hero photo, or restore the default. Images are resized in the browser (longest edge 1600px, JPEG) before being saved.
- **Category cover:** every product has a "غلاف التصنيف" switch (in the form and in the product list). The flagged product's photo becomes its category tile on the home page. One product per category; flagging a new one clears the previous one automatically.

## Central configuration in code

- `src/config/site.ts` — reads `.env` and provides defaults.
- `src/data/images.ts` — central image registry (temporary Unsplash photos) and the default hero images.
- `src/data/products.ts` · `src/data/categories.ts` — demo data.
- `src/styles/index.css` — design tokens (colours, font, shadows) via `@theme`.

## Data layer and storage

The UI never imports the demo data directly. Everything goes through interfaces whose implementation can later be swapped for a cloud database (Supabase or similar) without touching any component:

| Interface | File | Current implementation |
| --- | --- | --- |
| `ProductRepository` | `src/services/products.ts` | Seeds from the demo data, persists admin edits in `localStorage` |
| `SiteContentRepository` | `src/services/siteContent.ts` | Hero images in IndexedDB |
| `ImageStorage` | `src/services/images.ts` | Resizes the photo and returns a data URL |
| `AuthService` | `src/services/auth.ts` | Compares against the `.env` credentials |

> **Storage is local for now:** product edits, hero photos and category covers are saved in the admin's own browser only. Visitors will not see them until a cloud store is connected. To connect one, write a new implementation of each interface above and replace the last line of the corresponding file.

## Cart

`src/context/CartContext.tsx` — a client-side cart persisted in `localStorage` (`shaghaf:cart:v1`). Adding a product does not reserve stock; availability is confirmed over WhatsApp.

The cart page (`src/pages/Cart.tsx`) reconciles the stored items with the live catalogue when it renders: price and availability come from the current product, and a deleted product is shown as "no longer available" and excluded from the total and the WhatsApp message. Maximum 20 of any product.
