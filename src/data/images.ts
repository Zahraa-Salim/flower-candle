/**
 * Central image registry for the stock photography (Unsplash) used by the demo
 * catalogue, the default hero, the category tiles and the home-page gallery.
 * The owner replaces product and hero photos by uploading them in the dashboard;
 * those are stored in the `images` table and served at /api/images/<id>. To
 * change a section photo that has no upload UI yet, edit the value here.
 */
const UNSPLASH = 'https://images.unsplash.com/photo-'

export function unsplash(id: string, width = 900): string {
  return `${UNSPLASH}${id}?auto=format&fit=crop&q=75&w=${width}`
}

/** Build a srcSet for an Unsplash URL; returns undefined for other hosts. */
export function responsiveSrcSet(url: string, widths = [480, 768, 1200]): string | undefined {
  if (!url.startsWith(UNSPLASH)) return undefined
  return widths.map((w) => `${url.replace(/([?&])w=\d+/, `$1w=${w}`)} ${w}w`).join(', ')
}

export const images = {
  // Brand / sections
  heroMain: unsplash('1676959137657-7e26409c6669', 1000),
  heroDetail: unsplash('1563241527-3004b7be0ffd', 600),
  story: unsplash('1518895949257-7621c3c786d7', 900),
  gift: unsplash('1646182504958-560a709fd368', 1000),
  process: unsplash('1544798378-f0529f828519', 800),

  // Categories
  catBouquets: unsplash('1523693916903-027d144a2b7d', 800),
  catRoses: unsplash('1771142480968-6036543055f7', 800),
  catGifts: unsplash('1689085055401-2e6a7268d6ca', 800),
  catFavors: unsplash('1707746003755-ef65403a4808', 800),

  // Products
  pinkBouquet: unsplash('1782038522299-c1568390810f'),
  springBouquet: unsplash('1523693916903-027d144a2b7d'),
  sunsetBouquet: unsplash('1487530811176-3780de880c2d'),
  whiteRose: unsplash('1610247672619-df289f408ff2'),
  pinkRose: unsplash('1518895949257-7621c3c786d7'),
  smallGift: unsplash('1646182504958-560a709fd368'),
  occasionBouquet: unsplash('1563241527-3004b7be0ffd'),
  peachRose: unsplash('1760606800342-8889a99a8170'),

  // Gallery / secondary
  whiteRosesMinimal: unsplash('1592967937268-ac2b12bb2cb1', 800),
  candlesTrio: unsplash('1602523961358-f9f03dd557db', 800),
  candleGlass: unsplash('1603006905003-be475563bc59', 800),
  roseMoody: unsplash('1602426954525-024212c77def', 800),
  peachRoses: unsplash('1753992243182-ba388674e699', 800),
  rosesTopDown: unsplash('1707746003755-ef65403a4808', 800),
  lisianthus: unsplash('1689085055401-2e6a7268d6ca', 800),
} as const

/** Default hero photographs; the admin can replace either slot from the dashboard. */
export const defaultHeroImages = {
  main: images.heroMain,
  detail: images.heroDetail,
} as const

export interface GalleryImage {
  src: string
  alt: string
  /** Aspect hint used by the mosaic layout */
  tall?: boolean
}

/* Six images: two tall + four square fill a 4-column mosaic exactly (2 rows), and a 2-column one (4 rows). */
export const galleryImages: GalleryImage[] = [
  { src: images.heroMain, alt: 'شمعة وردية بجانب ورود الرانونكولس على خلفية وردية', tall: true },
  { src: images.rosesTopDown, alt: 'باقة ورود وردية وبيضاء من الأعلى' },
  { src: images.candleGlass, alt: 'شمعة مضاءة في كوب زجاجي بإضاءة دافئة' },
  { src: images.lisianthus, alt: 'ورود وردية وبيضاء مربوطة بشريط وردي', tall: true },
  { src: images.process, alt: 'يد تحمل وردة كريمية في ضوء النافذة' },
  { src: images.candlesTrio, alt: 'ثلاث شموع كريمية مضاءة' },
]
