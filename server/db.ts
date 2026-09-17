import pg from 'pg'

/**
 * PostgreSQL connection pool (Neon or any Postgres). Created lazily so that
 * importing the server code (e.g. from vite.config.ts) never opens a socket.
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
    idleTimeoutMillis: 30_000,
  })
  return pool
}

export type Queryable = Pick<pg.Pool, 'query'> | pg.PoolClient

/** Runs `fn` inside a transaction, rolling back on any error. */
export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect()
  try {
    await client.query('begin')
    const result = await fn(client)
    await client.query('commit')
    return result
  } catch (err) {
    await client.query('rollback').catch(() => undefined)
    throw err
  } finally {
    client.release()
  }
}
