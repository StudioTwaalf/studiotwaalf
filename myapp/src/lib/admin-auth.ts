import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// TODO: Replace with a real auth solution (NextAuth, Clerk, etc.)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin1234'
const COOKIE_NAME = 'admin_session'
const COOKIE_VALUE = 'authenticated'

export function isAdminAuthenticated(): boolean {
  const cookieStore = cookies()
  return cookieStore.get(COOKIE_NAME)?.value === COOKIE_VALUE
}

export function requireAdmin() {
  if (!isAdminAuthenticated()) {
    redirect('/admin/login')
  }
}

export function verifyAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD
}

export function setAdminCookie(): { name: string; value: string; options: object } {
  return {
    name: COOKIE_NAME,
    value: COOKIE_VALUE,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    },
  }
}

export function clearAdminCookie(): { name: string; value: string; options: object } {
  return {
    name: COOKIE_NAME,
    value: '',
    options: {
      httpOnly: true,
      maxAge: 0,
      path: '/',
    },
  }
}
