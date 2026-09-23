import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { authService, type AdminSession } from '@/services/auth'
import { SESSION_EXPIRED_EVENT } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { AuthContext, type AuthContextValue } from '@/hooks/useAuth'

/** Warn this long before the token expires so the owner can save what she is editing. */
const WARN_BEFORE_MS = 5 * 60 * 1000
/** setTimeout treats delays above 2^31-1 ms as 0; clamp and re-arm instead. */
const MAX_DELAY_MS = 2 ** 31 - 1

const inAdmin = () => window.location.pathname.startsWith('/admin')

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(() => authService.getSession())
  const { show } = useToast()
  // Latest session for event handlers, so expire() can no-op after a manual sign-out.
  const sessionRef = useRef(session)
  useEffect(() => {
    sessionRef.current = session
  }, [session])

  const signIn = useCallback(async (username: string, password: string) => {
    const next = await authService.signIn(username, password)
    setSession(next)
  }, [])

  const signOut = useCallback(async () => {
    await authService.signOut()
    setSession(null)
  }, [])

  /**
   * Session ended without the owner asking (token expired or rejected). Clearing the
   * session makes RequireAuth redirect to the login page, which returns her to the
   * same admin page afterwards. Unsaved form edits are lost at that point; the
   * warning toast below is the mitigation.
   */
  const expire = useCallback(() => {
    if (!sessionRef.current) return
    sessionRef.current = null
    void authService.signOut()
    setSession(null)
    if (inAdmin()) show('انتهت الجلسة، سجّلي الدخول من جديد', 'info')
  }, [show])

  // The API client saw a 401 on a request that carried our token.
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, expire)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expire)
  }, [expire])

  // Expire locally at the token's own deadline, warn shortly before, and re-check whenever
  // the tab becomes visible again (timers are throttled or paused in background tabs).
  useEffect(() => {
    const expiresAt = session?.expiresAt
    if (!expiresAt) return
    let expiryTimer: number | undefined
    let warnTimer: number | undefined
    let warned = false

    const check = () => {
      const remaining = expiresAt - Date.now()
      if (remaining <= 0) {
        expire()
        return
      }
      window.clearTimeout(expiryTimer)
      expiryTimer = window.setTimeout(check, Math.min(remaining, MAX_DELAY_MS))
      if (!warned && remaining > WARN_BEFORE_MS) {
        window.clearTimeout(warnTimer)
        warnTimer = window.setTimeout(() => {
          warned = true
          if (inAdmin()) show('ستنتهي الجلسة خلال 5 دقائق، احفظي عملك', 'info')
        }, Math.min(remaining - WARN_BEFORE_MS, MAX_DELAY_MS))
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    check()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearTimeout(expiryTimer)
      window.clearTimeout(warnTimer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [session?.expiresAt, expire, show])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      isConfigured: authService.isConfigured(),
      signIn,
      signOut,
    }),
    [session, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
