import { cookies } from 'next/headers'
import { db } from '@/lib/db'

const SESSION_COOKIE = 'smgh_session'

/**
 * Verify the current user's session from their cookie.
 * Returns the admin user info if authenticated, or null if not.
 * Call this at the top of any admin API route to enforce auth.
 */
export async function requireAuth() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value

    if (!token) return null

    const session = await db.siteSetting.findUnique({
      where: { key: `session_${token}` },
    })

    if (!session) return null

    const admin = await db.adminUser.findUnique({ where: { id: session.value } })
    if (!admin) return null
    if (!admin.active) return null

    return { id: admin.id, name: admin.name, username: admin.username, role: admin.role || 'editor' }
  } catch {
    return null
  }
}
