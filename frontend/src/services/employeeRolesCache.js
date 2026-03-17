/**
 * Local cache for employees, roles, and permissions so the app works offline:
 * - Login uses cached employees and (when offline) validates PIN against stored hash
 * - Admin table and permissions use cache when offline or for instant load
 */

const KEY_EMPLOYEES = 'pos_employees_cache'
const KEY_ROLES = 'pos_roles_cache'
const KEY_PERMISSIONS_PREFIX = 'pos_permissions_'
const KEY_OFFLINE_PIN_HASHES = 'pos_offline_pin_hashes'

const EMPLOYEES_ROLES_MAX_AGE_MS = 24 * 60 * 60 * 1000  // 24 hours when online
const PERMISSIONS_MAX_AGE_MS = 60 * 60 * 1000           // 1 hour when online
const OFFLINE_USE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // when offline, use cache up to 7 days old
// Offline PIN hashes expire after 48 hours without an online login (convenience only, not a security guarantee)
const OFFLINE_PIN_TTL_MS = 48 * 60 * 60 * 1000

function get(key, maxAgeMs, forOffline = false) {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const obj = JSON.parse(raw)
    if (!obj || (obj.fetchedAt == null && !obj.pinHashes)) return null
    const maxAge = forOffline ? OFFLINE_USE_MAX_AGE_MS : maxAgeMs
    if (maxAge > 0 && obj.fetchedAt != null && Date.now() - obj.fetchedAt > maxAge) return null
    return obj
  } catch {
    return null
  }
}

function set(key, value) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify({ ...value, fetchedAt: Date.now() }))
  } catch (e) {
    console.warn('[employeeRolesCache] set error', e)
  }
}

export function getEmployeesCache(forOffline = false) {
  const obj = get(KEY_EMPLOYEES, EMPLOYEES_ROLES_MAX_AGE_MS, forOffline)
  return obj && Array.isArray(obj.data) ? obj.data : null
}

export function setEmployeesCache(data) {
  set(KEY_EMPLOYEES, { data: Array.isArray(data) ? data : [] })
}

export function getRolesCache(forOffline = false) {
  const obj = get(KEY_ROLES, EMPLOYEES_ROLES_MAX_AGE_MS, forOffline)
  return obj && Array.isArray(obj.data) ? obj.data : null
}

export function setRolesCache(data) {
  set(KEY_ROLES, { data: Array.isArray(data) ? data : [] })
}

export function getPermissionsCache(employeeId, forOffline = false) {
  if (!employeeId) return null
  const obj = get(KEY_PERMISSIONS_PREFIX + employeeId, PERMISSIONS_MAX_AGE_MS, forOffline)
  return obj && obj.permissions != null ? obj.permissions : null
}

export function setPermissionsCache(employeeId, permissions) {
  if (!employeeId) return
  set(KEY_PERMISSIONS_PREFIX + employeeId, { permissions: permissions || {} })
}

// --- Offline login: store PIN hash (from successful online login) so we can verify when offline ---
// NOTE: This is a convenience feature only, not a security guarantee. Hashes are SHA-256
// (client-side) and stored in localStorage. They expire after OFFLINE_PIN_TTL_MS (48h) of
// no online login so stale/terminated employees eventually lose offline access.

export function getOfflinePinHashes() {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(KEY_OFFLINE_PIN_HASHES)
    if (!raw) return {}
    const obj = JSON.parse(raw)
    if (!obj || typeof obj.pinHashes !== 'object') return {}
    // Filter out entries that have exceeded the TTL
    const now = Date.now()
    const timestamps = obj.cachedAt || {}
    const valid = {}
    for (const [id, hash] of Object.entries(obj.pinHashes)) {
      const ts = timestamps[id]
      if (!ts || now - ts <= OFFLINE_PIN_TTL_MS) {
        valid[id] = hash
      }
    }
    return valid
  } catch {
    return {}
  }
}

export function setOfflinePinHash(employeeId, pinHashHex) {
  if (!employeeId || typeof pinHashHex !== 'string') return
  try {
    const raw = localStorage.getItem(KEY_OFFLINE_PIN_HASHES)
    const obj = raw ? JSON.parse(raw) : {}
    const hashes = (obj && typeof obj.pinHashes === 'object') ? { ...obj.pinHashes } : {}
    const timestamps = (obj && typeof obj.cachedAt === 'object') ? { ...obj.cachedAt } : {}
    hashes[String(employeeId)] = pinHashHex
    timestamps[String(employeeId)] = Date.now()
    localStorage.setItem(KEY_OFFLINE_PIN_HASHES, JSON.stringify({ pinHashes: hashes, cachedAt: timestamps }))
  } catch (e) {
    console.warn('[employeeRolesCache] setOfflinePinHash error', e)
  }
}

/** Hash PIN/password with SHA-256 for offline verification (same idea as server-side hash). */
export async function hashPin(password) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(password)))
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  return ''
}
