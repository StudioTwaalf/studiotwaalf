import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

function isAdmin(): boolean {
  return cookies().get('admin_session')?.value === 'authenticated'
}

// DELETE /api/admin/products/[id]/assets/[assetId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; assetId: string } }
) {
  if (!isAdmin()) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

  await prisma.productAsset.deleteMany({
    where: { id: params.assetId, productId: params.id },
  })

  return NextResponse.json({ ok: true })
}
