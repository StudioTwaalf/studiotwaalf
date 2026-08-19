import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getGuestFromRequest } from '@/lib/wedding/guest'

// ─── GET /api/wedding/[slug]/me — stand van het filmpje ──────────────────────
// Gebruikt door de camera om na een herstart te hersynchroniseren met de server.

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const event = await prisma.weddingEvent.findUnique({
    where: { slug: params.slug },
    select: { id: true, isOpen: true, photoLimit: true },
  })

  if (!event) return NextResponse.json({ error: 'Onbekend feest' }, { status: 404 })

  const guest = await getGuestFromRequest(req, event.id, params.slug)
  if (!guest) return NextResponse.json({ checkedIn: false }, { status: 200 })

  return NextResponse.json({
    checkedIn: true,
    name: guest.name,
    photoCount: guest.photoCount,
    photoLimit: event.photoLimit,
    remaining: Math.max(0, event.photoLimit - guest.photoCount),
    isOpen: event.isOpen,
  })
}
