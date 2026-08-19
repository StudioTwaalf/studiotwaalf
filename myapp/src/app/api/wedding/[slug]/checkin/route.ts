import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { guestCookieName, guestCookieOptions, serializeGuest } from '@/lib/wedding/guest'

// ─── POST /api/wedding/[slug]/checkin — gast meldt zich aan ──────────────────

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const event = await prisma.weddingEvent.findUnique({
    where: { slug: params.slug },
    select: { id: true, isOpen: true, photoLimit: true },
  })

  if (!event) {
    return NextResponse.json({ error: 'Onbekend feest' }, { status: 404 })
  }
  if (!event.isOpen) {
    return NextResponse.json({ error: 'Dit feest is gesloten' }, { status: 403 })
  }

  let body: { name?: unknown; email?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : ''
  const rawEmail = typeof body.email === 'string' ? body.email.trim().slice(0, 160) : ''

  if (name.length < 2) {
    return NextResponse.json({ error: 'Vul je naam in' }, { status: 400 })
  }
  // E-mail is optioneel en wordt niet geverifieerd — enkel vormcontrole
  if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    return NextResponse.json({ error: 'Dat e-mailadres klopt niet' }, { status: 400 })
  }

  const guest = await prisma.weddingGuest.create({
    data: { eventId: event.id, name, email: rawEmail || null },
    select: { id: true, name: true, photoCount: true },
  })

  const res = NextResponse.json({
    name: guest.name,
    photoCount: guest.photoCount,
    photoLimit: event.photoLimit,
  })

  res.cookies.set(guestCookieName(params.slug), serializeGuest(guest.id), guestCookieOptions())

  return res
}
