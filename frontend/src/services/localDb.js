import Dexie from 'dexie'

const DB_NAME = 'pos-offline-db'
const DB_VERSION = 1

export const db = new Dexie(DB_NAME)
db.version(DB_VERSION).stores({
  apiCache: 'key, updatedAt',
  pendingWrites: '++id, createdAt'
})

/**
 * Get cache key for a GET request (method + full URL).
 * @param {string} url - Full or relative URL
 * @returns {string}
 */
export function cacheKeyForGet(url) {
  const normalized = url.startsWith('http') ? url : (typeof window !== 'undefined' ? window.location.origin : '') + url
  return `GET:${normalized}`
}

/**
 * Read cached API response. Returns null if missing or expired.
 * @param {string} key - Cache key from cacheKeyForGet
 * @param {number} maxAgeMs - Max age in ms (default 5 min)
 * @returns {Promise<object|null>}
 */
export async function getCachedResponse(key, maxAgeMs = 5 * 60 * 1000) {
  try {
    const row = await db.apiCache.get(key)
    if (!row || !row.value) return null
    if (maxAgeMs > 0 && row.updatedAt && Date.now() - row.updatedAt > maxAgeMs) return null
    return row.value
  } catch (e) {
    console.warn('[localDb] getCachedResponse error', e)
    return null
  }
}

/**
 * Write API response to cache.
 * @param {string} key
 * @param {object} value - Parsed JSON response
 */
export async function setCachedResponse(key, value) {
  try {
    await db.apiCache.put({ key, value, updatedAt: Date.now() })
  } catch (e) {
    console.warn('[localDb] setCachedResponse error', e)
  }
}

/**
 * Add a pending write (POST/PATCH/DELETE) to be replayed when back online.
 * @param {{ method: string, url: string, body?: string, headers?: object }} entry
 */
export async function addPendingWrite(entry) {
  try {
    await db.pendingWrites.add({
      ...entry,
      createdAt: Date.now(),
      retries: 0
    })
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pending-write-added'))
    }
  } catch (e) {
    console.warn('[localDb] addPendingWrite error', e)
  }
}

/**
 * Get all pending writes (for sync).
 * @returns {Promise<Array<{ id: number, method: string, url: string, body?: string, headers?: object }>>}
 */
export async function getPendingWrites() {
  try {
    return await db.pendingWrites.orderBy('id').toArray()
  } catch (e) {
    console.warn('[localDb] getPendingWrites error', e)
    return []
  }
}

/**
 * Remove a pending write by id (after successful send).
 * @param {number} id
 */
export async function removePendingWrite(id) {
  try {
    await db.pendingWrites.delete(id)
  } catch (e) {
    console.warn('[localDb] removePendingWrite error', e)
  }
}

/**
 * Count pending writes.
 */
export async function countPendingWrites() {
  try {
    return await db.pendingWrites.count()
  } catch (e) {
    return 0
  }
}
