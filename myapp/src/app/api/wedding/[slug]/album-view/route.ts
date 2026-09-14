import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── POST /api/wedding/[slug]/album-view — een albumbezoek tellen ────────────
//
// Waarom via een aparte route en niet gewoon bij het renderen van de pagina:
//
//  • Een server component mag geen cookie zetten, en zonder cookie kunnen we
//    terugkerende bezoekers niet van nieuwe onderscheiden.
//  • Dit wordt vanuit de browser aangeroepen, dus zoekmachines en linkbots
//    die geen javascript draaien tellen niet mee. Dat houdt het cijfer eerlijk.
//
// Het totaal loopt op bij elke opening; het bezoekersaantal alleen de eerste
// keer per toestel. Dat tweede cijfer is het interessante.

const COOKIE_MAXAGE = 60 * 60 * 24 * 365 // een jaar

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const event = await prisma.weddingEvent.findUnique({
    where: { slug: params.slug },
    select: { id: true, revealAt: true },
  })

  // Alleen tellen als het album ook echt open is. Anders tellen we de mensen
  // die op een dichte galerij belanden mee, en dat vertekent.
  if (!event || !event.revealAt || event.revealAt > new Date()) {
    return NextResponse.json({ geteld: false }, { status: 200 })
  }

  const cookieNaam = `wa_${params.slug.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const alGezien = req.cookies.get(cookieNaam)?.value === '1'

  await prisma.weddingEvent.update({
    where: { id: event.id },
    data: {
      albumViews: { increment: 1 },
      ...(alGezien ? {} : { albumVisitors: { increment: 1 } }),
      albumLastViewAt: new Date(),
    },
  })

  const res = NextResponse.json({ geteld: true, nieuw: !alGezien })

  if (!alGezien) {
    res.cookies.set(cookieNaam, '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAXAGE,
      path: '/',
    })
  }

  return res
}
