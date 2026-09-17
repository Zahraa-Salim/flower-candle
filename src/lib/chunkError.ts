/**
 * Recognises "stale chunk" failures: after a redeploy, a lazily loaded route can
 * point at an asset that no longer exists. The fix is a single full reload.
 * Kept free of aliases and `import.meta` so it is trivially testable anywhere.
 */

const CHUNK_ERROR_PATTERNS = [
  /failed to fetch dynamically imported module/i, // Chromium
  /error loading dynamically imported module/i, // Firefox
  /importing a module script failed/i, // Safari
  /unable to preload css/i, // Vite preload helper
]

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message
  }
  return ''
}

/** True when `error` is a failed dynamic import / stale chunk. */
export function isChunkLoadError(error: unknown): boolean {
  if (error && typeof error === 'object' && (error as { name?: unknown }).name === 'ChunkLoadError') return true
  const message = errorMessage(error)
  return CHUNK_ERROR_PATTERNS.some((re) => re.test(message))
}

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

/**
 * True if a stale-chunk reload was already attempted within `windowMs`.
 * A throwing storage counts as "already reloaded" so the page can never loop.
 * Pure read: safe to call during render.
 */
export function hasRecentChunkReload(storage: StorageLike, key: string, now = Date.now(), windowMs = 60_000): boolean {
  try {
    const raw = storage.getItem(key)
    if (!raw) return false
    const at = Number(raw)
    return Number.isFinite(at) && now - at < windowMs
  } catch {
    return true
  }
}

/** Records the reload attempt. Swallows storage errors. Call from an effect, never during render. */
export function markChunkReload(storage: StorageLike, key: string, now = Date.now()): void {
  try {
    storage.setItem(key, String(now))
  } catch {
    /* storage unavailable: hasRecentChunkReload() then reports true and no reload loop is possible */
  }
}
