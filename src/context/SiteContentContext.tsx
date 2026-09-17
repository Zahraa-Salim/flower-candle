import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { HeroSlot, SiteContent } from '@/types/site'
import { defaultHeroImages } from '@/data/images'
import { imageStorage } from '@/services/images'
import { defaultSiteContent, siteContentRepository } from '@/services/siteContent'
import { SiteContentContext, type SiteContentContextValue } from '@/hooks/useSiteContent'

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(defaultSiteContent)
  const [status, setStatus] = useState<SiteContentContextValue['status']>('loading')

  // Initial read: state only changes inside promise callbacks.
  useEffect(() => {
    let active = true
    siteContentRepository
      .get()
      .then((stored) => {
        if (!active) return
        setContent(stored)
        setStatus('ready')
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [])

  const setHeroImage = useCallback(async (slot: HeroSlot, file: File) => {
    const url = await imageStorage.upload(file)
    const patch: Partial<SiteContent['hero']> = { [slot]: url }
    const next = await siteContentRepository.update({ hero: patch as SiteContent['hero'] })
    setContent(next)
  }, [])

  const resetHeroImage = useCallback(async (slot: HeroSlot) => {
    // Writing the default removes the stored override for that slot.
    const patch: Partial<SiteContent['hero']> = { [slot]: defaultHeroImages[slot] }
    const next = await siteContentRepository.update({ hero: patch as SiteContent['hero'] })
    setContent(next)
  }, [])

  const value = useMemo<SiteContentContextValue>(
    () => ({
      content,
      status,
      isCustomHero: (slot) => content.hero[slot] !== defaultHeroImages[slot],
      setHeroImage,
      resetHeroImage,
    }),
    [content, status, setHeroImage, resetHeroImage],
  )

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>
}
