import type { Product } from '@/types/product'
import type { SiteContent } from '@/types/site'
import { sanitizeProduct } from './products'
import { normalizeSiteContent } from './siteContent'

/**
 * Backup file for the admin data (catalogue + hero images). Because storage is
 * browser-local, this is the owner's only way to move data between devices or
 * recover after clearing site data. The same JSON can seed a future backend.
 */
export interface BackupFile {
  version: 1
  exportedAt: string
  products: Product[]
  siteContent: SiteContent
}

export const BACKUP_VERSION = 1 as const

export function buildBackup(products: Product[], siteContent: SiteContent): BackupFile {
  return { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), products, siteContent }
}

export function backupFileName(now = new Date()): string {
  const date = now.toISOString().slice(0, 10)
  return `shaghaf-backup-${date}.json`
}

/** Parses and validates a backup; throws an Arabic message the UI can show directly. */
export function parseBackup(text: string): BackupFile {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('الملف ليس نسخة احتياطية صالحة (تعذّرت قراءته).')
  }
  if (!raw || typeof raw !== 'object') throw new Error('الملف ليس نسخة احتياطية صالحة.')
  const r = raw as Record<string, unknown>
  if (r.version !== BACKUP_VERSION) throw new Error('إصدار النسخة الاحتياطية غير مدعوم.')
  if (!Array.isArray(r.products)) throw new Error('النسخة الاحتياطية لا تحتوي على قائمة منتجات.')
  const products = r.products.map(sanitizeProduct).filter((p): p is Product => p !== null)
  return {
    version: BACKUP_VERSION,
    exportedAt: typeof r.exportedAt === 'string' ? r.exportedAt : '',
    products,
    siteContent: normalizeSiteContent(r.siteContent),
  }
}

/** Triggers a browser download of a text file. */
export function downloadText(filename: string, text: string, type = 'application/json'): void {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
