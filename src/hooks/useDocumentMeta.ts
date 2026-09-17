import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { siteConfig } from '@/config/site'

function setMeta(selector: string, create: () => HTMLMetaElement, content: string) {
  let el = document.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  el.content = content
}

/** Sets the Arabic page title, description, canonical URL and Open Graph tags for the current route. */
export function useDocumentMeta(title?: string, description?: string) {
  const { pathname } = useLocation()

  useEffect(() => {
    const fullTitle = title ? `${title} — ${siteConfig.name}` : `${siteConfig.name} — شموع ورد وباقات مصنوعة يدوياً`
    document.title = fullTitle

    const desc = description ?? siteConfig.description
    setMeta(
      'meta[name="description"]',
      () => Object.assign(document.createElement('meta'), { name: 'description' }),
      desc,
    )
    setMeta('meta[property="og:title"]', () => ogMeta('og:title'), fullTitle)
    setMeta('meta[property="og:description"]', () => ogMeta('og:description'), desc)

    const url = `${siteConfig.url}${pathname === '/' ? '/' : pathname}`
    setMeta('meta[property="og:url"]', () => ogMeta('og:url'), url)
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = url
  }, [title, description, pathname])
}

function ogMeta(property: string): HTMLMetaElement {
  const el = document.createElement('meta')
  el.setAttribute('property', property)
  return el
}
