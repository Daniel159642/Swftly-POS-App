/**
 * When VITE_API_URL is a full URL (e.g. http://localhost:5001/api/v1 for Tauri/desktop),
 * returns the origin for Socket.IO and other same-host requests.
 * When unset or a path (e.g. /api/v1), returns undefined so the app uses same-origin.
 */
export function getBackendOrigin() {
  const apiUrl = import.meta.env.VITE_API_URL
  if (!apiUrl || typeof apiUrl !== 'string' || apiUrl.startsWith('/')) {
    return undefined
  }
  try {
    return new URL(apiUrl).origin
  } catch {
    return undefined
  }
}

/**
 * Full URL for API request. In desktop (VITE_API_URL set), returns origin + path; else returns path for same-origin.
 */
export function getApiUrl(path) {
  const origin = getBackendOrigin()
  if (!origin) return path
  const p = path.startsWith('/') ? path : `/${path}`
  return `${origin}${p}`
}
