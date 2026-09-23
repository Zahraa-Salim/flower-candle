import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Single-admin authentication, checked on the server.
 * ADMIN_USERNAME / ADMIN_PASSWORD come from the server environment (never VITE_*),
 * so they are not part of the public bundle. A successful login returns a signed,
 * expiring token that the admin UI sends as `Authorization: Bearer <token>`.
 */
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000

let ephemeralSecret: string | null = null

/**
 * On a serverless platform every instance would invent its own random secret, so a
 * token issued by one instance is rejected by the next: there AUTH_SECRET is required.
 */
const serverless = Boolean(process.env.VERCEL)

function secret(): string {
  const configured = process.env.AUTH_SECRET?.trim()
  if (configured) return configured
  if (!ephemeralSecret) {
    ephemeralSecret = randomBytes(32).toString('hex')
    console.warn('[شغف] AUTH_SECRET is not set; admin sessions will reset when the server restarts.')
  }
  return ephemeralSecret
}

export function isAuthConfigured(): boolean {
  const credentials = Boolean(process.env.ADMIN_USERNAME?.trim() && process.env.ADMIN_PASSWORD)
  return credentials && (!serverless || Boolean(process.env.AUTH_SECRET?.trim()))
}

/** What the login endpoint tells the owner when sign-in is impossible. */
export function authConfigError(): string {
  if (serverless && !process.env.AUTH_SECRET?.trim()) return 'لم يتم ضبط AUTH_SECRET على الخادم (مطلوب على Vercel).'
  return 'لم يتم ضبط بيانات الدخول على الخادم (ADMIN_USERNAME / ADMIN_PASSWORD).'
}

const b64url = (buf: Buffer) => buf.toString('base64url')
const sign = (payload: string) => b64url(createHmac('sha256', secret()).update(payload).digest())

export interface TokenPayload {
  username: string
  exp: number
}

export function issueToken(username: string, now = Date.now()): string {
  const payload = b64url(Buffer.from(JSON.stringify({ username, exp: now + TOKEN_TTL_MS } satisfies TokenPayload)))
  return `${payload}.${sign(payload)}`
}

export function verifyToken(token: string | undefined, now = Date.now()): TokenPayload | null {
  if (!token) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expected = sign(payload)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<TokenPayload>
    if (typeof parsed.username !== 'string' || typeof parsed.exp !== 'number' || parsed.exp < now) return null
    return { username: parsed.username, exp: parsed.exp }
  } catch {
    return null
  }
}

/** Constant-time credential check; username is case-insensitive and trimmed like the UI. */
export function checkCredentials(username: string, password: string): boolean {
  if (!isAuthConfigured()) return false
  const expectedUser = process.env.ADMIN_USERNAME!.trim().toLowerCase()
  const expectedPass = process.env.ADMIN_PASSWORD!
  const u = Buffer.from(username.trim().toLowerCase())
  const eu = Buffer.from(expectedUser)
  const p = Buffer.from(password)
  const ep = Buffer.from(expectedPass)
  const userOk = u.length === eu.length && timingSafeEqual(u, eu)
  const passOk = p.length === ep.length && timingSafeEqual(p, ep)
  return userOk && passOk
}
