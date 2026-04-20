/**
 * Safe fetch helpers for CMS — prevents crashes from non-JSON 500 responses,
 * unvalidated API data, and silent failures on write operations.
 */

/** Fetch and parse JSON with status check. Throws on non-2xx or invalid JSON. */
export async function fetchJSON(url: string, options?: RequestInit): Promise<any> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`)
  }
  return res.json()
}

/** Fetch JSON, returning null on any error instead of throwing. */
export async function fetchJSONOrNull(url: string, options?: RequestInit): Promise<any> {
  try {
    return await fetchJSON(url, options)
  } catch {
    return null
  }
}

/** Wrap JSON.parse to return fallback on error. */
export function safeJSONParse<T = any>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

/** Ensure data is an array. Returns fallback if not. */
export function ensureArray<T>(data: any, fallback: T[] = []): T[] {
  return Array.isArray(data) ? data : fallback
}

/** Fetch with status check for write operations (POST/PUT/DELETE).
 *  Returns `{ ok, data }` so callers can check success properly. */
export async function fetchWrite(url: string, options?: RequestInit): Promise<{ ok: boolean; data?: any }> {
  try {
    const res = await fetch(url, options)
    if (!res.ok) {
      try {
        const data = await res.json()
        return { ok: false, data }
      } catch {
        return { ok: false }
      }
    }
    const data = await res.json().catch(() => null)
    return { ok: true, data }
  } catch {
    return { ok: false }
  }
}
