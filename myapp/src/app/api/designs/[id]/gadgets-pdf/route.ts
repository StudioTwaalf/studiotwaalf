import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { renderToStream } from '@react-pdf/renderer'
import GadgetsPdf from '@/lib/pdf/GadgetsPdf'
import { buildGadgetPdfItems, type GadgetProductData } from '@/lib/personalization/effective'

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

  // Build product map for PDF rendering
  const products = await prisma.product.findMany({ where: { isActive: true } })
  const productMap = new Map<string, GadgetProductData>(
    products.map((p) => [p.id, {
      basePriceCents:    p.basePriceCents,
      imageUrl:          null, // TODO: resolve from ProductAsset relation
      previewConfigJson: p.configJson,
    }]),
  )

  const gadgetItems = buildGadgetPdfItems(design.gadgets, productMap)

  const pdfStream = await renderToStream(
    GadgetsPdf({
      designId:     design.id,
      templateName: design.template.name,
      gadgets:      gadgetItems,
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
      'Content-Disposition': `attachment; filename="gadgets-${params.id}.pdf"`,
    },
  })
}
