/**
 * Minimal promise wrapper over one IndexedDB key/value store.
 * Used for data too large for localStorage (uploaded images as data URLs).
 * Every function rejects when IndexedDB is unavailable; callers fall back.
 */
const DB_NAME = 'shaghaf'
const STORE = 'kv'
const VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'))
      return
    }
    const request = indexedDB.open(DB_NAME, VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE)
    }
    request.onsuccess = () => {
      const db = request.result
      // Release the connection when another tab asks to upgrade the schema.
      db.onversionchange = () => db.close()
      resolve(db)
    }
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
  })
}

function run<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const request = op(tx.objectStore(STORE))
        let result!: T
        request.onsuccess = () => {
          result = request.result
        }
        request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
        // Resolve only once the transaction has committed: a quota error can abort it after the
        // request itself reported success.
        tx.oncomplete = () => {
          db.close()
          resolve(result)
        }
        tx.onabort = () => {
          db.close()
          reject(tx.error ?? new Error('IndexedDB transaction aborted'))
        }
      }),
  )
}

export function idbGet<T>(key: string): Promise<T | undefined> {
  return run<T | undefined>('readonly', (store) => store.get(key) as IDBRequest<T | undefined>)
}

export function idbSet(key: string, value: unknown): Promise<void> {
  return run('readwrite', (store) => store.put(value, key)).then(() => undefined)
}

export function idbDelete(key: string): Promise<void> {
  return run('readwrite', (store) => store.delete(key)).then(() => undefined)
}
