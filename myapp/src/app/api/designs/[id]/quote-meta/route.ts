import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

// ─── PATCH /api/designs/[id]/quote-meta ───────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const design = await prisma.design.findFirst({
    where: { id: params.id, userId: token.id as string },
  })

  if (!design) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json()
  const { notes, expectedDate } = body

  const updated = await prisma.design.update({
    where: { id: params.id },
    data:  { quoteMetaJson: { notes: notes ?? null, expectedDate: expectedDate ?? null } },
  })

  return NextResponse.json(updated)
}
