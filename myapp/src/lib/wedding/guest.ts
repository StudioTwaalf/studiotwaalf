/**
 * Gast-sessie voor de digitale wegwerpcamera.
 *
 * Bewust géén NextAuth: op een feest wil je nul drempel.  De gast typt zijn
 * naam (+ e-mail, niet geverifieerd) en krijgt een httpOnly cookie met een
 * HMAC-ondertekende guestId.  Die cookie ís de sessie.
 *
 * De cookie is per event, zodat iemand op twee bruiloften niet in de knoop
 * raakt.  Wie zijn cookies wist krijgt een nieuw filmpje — bewust aanvaard:
 * het alternatief (e-mailverificatie) kost je gasten.
 */

import crypto from 'crypto'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

const MAX_AGE = 60 * 60 * 24 * 3 // 3 dagen — feest + de dag erna

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET
  if (!s) throw new Error('NEXTAUTH_SECRET ontbreekt — nodig om gast-cookies te ondertekenen')
  return s
}

/** Cookienaam per event; slug is al [a-z0-9-] maar we saneren voor de zekerheid. */
export function guestCookieName(slug: string): string {
  return `wg_${slug.replace(/[^a-zA-Z0-9_-]/g, '')}`
}

function sign(guestId: string): string {
  return crypto.createHmac('sha256', secret()).update(guestId).digest('base64url')
}

export function serializeGuest(guestId: string): string {
  return `${guestId}.${sign(guestId)}`
}

/** Verifieert de handtekening in constante tijd en geeft de guestId terug. */
export function parseGuestCookie(value: string | undefined): string | null {
  if (!value) return null

  const dot = value.lastIndexOf('.')
  if (dot <= 0) return null

  const guestId = value.slice(0, dot)
  const provided = Buffer.from(value.slice(dot + 1))
  const expected = Buffer.from(sign(guestId))

  if (provided.length !== expected.length) return null
  if (!crypto.timingSafeEqual(provided, expected)) return null

  return guestId
}

export function guestCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: MAX_AGE,
    path: '/',
  }
}

// ── Lezen ────────────────────────────────────────────────────────────────────

type GuestRow = { id: string; name: string; email: string | null; photoCount: number }

/** Server component-variant (leest via next/headers). */
export async function getGuestFromCookies(
  eventId: string,
  slug: string,
): Promise<GuestRow | null> {
  const raw = cookies().get(guestCookieName(slug))?.value
  return loadGuest(raw, eventId)
}

/** Route handler-variant (leest via de request). */
export async function getGuestFromRequest(
  req: NextRequest,
  eventId: string,
  slug: string,
): Promise<GuestRow | null> {
  const raw = req.cookies.get(guestCookieName(slug))?.value
  return loadGuest(raw, eventId)
}

async function loadGuest(raw: string | undefined, eventId: string): Promise<GuestRow | null> {
  const guestId = parseGuestCookie(raw)
  if (!guestId) return null

  const guest = await prisma.weddingGuest.findUnique({
    where: { id: guestId },
    select: { id: true, name: true, email: true, photoCount: true, eventId: true },
  })

  // Cookie van een ander event telt hier niet
  if (!guest || guest.eventId !== eventId) return null

  const { eventId: _ignored, ...row } = guest
  return row
}
