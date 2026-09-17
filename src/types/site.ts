/** The two photographs in the home-page hero. */
export type HeroSlot = 'main' | 'detail'

export interface SiteContent {
  /** Image URLs per hero slot (an https URL or a data: URL for an uploaded photo). */
  hero: Record<HeroSlot, string>
}
