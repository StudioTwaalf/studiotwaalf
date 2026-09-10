import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── /w/[slug]/manifest — het app-manifest van één feest ─────────────────────
//
// Bewust per feest en niet één voor de hele site: zo krijgt het icoon op de
// telefoon van de gast de namen van het koppel, en opent het rechtstreeks de
// juiste camera. Twee bruiloften op één toestel geven dus twee iconen.

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const event = await prisma.weddingEvent.findUnique({
    where: { slug: params.slug },
    select: { slug: true, coupleName: true },
  })

  if (!event) {
    return NextResponse.json({ error: 'Onbekend feest' }, { status: 404 })
  }

  const manifest = {
    name: `${event.coupleName} — wegwerpcamera`,
    short_name: event.coupleName,
    description: `Maak foto's op het feest van ${event.coupleName}.`,
    start_url: `/w/${event.slug}`,
    scope: `/w/${event.slug}`,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#111111',
    theme_color: '#111111',
    icons: [
      { src: '/camera/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/camera/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Ruime marge in het icoon, dus Android mag hem ook bijsnijden
      { src: '/camera/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      // Kort cachen: de namen van het koppel veranderen zelden, maar we willen
      // een hernoeming wel binnen het uur terugzien.
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
