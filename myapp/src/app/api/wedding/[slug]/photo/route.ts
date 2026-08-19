import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getStorageProvider } from '@/lib/storage'
import { getGuestFromRequest } from '@/lib/wedding/guest'

// ─── POST /api/wedding/[slug]/photo — één foto uit het filmpje ───────────────
//
// De client comprimeert al naar ~1600px JPEG (< 1 MB), dus de foto mag door
// deze route.  Groeit dat ooit, stap dan over op de client-upload van
// @vercel/blob (handleUpload) — de limietcontrole hieronder verhuist dan naar
// onBeforeGenerateToken.
//
// De limiet wordt ATOMAIR gereserveerd (updateMany met photoCount < limit),
// zodat een wachtrij die vijf foto's tegelijk instuurt niet over de limiet
// glipt.  Mislukt de upload daarna, dan geven we de plek weer vrij.

export const maxDuration = 30

const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const event = await prisma.weddingEvent.findUnique({
    where: { slug: params.slug },
    select: { id: true, isOpen: true, photoLimit: true },
  })

  if (!event) return NextResponse.json({ error: 'Onbekend feest' }, { status: 404 })
  if (!event.isOpen) return NextResponse.json({ error: 'Dit feest is gesloten' }, { status: 403 })

  const guest = await getGuestFromRequest(req, event.id, params.slug)
  if (!guest) {
    return NextResponse.json({ error: 'Niet ingecheckt', code: 'NO_SESSION' }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get('file')
  const clientId = String(form.get('clientId') ?? '').slice(0, 64) || null
  const width = Number(form.get('width') ?? 0) || 0
  const height = Number(form.get('height') ?? 0) || 0

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Geen foto ontvangen' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Foto te groot' }, { status: 413 })
  }

  const mimeType = ALLOWED.has(file.type) ? file.type : 'image/jpeg'

  // Retry van een foto die al binnen is? Geef gewoon het bestaande resultaat terug.
  if (clientId) {
    const existing = await prisma.weddingPhoto.findUnique({
      where: { guestId_clientId: { guestId: guest.id, clientId } },
      select: { url: true },
    })
    if (existing) {
      const fresh = await prisma.weddingGuest.findUnique({
        where: { id: guest.id },
        select: { photoCount: true },
      })
      return NextResponse.json({
        url: existing.url,
        duplicate: true,
        photoCount: fresh?.photoCount ?? guest.photoCount,
        remaining: Math.max(0, event.photoLimit - (fresh?.photoCount ?? guest.photoCount)),
      })
    }
  }

  // Reserveer een plek op het filmpje — atomair
  const reserved = await prisma.weddingGuest.updateMany({
    where: { id: guest.id, photoCount: { lt: event.photoLimit } },
    data: { photoCount: { increment: 1 } },
  })

  if (reserved.count === 0) {
    return NextResponse.json(
      { error: 'Je filmpje is vol', code: 'LIMIT_REACHED', remaining: 0 },
      { status: 409 },
    )
  }

  const releaseSlot = () =>
    prisma.weddingGuest
      .update({ where: { id: guest.id }, data: { photoCount: { decrement: 1 } } })
      .catch(() => undefined)

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
    const upload = await getStorageProvider().upload(
      buffer,
      `${params.slug}-${guest.id}-${clientId ?? Date.now()}.${ext}`,
      mimeType,
    )

    const photo = await prisma.weddingPhoto.create({
      data: {
        eventId: event.id,
        guestId: guest.id,
        url: upload.url,
        width,
        height,
        sizeBytes: upload.sizeBytes ?? buffer.length,
        clientId,
      },
      select: { url: true },
    })

    const photoCount = guest.photoCount + 1

    return NextResponse.json({
      url: photo.url,
      photoCount,
      remaining: Math.max(0, event.photoLimit - photoCount),
    })
  } catch (err) {
    // Twee gelijktijdige retries met dezelfde clientId — de tweede verliest
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      await releaseSlot()
      return NextResponse.json({ duplicate: true }, { status: 200 })
    }

    await releaseSlot()
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[wedding/photo] upload mislukt:', msg)
    return NextResponse.json({ error: 'Uploaden mislukt' }, { status: 500 })
  }
}
