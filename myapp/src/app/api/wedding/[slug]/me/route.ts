import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getGuestFromRequest } from '@/lib/wedding/guest'

// ─── GET /api/wedding/[slug]/me — stand van het filmpje ──────────────────────
// Gebruikt door de camera om na een herstart te hersynchroniseren met de server.

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
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
  } catch (err) {
    // Geen interne details naar buiten: enkel een korte code waarmee wij
    // in de logs (en tijdens het opzetten) de oorzaak kunnen herkennen.
    const code =
      err instanceof Prisma.PrismaClientKnownRequestError
        ? err.code
        : err instanceof Prisma.PrismaClientInitializationError
          ? `INIT_${err.errorCode ?? 'onbekend'}`
          : err instanceof Error
            ? err.name
            : 'onbekend'

    console.error('[wedding/me] mislukt:', code, err)
    return NextResponse.json({ error: 'Serverfout', code }, { status: 500 })
  }
}
