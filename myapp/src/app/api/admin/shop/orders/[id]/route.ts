import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

function isAdminToken(token: unknown) {
  return (token as { isAdmin?: boolean } | null)?.isAdmin === true
}

// GET /api/admin/shop/orders/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!isAdminToken(token)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const order = await prisma.shopOrder.findUnique({
    where: { id },
    include: { items: true },
  })

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(order)
}

// PATCH /api/admin/shop/orders/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!isAdminToken(token)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { status, internalNotes } = await req.json()

  const updated = await prisma.shopOrder.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(internalNotes !== undefined ? { internalNotes } : {}),
    },
  })

  return NextResponse.json(updated)
}
