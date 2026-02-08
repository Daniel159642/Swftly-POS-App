/**
 * Fetch that works in both browser and Tauri desktop.
 * In Tauri, uses the HTTP plugin so requests to localhost are allowed (webview may block them).
 */
import { getApiUrl } from './backendUrl'

let tauriFetch = null
async function getTauriFetch() {
  if (tauriFetch) return tauriFetch
  const mod = await import('@tauri-apps/plugin-http')
  tauriFetch = mod.fetch
  return tauriFetch
}

/**
 * @param {string} pathOrUrl - API path (e.g. '/api/employees') or full URL
 * @param {RequestInit} [options] - fetch options
 * @returns {Promise<Response>}
 */
export async function apiFetch(pathOrUrl, options = {}) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : getApiUrl(pathOrUrl)
  if (typeof window !== 'undefined' && window.__TAURI__) {
    const fetchFn = await getTauriFetch()
    return fetchFn(url, options)
  }
  return fetch(url, options)
}
