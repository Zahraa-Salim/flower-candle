import { siteConfig, storageKeys } from '@/config/site'
import { sleep } from '@/lib/utils'
import { api, tokenStore } from './api'

export interface AdminSession {
  username: string
  signedInAt: string
}

/**
 * Auth contract. The current implementation checks a single username/password
 * pair from `.env` (no user accounts). A server-checked variant can replace it
 * later; the AuthContext only depends on this interface.
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
class HttpAuthService implements AuthService {
  isConfigured(): boolean {
    return true // the server reports a clear error on login if its credentials are missing
  }

  getSession(): AdminSession | null {
    const token = tokenStore.get()
    if (!token) return null
    const [payload] = token.split('.')
    try {
      const parsed = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { username?: unknown; exp?: unknown }
      if (typeof parsed.username !== 'string' || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
        tokenStore.clear()
        return null
      }
      return { username: parsed.username, signedInAt: '' }
    } catch {
      tokenStore.clear()
      return null
    }
  }

  async signIn(username: string, password: string): Promise<AdminSession> {
    const { token, username: name } = await api<{ token: string; username: string }>('/auth/login', {
      method: 'POST',
      json: { username, password },
    })
    tokenStore.set(token)
    return { username: name, signedInAt: new Date().toISOString() }
  }

  async signOut(): Promise<void> {
    tokenStore.clear()
  }
}

export const authService: AuthService = siteConfig.dataSource === 'api' ? new HttpAuthService() : new EnvAuthService()
