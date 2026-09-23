import { siteConfig, storageKeys } from '@/config/site'

/**
 * Thin client for the JSON API in server/app.ts. `VITE_API_URL` is empty when
 * the API is served from the same origin (production server / Vite dev bridge).
 */
const base = siteConfig.apiUrl

export const tokenStore = {
  get(): string | null {
    try {
      return sessionStorage.getItem(storageKeys.session)
    } catch {
      return null
    }
  },
  set(token: string): void {
    try {
      sessionStorage.setItem(storageKeys.session, token)
    } catch {
      /* private mode: the session lasts for this page only */
    }
  },
  clear(): void {
    try {
      sessionStorage.removeItem(storageKeys.session)
    } catch {
      /* ignore */
    }
  },
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const NETWORK_ERROR = 'تعذّر الاتصال بالخادم. تحققي من اتصالك ثم أعيدي المحاولة.'

/**
 * Dispatched on `window` when a request that carried a session token is rejected
 * with 401 (expired or invalid token). AuthContext listens and signs the admin out.
 * A failed login also answers 401 but never carries a token, so it does not fire this.
 */
export const SESSION_EXPIRED_EVENT = 'shaghaf:session-expired'

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const token = tokenStore.get()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  let body = init.body
  if (init.json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(init.json)
  }
  let response: Response
  try {
    response = await fetch(`${base}/api${path}`, { ...init, headers, body })
  } catch {
    throw new ApiError(0, NETWORK_ERROR)
  }
  if (response.status === 401 && token && path !== '/auth/login') {
    tokenStore.clear()
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
  }
  if (!response.ok) {
    let message = 'حدث خطأ في الخادم.'
    try {
      const data = (await response.json()) as { error?: unknown }
      if (typeof data.error === 'string') message = data.error
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(response.status, message)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

/** Turns an API image path (/api/images/<id>) into a URL usable as <img src>. */
export const absoluteApiUrl = (path: string) => (path.startsWith('/api/') ? `${base}${path}` : path)
