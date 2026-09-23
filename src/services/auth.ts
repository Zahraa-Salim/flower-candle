import { siteConfig, storageKeys } from '@/config/site'
import { sleep } from '@/lib/utils'
import { api, tokenStore } from './api'

export interface AdminSession {
  username: string
  signedInAt: string
  /** Epoch ms when the server-issued token stops being accepted (API mode only). */
  expiresAt?: number
}

/**
 * Auth contract: a single owner login, no user accounts. Two implementations,
 * chosen by `VITE_DATA_SOURCE`: `HttpAuthService` (default) sends the credentials
 * to the server, which checks them against ADMIN_USERNAME / ADMIN_PASSWORD and
 * returns a signed, expiring token; `EnvAuthService` (browser-only demo mode)
 * compares against VITE_ADMIN_* in the bundle. The AuthContext only depends on
 * this interface.
 */
export interface AuthService {
  /** True when credentials are configured at all. */
  isConfigured(): boolean
  getSession(): AdminSession | null
  signIn(username: string, password: string): Promise<AdminSession>
  signOut(): Promise<void>
}

class EnvAuthService implements AuthService {
  isConfigured(): boolean {
    return siteConfig.admin.username !== '' && siteConfig.admin.password !== ''
  }

  getSession(): AdminSession | null {
    try {
      const raw = sessionStorage.getItem(storageKeys.session)
      if (!raw) return null
      const parsed: unknown = JSON.parse(raw)
      const candidate = parsed as Partial<AdminSession> | null
      // Only trust a well-formed session; leftover or older-shaped values must not unlock the admin area.
      if (candidate && typeof candidate === 'object' && typeof candidate.username === 'string') {
        return { username: candidate.username, signedInAt: candidate.signedInAt ?? '' }
      }
      return null
    } catch {
      return null
    }
  }

  async signIn(username: string, password: string): Promise<AdminSession> {
    await sleep(400)
    if (!this.isConfigured()) throw new Error('لم يتم ضبط بيانات الدخول في ملف .env')
    const normalized = username.trim().toLowerCase()
    const ok = normalized === siteConfig.admin.username.toLowerCase() && password === siteConfig.admin.password
    if (!ok) throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة')
    const session: AdminSession = { username: normalized, signedInAt: new Date().toISOString() }
    try {
      sessionStorage.setItem(storageKeys.session, JSON.stringify(session))
    } catch {
      /* storage unavailable (private mode / quota): the in-memory session still works for this page */
    }
    return session
  }

  async signOut(): Promise<void> {
    sessionStorage.removeItem(storageKeys.session)
  }
}

/**
 * API mode: the server checks ADMIN_USERNAME / ADMIN_PASSWORD (never shipped to
 * the browser) and returns a signed, expiring token stored in sessionStorage.
 */
/** Reads the unsigned payload of a `payload.signature` token; null when malformed or already expired. */
function decodeToken(token: string, now = Date.now()): { username: string; exp: number } | null {
  const [payload] = token.split('.')
  try {
    const parsed = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { username?: unknown; exp?: unknown }
    if (typeof parsed.username !== 'string' || typeof parsed.exp !== 'number' || parsed.exp < now) return null
    return { username: parsed.username, exp: parsed.exp }
  } catch {
    return null
  }
}

class HttpAuthService implements AuthService {
  isConfigured(): boolean {
    return true // the server reports a clear error on login if its credentials are missing
  }

  getSession(): AdminSession | null {
    const token = tokenStore.get()
    if (!token) return null
    const decoded = decodeToken(token)
    if (!decoded) {
      tokenStore.clear()
      return null
    }
    return { username: decoded.username, signedInAt: '', expiresAt: decoded.exp }
  }

  async signIn(username: string, password: string): Promise<AdminSession> {
    const { token, username: name } = await api<{ token: string; username: string }>('/auth/login', {
      method: 'POST',
      json: { username, password },
    })
    tokenStore.set(token)
    return { username: name, signedInAt: new Date().toISOString(), expiresAt: decodeToken(token)?.exp }
  }

  async signOut(): Promise<void> {
    tokenStore.clear()
  }
}

export const authService: AuthService = siteConfig.dataSource === 'api' ? new HttpAuthService() : new EnvAuthService()
