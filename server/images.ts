import { query } from './db.ts'

/**
 * Uploaded photos live in the `images` table and are referenced by URL
 * (`/api/images/<uuid>`) from products.image, products.images[] and the hero
 * slots in site_content. Nothing else points at them, so a row that no URL
 * mentions is garbage: a photo removed from a product, a replaced hero image,
 * a deleted product's gallery, or an upload from a form that was never saved.
 *
 * The grace period keeps photos uploaded in a product form that is still open;
 * a form left open longer than that and then saved would reference a pruned image.
 */
export const PRUNE_GRACE_HOURS = 48

const PRUNE_SQL = `
  with refs as (
    select (regexp_matches(u, '/api/images/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', 'g'))[1] as id
    from (
      select image as u from products
      union all select unnest(images) from products
      union all select value::text from site_content
    ) src
  )
  select i.id from images i
  where i.created_at < now() - make_interval(hours => $1::int)
    and not exists (select 1 from refs r where r.id = i.id::text)
`

/** Ids of unreferenced photos older than the grace period (what `pruneOrphanImages` would delete). */
export async function listOrphanImages(olderThanHours = PRUNE_GRACE_HOURS): Promise<string[]> {
  const { rows } = await query<{ id: string }>(PRUNE_SQL, [olderThanHours])
  return rows.map((r) => r.id)
}

let inflight: Promise<string[]> | null = null

/** Deletes unreferenced photos older than the grace period; returns their ids. Concurrent calls share one run. */
export function pruneOrphanImages(olderThanHours = PRUNE_GRACE_HOURS): Promise<string[]> {
  if (inflight) return inflight
  inflight = query<{ id: string }>(`with candidates as (${PRUNE_SQL}) delete from images i using candidates c where i.id = c.id returning i.id`, [olderThanHours])
    .then(({ rows }) => rows.map((r) => r.id))
    .finally(() => {
      inflight = null
    })
  return inflight
}

/** Fire-and-forget variant for request handlers: runs after the owner's change is committed, never blocks the response. */
export function pruneOrphanImagesInBackground(): void {
  pruneOrphanImages()
    .then((ids) => {
      if (ids.length > 0) console.log(`[شغف] pruned ${ids.length} unreferenced image(s)`)
    })
    .catch((err: unknown) => console.error('[شغف] image prune failed', err))
}
