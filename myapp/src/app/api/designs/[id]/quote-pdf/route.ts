import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { renderToStream } from '@react-pdf/renderer'
import QuotePdf from '@/lib/pdf/QuotePdf'
import { normalizeGadgetsPayload } from '@/lib/personalization/effective'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const design = await prisma.design.findFirst({
    where: { id: params.id, userId: token.id as string },
    include: { template: true },
  })

  if (!design) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { items } = normalizeGadgetsPayload(design.gadgets)
  const quoteMeta = design.quoteMetaJson as { notes?: string; expectedDate?: string } | null

  // Map SelectedGadget → QuotePdf item shape
  const pdfItems = items.map((g) => ({
    id:         g.id,
    name:       g.name,
    priceCents: g.priceCents ?? 0,
    personalizationText: g.personalizedText ?? null,
  }))

  const totalCents = pdfItems.reduce((sum, g) => sum + g.priceCents, 0)

  const pdfStream = await renderToStream(
    QuotePdf({
      templateName: design.template.name,
      designName:   design.name,
      items:        pdfItems,
      totalCents,
    }),
  )

  const chunks: Buffer[] = []
  for await (const chunk of pdfStream as AsyncIterable<Buffer>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const buffer = Buffer.concat(chunks)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="offerte-${params.id}.pdf"`,
    },
  })
}
