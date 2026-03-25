import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/shop/products/[slug] — public product detail for webshop
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug, isActive: true, isVisibleInShop: true },
    select: {
      id:               true,
      slug:             true,
      nameNl:           true,
      descriptionNl:    true,
      basePriceCents:   true,
      isPersonalizable: true,
      requiresDiyFlow:  true,
      diyTemplateId:    true,
      stockQuantity:    true,
      category: { select: { nameNl: true, slug: true } },
      assets:   { orderBy: { sortOrder: 'asc' }, select: { url: true, altNl: true } },
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id:                true,
          name:              true,
          color:             true,
          sizeLabel:         true,
          priceCents:        true,
          thumbnailImageUrl: true,
          isDefault:         true,
        },
      },
    },
  })

  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(product)
}
