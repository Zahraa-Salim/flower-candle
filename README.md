# شغف — Handmade Flower-Candle Store

An Arabic, right-to-left storefront for **شغف**, a boutique that makes flower-shaped candles, bouquets, and gifts by hand. Orders go through WhatsApp: there is no online payment and no customer accounts.

The site is a React app plus a small Node API that owns the PostgreSQL (Neon) connection. Both are served by one process in production.

## Getting started

```bash
cp .env.example .env   # fill in DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD, AUTH_SECRET, VITE_WHATSAPP_NUMBER
npm install
npm run db:setup       # creates the tables and inserts the demo catalogue (safe to re-run)
npm run dev            # http://localhost:5173 — the API runs inside the dev server at /api
```

Production:

```bash
npm run build          # tsc -b && vite build  -> dist/
npm start              # serves dist/ and /api on PORT (default 3000), reads .env if present
```

Requires Node 22.18 or newer (the server runs TypeScript directly).

## Stack

React 19 · Vite 8 · TypeScript · Tailwind CSS v4 · React Router 7 · Lucide React · Framer Motion · Hono + `pg` on Node · PostgreSQL (Neon) · self-hosted IBM Plex Sans Arabic (OFL, `public/fonts`)

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

Any render error or a failed page chunk after a redeploy shows an Arabic error page with a reload button (a stale chunk reloads automatically once). In development, `/__dev/throw` renders that page; it is removed from production builds.

## Settings (`.env`)

Copy `.env.example` to `.env`. Variables starting with `VITE_` are embedded in the public JavaScript; the others are read by the server only and never reach the browser.

| Variable | Meaning |
| --- | --- |
| `VITE_BRAND_NAME` · `VITE_TAGLINE` · `VITE_SITE_DESCRIPTION` | Brand name, tagline and description |
| `VITE_SITE_URL` | Final public URL (canonical and Open Graph tags, robots.txt, sitemap.xml) |
| `VITE_WHATSAPP_NUMBER` | WhatsApp number in international format, digits only (e.g. `9647701234567`) |
| `VITE_INSTAGRAM_URL` | Instagram profile link; leave empty to hide it |
| `VITE_CURRENCY` | Currency symbol shown before prices |
| `VITE_DATA_SOURCE` | `api` (PostgreSQL, default) or `local` (browser-only demo storage, no server needed) |
| `VITE_API_URL` | Only when the API is hosted on another origin; empty means same origin |
| `DATABASE_URL` | PostgreSQL connection string (Neon: Dashboard → Connect; keep `sslmode=require`) |
| `ADMIN_USERNAME` · `ADMIN_PASSWORD` | Admin sign-in, checked on the server |
| `AUTH_SECRET` | Long random string used to sign admin sessions (sessions reset on restart if unset) |
| `PORT` | Port of the production server (`npm start`) |
| `CORS_ORIGIN` | Only when the API and the site are on different origins: allowed origins, comma-separated |

Notes:

- A `$` inside any value is treated as the start of a variable (`$word`); write it as `\$`.
- `npm run build` stops if `VITE_WHATSAPP_NUMBER` is empty or not 8–15 digits, so the site can never ship with broken WhatsApp links.
- After changing the brand name or tagline, regenerate the share image: `node scripts/og-image.mjs` (needs Playwright: `npm i --no-save playwright && npx playwright install chromium`, or set `PLAYWRIGHT_MODULE` to an existing install).

## Database

- `db/schema.sql` — tables `categories`, `products`, `site_content` (hero images), `images` (uploaded photos, served at `/api/images/<id>`), plus a partial unique index that guarantees one cover product per category.
- `db/seed.sql` — the demo catalogue, identical to `src/data/products.ts`. Upserts by id, so re-running restores the demo values without duplicating rows.
- `npm run db:setup` applies both; `npm run db:seed` only the seed. No `psql` needed (`scripts/db-apply.mjs` uses the `pg` driver). You can also paste the files into Neon's SQL editor.
- Categories are fixed in the app (`src/data/categories.ts`) and mirrored in the table for referential integrity.
- Uploaded photos that nothing references any more (removed from a product, replaced hero image, deleted product, upload from a form that was never saved) are pruned automatically: the production server sweeps at start-up and once a day, and after every product or hero change. Photos younger than 48 hours are always kept so an open product form can still save them. To sweep by hand: `npm run db:prune-images` (`-- --dry-run` only lists, `-- --hours N` changes the grace period).
- `sitemap.xml` is generated from the `products` table on every request (`server/sitemap.ts`), so products added in the dashboard appear without a rebuild. It needs `VITE_SITE_URL`; without it the server falls back to the request origin and logs a warning.

## API (`server/`)

| Method and path | Auth | Purpose |
| --- | --- | --- |
| `GET /api/health` | – | Database reachability and whether admin credentials are configured |
| `POST /api/auth/login` | – | Checks `ADMIN_USERNAME` / `ADMIN_PASSWORD`, returns a signed 12-hour token |
| `GET /api/products` · `GET /api/products/:id` | – | Catalogue |
| `POST /api/products` · `PATCH /api/products/:id` · `DELETE /api/products/:id` | Bearer | Admin CRUD; setting a category cover clears the previous one in the same transaction |
| `PUT /api/products` | Bearer | Backup import: replaces the whole catalogue |
| `GET /api/site-content` · `PATCH /api/site-content` | Bearer for PATCH | Hero image overrides |
| `POST /api/images` · `GET /api/images/:id` | Bearer for POST | Photo upload (data URL, max 12 MB) and delivery with immutable caching |

`server/app.ts` is the Hono app; `server/index.ts` serves it together with `dist/` (SPA fallback included, long-lived caching for `/assets` and `/fonts`) and generates `/sitemap.xml` from the database; `vite.config.ts` mounts the same app at `/api` during `npm run dev`. The server retries a query once when the hosted database dropped an idle connection (Neon wakes a suspended compute on first contact), so the first request after a quiet period no longer fails.

## Admin area

- **Sign-in:** username and password from the server's `.env`. No user accounts. The session token lives in `sessionStorage` until the tab is closed or 12 hours pass.
- **Products:** upload a main photo (or paste an https link) and up to six additional photos; uploads are resized in the browser to 1200px JPEG and stored in the `images` table. Leaving the form with unsaved changes asks for confirmation.
- **Hero images:** replace the main or secondary hero photo from the dashboard, or restore the default.
- **Category cover:** the "غلاف التصنيف" switch makes a product's photo the tile of its category on the home page; one per category.
- **Backup:** export the catalogue and hero settings as JSON, or import one (replaces everything).

## Client architecture

- `src/config/site.ts` reads `.env` and selects the data source.
- Data access goes through interfaces with two implementations each, chosen by `VITE_DATA_SOURCE`: `ProductRepository` (`src/services/products.ts`), `SiteContentRepository` (`src/services/siteContent.ts`), `ImageStorage` (`src/services/images.ts`), `AuthService` (`src/services/auth.ts`). The `local` implementations keep everything in the browser (IndexedDB) for demos without a server; `src/services/api.ts` is the shared HTTP client.
- `src/styles/index.css` holds the design tokens; all text/background pairs meet WCAG AA contrast.

## Deploying

### Vercel (site + API in one project)

The repository is ready for Vercel with no extra configuration: the site is built with the Vite preset and the API runs as one serverless function (`api/index.ts` exposes the same Hono app as `npm start`). `vercel.json` rewrites every `/api/*` path and `/sitemap.xml` to that function, and deep links to `index.html`.

1. Import the GitHub repository in Vercel (framework preset: Vite).
2. In **Settings → Environment Variables** add every variable from the table above that the site needs. Required: `VITE_WHATSAPP_NUMBER`, `VITE_SITE_URL` (the Vercel or custom domain), `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `AUTH_SECRET`. Leave `VITE_API_URL` and `CORS_ORIGIN` empty (same origin). `AUTH_SECRET` is mandatory here: without it every function instance would sign tokens with a different random secret and the admin would be logged out at random.
3. Redeploy. `/api/health` must answer `{"ok":true,"auth":true}`.

Notes: uploads go through the function, whose request body limit is about 4.5 MB; photos are resized in the browser to well under that. Orphaned photos are pruned right after each product or hero change (there is no long-running process to do it daily); `npm run db:prune-images` still works from your machine.

### Any Node host (single process)

Any host that runs Node 22.18+ works: run `npm ci && npm run build`, set the environment variables from the table above, then `npm start`. The process serves the site and the API on `PORT`. Put HTTPS in front of it (a reverse proxy or the host's own TLS). If you prefer a static host for the site, host the API separately with `npm start`, set `VITE_API_URL` to its origin and `CORS_ORIGIN` to the site's origin, and give the static host an SPA fallback to `index.html`.

## Cart

`src/context/CartContext.tsx` — a client-side cart persisted in `localStorage`. Adding a product does not reserve stock; availability is confirmed over WhatsApp. The cart page reconciles stored items with the live catalogue: price and availability come from the current product, and a deleted product is shown as "no longer available" and excluded from the total and the WhatsApp message. Maximum 20 of any product.
