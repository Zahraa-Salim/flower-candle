import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { authService, type AdminSession } from '@/services/auth'
import { AuthContext, type AuthContextValue } from '@/hooks/useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(() => authService.getSession())

  const signIn = useCallback(async (username: string, password: string) => {
    const next = await authService.signIn(username, password)
    setSession(next)
  }, [])

  const signOut = useCallback(async () => {
    await authService.signOut()
    setSession(null)
  }, [])

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
