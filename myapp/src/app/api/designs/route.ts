import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

// ─── GET /api/designs — list designs for the current user ────────────────────

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const designs = await prisma.design.findMany({
    where:   { userId: token.id as string },
    orderBy: { updatedAt: 'desc' },
    include: { template: { select: { id: true, name: true, category: true, thumbnail: true } } },
  })

  return NextResponse.json(designs)
}

// ─── POST /api/designs — create a new design ─────────────────────────────────

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { templateId, name, data, gadgets } = body

  if (!templateId || !data) {
    return NextResponse.json({ error: 'templateId and data are required' }, { status: 400 })
  }

  const template = await prisma.template.findUnique({ where: { id: templateId } })
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const design = await prisma.design.create({
    data: {
      templateId,
      userId: token.id as string,
      name:   name ?? null,
      data,
      gadgets: gadgets ?? null,
    },
  })

  return NextResponse.json(design, { status: 201 })
}
