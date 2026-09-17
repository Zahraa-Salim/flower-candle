import { createContext, useContext } from 'react'
import type { HeroSlot, SiteContent } from '@/types/site'

export interface SiteContentContextValue {
  content: SiteContent
  /** 'loading' until the stored content has been read; the defaults render meanwhile. */
  status: 'loading' | 'ready' | 'error'
  /** Which hero slots currently show an owner-uploaded photo rather than the default. */
  isCustomHero: (slot: HeroSlot) => boolean
  /** Upload a photo (resized in the browser) into a hero slot. */
  setHeroImage: (slot: HeroSlot, file: File) => Promise<void>
  resetHeroImage: (slot: HeroSlot) => Promise<void>
}

export const SiteContentContext = createContext<SiteContentContextValue | null>(null)

export function useSiteContent() {
  const ctx = useContext(SiteContentContext)
  if (!ctx) throw new Error('useSiteContent must be used inside <SiteContentProvider>')
  return ctx
}
