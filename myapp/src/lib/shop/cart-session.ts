import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export const CART_COOKIE = 'st_cart_id'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90 // 90 days

/**
 * Gets or creates a Cart for the current request.
 * Links the cart to the logged-in user when a JWT is present.
 * Returns { cart, sessionId }.
 */
export async function getOrCreateCart(req: NextRequest) {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get(CART_COOKIE)?.value

  // Get user from JWT if available
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const userId = token?.sub ?? null

  if (!sessionId) {
    sessionId = uuidv4()
  }

  // Upsert cart by sessionId; link userId if logged in
  const cart = await prisma.cart.upsert({
    where: { sessionId },
    create: { sessionId, userId },
    update: userId ? { userId } : {},
    include: {
      items: {
        include: {
          product: {
            include: {
              assets: { orderBy: { sortOrder: 'asc' }, take: 1 },
              variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
            },
          },
          variant: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  return { cart, sessionId }
}

/**
 * Sets the cart session cookie on a Response.
 */
export function setCartCookie(response: Response, sessionId: string): Response {
  response.headers.append(
    'Set-Cookie',
    `${CART_COOKIE}=${sessionId}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`
  )
  return response
}
