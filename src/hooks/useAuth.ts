import { createContext, useContext } from 'react'
import type { AdminSession } from '@/services/auth'

export interface AuthContextValue {
  session: AdminSession | null
  isAuthenticated: boolean
  /** False when `.env` has no admin username/password. */
  isConfigured: boolean
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
