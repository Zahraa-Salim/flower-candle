import type { HeroSlot, SiteContent } from '@/types/site'
import { defaultHeroImages } from '@/data/images'
import { siteConfig, storageKeys } from '@/config/site'
import { idbDelete, idbGet, idbSet } from '@/lib/idb'
import { absoluteApiUrl, api } from './api'

/**
 * Editable site content (today: the hero photographs). `HttpSiteContentRepository`
 * (default) stores it in the site_content table through server/app.ts; the
 * browser-only demo keeps it in IndexedDB because uploaded photos are data URLs,
 * too big for localStorage.
 *
 * Only owner overrides are persisted; defaults are filled in on read, so a
 * later change to `defaultHeroImages` still reaches browsers with stored data.
 */
export interface SiteContentRepository {
  /** Rejects when storage cannot be read at all (callers fall back to defaults). */
  get(): Promise<SiteContent>
  update(patch: Partial<SiteContent>): Promise<SiteContent>
  /** Replaces all content (backup import); slots equal to the default drop their override. */
  replace(content: SiteContent): Promise<SiteContent>
}

export const defaultSiteContent: SiteContent = {
  hero: { ...defaultHeroImages },
}

interface StoredSiteContent {
  hero?: Partial<Record<HeroSlot, string>>
}

const SLOTS: HeroSlot[] = ['main', 'detail']

/** Coerces any stored/imported shape into a complete SiteContent, filling defaults. */
export function normalizeSiteContent(raw: unknown): SiteContent {
  return normalize(raw)
}

function normalize(raw: unknown): SiteContent {
  const candidate = (raw && typeof raw === 'object' ? raw : {}) as StoredSiteContent
  const hero = (candidate.hero && typeof candidate.hero === 'object' ? candidate.hero : {}) as Partial<Record<HeroSlot, string>>
  return {
    hero: {
      main: typeof hero.main === 'string' && hero.main ? hero.main : defaultHeroImages.main,
      detail: typeof hero.detail === 'string' && hero.detail ? hero.detail : defaultHeroImages.detail,
    },
  }
}

const SAVE_ERROR = 'تعذّر حفظ الصورة في هذا المتصفح. تأكدي من السماح بتخزين بيانات الموقع وتوفر مساحة كافية.'

class LocalSiteContentRepository implements SiteContentRepository {
  // Writes are serialized so two slots saved at the same time never overwrite each other.
  private queue: Promise<unknown> = Promise.resolve()

  async get(): Promise<SiteContent> {
    return normalize(await idbGet<StoredSiteContent>(storageKeys.siteContent))
  }

  update(patch: Partial<SiteContent>): Promise<SiteContent> {
    const task = this.queue.then(() => this.write(patch))
    this.queue = task.catch(() => undefined)
    return task
  }

  replace(content: SiteContent): Promise<SiteContent> {
    return this.update({ hero: normalize(content).hero })
  }

  private async write(patch: Partial<SiteContent>): Promise<SiteContent> {
    let overrides: Partial<Record<HeroSlot, string>>
    try {
      const stored = await idbGet<StoredSiteContent>(storageKeys.siteContent)
      overrides = { ...(stored?.hero ?? {}) }
    } catch {
      throw new Error(SAVE_ERROR)
    }
    for (const slot of SLOTS) {
      const value = patch.hero?.[slot]
      if (value === undefined) continue
      if (value === defaultHeroImages[slot] || value === '') delete overrides[slot]
      else overrides[slot] = value
    }
    try {
      if (Object.keys(overrides).length === 0) await idbDelete(storageKeys.siteContent)
      else await idbSet(storageKeys.siteContent, { hero: overrides } satisfies StoredSiteContent)
    } catch {
      throw new Error(SAVE_ERROR)
    }
    return normalize({ hero: overrides })
  }
}

/** API mode: hero overrides live in the site_content table (server/app.ts). */
class HttpSiteContentRepository implements SiteContentRepository {
  private resolve(raw: unknown): SiteContent {
    const content = normalize(raw)
    return { hero: { main: absoluteApiUrl(content.hero.main), detail: absoluteApiUrl(content.hero.detail) } }
  }

  async get(): Promise<SiteContent> {
    return this.resolve(await api<unknown>('/site-content'))
  }

  async update(patch: Partial<SiteContent>): Promise<SiteContent> {
    const hero: Partial<Record<HeroSlot, string>> = {}
    for (const slot of SLOTS) {
      const value = patch.hero?.[slot]
      if (value === undefined) continue
      // Store '' for "back to default"; the server keeps the key and normalize() fills the default on read.
      hero[slot] = value === defaultHeroImages[slot] ? '' : value.replace(new RegExp(`^${siteConfig.apiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '')
    }
    return this.resolve(await api<unknown>('/site-content', { method: 'PATCH', json: { hero } }))
  }

  replace(content: SiteContent): Promise<SiteContent> {
    return this.update({ hero: normalize(content).hero })
  }
}

export const siteContentRepository: SiteContentRepository =
  siteConfig.dataSource === 'api' ? new HttpSiteContentRepository() : new LocalSiteContentRepository()
