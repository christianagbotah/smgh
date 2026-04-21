interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

export function rateLimit(
  key: string,
  options?: { maxRequests?: number; windowMs?: number }
): { allowed: boolean; retryAfter?: number } {
  const maxRequests = options?.maxRequests ?? 5
  const windowMs = options?.windowMs ?? 60_000

  const now = Date.now()
  const existing = store.get(key)

  if (!existing || now > existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) }
  }

  existing.count++
  return { allowed: true }
}
