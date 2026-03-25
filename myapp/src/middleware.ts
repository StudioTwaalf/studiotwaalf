import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const ADMIN_COOKIE_NAME = 'admin_session'
const ADMIN_COOKIE_VALUE = 'authenticated'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ─── Admin routes (existing cookie-based auth) ─────────────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const session = request.cookies.get(ADMIN_COOKIE_NAME)
    if (session?.value !== ADMIN_COOKIE_VALUE) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // ─── Customer-protected routes ─────────────────────────────────────────────
  const isCustomerProtected =
    pathname.startsWith('/design/') || pathname.startsWith('/order/') || pathname === '/my-designs'

  if (isCustomerProtected) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/design/:path*', '/order/:path*', '/my-designs'],
}
