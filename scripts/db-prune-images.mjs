/**
 * Deletes uploaded photos that no product or hero slot references any more
 * (the production server also does this at start-up and once a day):
 *
 *   npm run db:prune-images              -> delete unreferenced photos older than 48 hours
 *   npm run db:prune-images -- --dry-run -> only list what would be deleted
 *   npm run db:prune-images -- --hours 0 -> no grace period (only when no product form is open)
 */
import { resolve } from 'node:path'
import { getPool } from '../server/db.ts'
import { PRUNE_GRACE_HOURS, listOrphanImages, pruneOrphanImages } from '../server/images.ts'

try {
  process.loadEnvFile(resolve(process.cwd(), '.env'))
} catch {
  /* no .env: rely on the process environment */
}

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const hoursIndex = args.indexOf('--hours')
const hours = hoursIndex === -1 ? PRUNE_GRACE_HOURS : Number(args[hoursIndex + 1])
if (!Number.isFinite(hours) || hours < 0) {
  console.error('usage: node scripts/db-prune-images.mjs [--dry-run] [--hours N]')
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set (add it to .env).')
  process.exit(1)
}

try {
  const ids = dryRun ? await listOrphanImages(hours) : await pruneOrphanImages(hours)
  const verb = dryRun ? 'would delete' : 'deleted'
  console.log(`${verb} ${ids.length} unreferenced image(s) older than ${hours}h`)
  for (const id of ids) console.log(`  ${id}`)
} finally {
  await getPool().end()
}
