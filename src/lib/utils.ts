import { siteConfig } from '@/config/site'

/** Join class names, skipping falsy values. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return `${siteConfig.currency}0`
  // Round to cents first so float noise (0.7 × 10) does not flip between "$7" and "$7.00".
  const cents = Math.round(value * 100) / 100
  const n = Number.isInteger(cents) ? cents.toString() : cents.toFixed(2)
  return `${siteConfig.currency}${n}`
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
}

export function uid(prefix = 'p'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/** Loosen Arabic text for search: strip diacritics and unify common letter variants. */
export function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    // Harakat, hamza marks, superscript alef, and tatweel (kashida) carry no search meaning.
    .replace(/[ً-ٰٕـ]/g, '')
    .replace(/[آأإاٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim()
}

/** One string per CLDR plural category; `{n}` is replaced by the count (Western digits, as everywhere on the site). */
export type PluralForms = Record<Intl.LDMLPluralRule, string>

const arabicPlural = new Intl.PluralRules('ar')

/** Arabic-correct count phrase: 0 → zero, 1 → one, 2 → two, 3–10 → few, 11–99 → many, 100/200… → other. */
export function pluralize(n: number, forms: PluralForms): string {
  return forms[arabicPlural.select(n)].replace('{n}', String(n))
}

export const plurals = {
  product: { zero: 'لا منتجات', one: 'منتج واحد', two: 'منتجان', few: '{n} منتجات', many: '{n} منتجاً', other: '{n} منتج' },
  piece: { zero: 'لا قطع', one: 'قطعة واحدة', two: 'قطعتان', few: '{n} قطع', many: '{n} قطعة', other: '{n} قطعة' },
  image: { zero: 'لا صور', one: 'صورة واحدة', two: 'صورتان', few: '{n} صور', many: '{n} صورة', other: '{n} صورة' },
} satisfies Record<string, PluralForms>

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ar', { year: 'numeric', month: 'short', day: 'numeric' }).format(
      new Date(iso),
    )
  } catch {
    return iso
  }
}
