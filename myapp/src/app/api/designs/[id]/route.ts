import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

// ─── GET /api/designs/[id] ────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

  return NextResponse.json(design)
}

// ─── PATCH /api/designs/[id] — autosave ───────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.design.findFirst({
    where: { id: params.id, userId: token.id as string },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json()
  const { name, data, gadgets, quoteMetaJson } = body

  const updated = await prisma.design.update({
    where: { id: params.id },
    data: {
      ...(name          !== undefined && { name }),
      ...(data          !== undefined && { data }),
      ...(gadgets       !== undefined && { gadgets }),
      ...(quoteMetaJson !== undefined && { quoteMetaJson }),
    },
  })

  return NextResponse.json(updated)
}
