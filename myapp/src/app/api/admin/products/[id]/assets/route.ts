import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

function isAdmin(): boolean {
  return cookies().get('admin_session')?.value === 'authenticated'
}

// POST /api/admin/products/[id]/assets — add a new product asset
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdmin()) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

  const { url, altNl } = await req.json() as { url: string; altNl?: string }
  if (!url) return NextResponse.json({ error: 'url is verplicht' }, { status: 400 })

  // Determine sortOrder (append after existing assets)
  const lastAsset = await prisma.productAsset.findFirst({
    where: { productId: params.id },
    orderBy: { sortOrder: 'desc' },
  })

  const asset = await prisma.productAsset.create({
    data: {
      productId: params.id,
      url,
      altNl: altNl ?? null,
      sortOrder: (lastAsset?.sortOrder ?? -1) + 1,
    },
  })

  return NextResponse.json(asset)
}
