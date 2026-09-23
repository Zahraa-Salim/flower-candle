import pg from 'pg'

/**
 * PostgreSQL connection pool (Neon or any Postgres). Created lazily so that
 * importing the server code (e.g. from vite.config.ts) never opens a socket.
 *
 * Hosted Postgres suspends idle computes and drops idle sockets, so the first
 * query after a quiet period can fail with a connection-level error. `query()`
 * and `withTransaction()` retry such failures once; SQL errors are never retried.
 */
let pool: pg.Pool | null = null

export function getPool(): pg.Pool {
  if (pool) return pool
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Add it to .env (see .env.example).')
  }
  const local = /localhost|127\.0\.0\.1/.test(connectionString) || /sslmode=disable/.test(connectionString)
  pool = new pg.Pool({
    // pg already treats "require" as "verify-full" (certificate + hostname checked); saying so explicitly avoids its warning.
    connectionString: connectionString.replace(/sslmode=(require|prefer|verify-ca)/, 'sslmode=verify-full'),
    // Hosted Postgres (Neon) uses publicly trusted certificates; verify them.
    ssl: local ? undefined : { rejectUnauthorized: true },
    max: 5,
    // Drop our idle clients well before the hosted compute suspends, so a request after a long
    // pause opens a fresh connection instead of reusing a socket the server already closed.
    idleTimeoutMillis: 20_000,
    // A cold compute takes seconds to wake; never wait forever (pg's default).
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  })
  // pg re-emits idle-client errors on the pool; without a listener Node would crash the process.
  pool.on('error', (err) => {
    console.warn('[شغف db] idle client error:', err.message)
  })
  return pool
}

export type Queryable = Pick<pg.Pool, 'query'> | pg.PoolClient

const CONNECTION_CODES = new Set([
  'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EPIPE', 'ENOTFOUND', 'EAI_AGAIN',
  '57P01', '57P02', '57P03', // admin shutdown / crash shutdown / cannot connect now (compute waking)
  '08006', '08003', '08001', // connection failure / does not exist / unable to establish
  'XX000', // internal error (Neon reports proxy-side disconnects this way)
])
const CONNECTION_MESSAGE = /terminated unexpectedly|Connection terminated|socket hang up|not queryable|timeout exceeded when trying to connect/i

/** True for socket/connection-level failures that a fresh connection is likely to fix. */
export function isConnectionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const { code, message } = err as { code?: unknown; message?: unknown }
  if (typeof code === 'string' && CONNECTION_CODES.has(code)) return true
  return typeof message === 'string' && CONNECTION_MESSAGE.test(message)
}

const RETRY_DELAY_MS = 400
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * One-shot query with a single retry on connection-level errors. Callers pass only
 * idempotent statements here (selects, upserts, deletes by id); anything that must run
 * exactly once belongs in withTransaction().
 */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  try {
    return await getPool().query<T>(text, params)
  } catch (err) {
    if (!isConnectionError(err)) throw err
    console.warn('[شغف db] connection error, retrying once:', (err as Error).message)
    await sleep(RETRY_DELAY_MS)
    return getPool().query<T>(text, params)
  }
}

/**
 * Runs `fn` inside a transaction, rolling back on any error. If the connection fails
 * before the transaction has begun (a dead pooled socket typically surfaces at `begin`),
 * the whole thing is retried once on a fresh client; once statements have run, never.
 */
export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    let client: pg.PoolClient
    try {
      client = await getPool().connect()
    } catch (err) {
      if (attempt === 0 && isConnectionError(err)) {
        console.warn('[شغف db] connect failed, retrying once:', (err as Error).message)
        await sleep(RETRY_DELAY_MS)
        continue
      }
      throw err
    }

    let began = false
    try {
      await client.query('begin')
      began = true
      const result = await fn(client)
      await client.query('commit')
      client.release()
      return result
    } catch (err) {
      const connectionLost = isConnectionError(err)
      if (began) await client.query('rollback').catch(() => undefined)
      // A broken socket is handed to the pool with the error so the client is discarded, not reused.
      if (connectionLost) client.release(err instanceof Error ? err : new Error(String(err)))
      else client.release()
      if (!began && attempt === 0 && connectionLost) {
        console.warn('[شغف db] begin failed, retrying once:', (err as Error).message)
        await sleep(RETRY_DELAY_MS)
        continue
      }
      throw err
    }
  }
}
