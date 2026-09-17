/**
 * Applies SQL files to the database in DATABASE_URL (no psql needed):
 *
 *   npm run db:setup        -> db/schema.sql then db/seed.sql
 *   node scripts/db-apply.mjs db/seed.sql
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import pg from 'pg'

try {
  process.loadEnvFile(resolve(process.cwd(), '.env'))
} catch {
  /* no .env: rely on the process environment */
}

const files = process.argv.slice(2)
if (files.length === 0) {
  console.error('usage: node scripts/db-apply.mjs <file.sql> [more.sql...]')
  process.exit(1)
}
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set (add it to .env).')
  process.exit(1)
}

const local = /localhost|127\.0\.0\.1/.test(connectionString) || /sslmode=disable/.test(connectionString)
const client = new pg.Client({
  // "require" is already verified as "verify-full" by pg; naming it avoids the driver's warning.
  connectionString: connectionString.replace(/sslmode=(require|prefer|verify-ca)/, 'sslmode=verify-full'),
  ssl: local ? undefined : { rejectUnauthorized: true },
})
await client.connect()
try {
  for (const file of files) {
    const sql = await readFile(resolve(process.cwd(), file), 'utf8')
    await client.query(sql)
    console.log(`applied ${file}`)
  }
  const { rows } = await client.query('select (select count(*) from categories) as categories, (select count(*) from products) as products')
  console.log(`categories: ${rows[0].categories}, products: ${rows[0].products}`)
} finally {
  await client.end()
}
