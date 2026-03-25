import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import type { GadgetsPayload } from '@/lib/gadget-personalization'

// ─── POST /api/design/gadgets — save gadget selections ────────────────────────

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { designId, items, global, overrides } = body as {
    designId:  string
    items:     GadgetsPayload['items']
    global:    GadgetsPayload['global']
    overrides: GadgetsPayload['overrides']
  }

  if (!designId) {
    return NextResponse.json({ error: 'designId is required' }, { status: 400 })
  }

  const design = await prisma.design.findFirst({
    where: { id: designId, userId: token.id as string },
  })

  if (!design) {
    return NextResponse.json({ error: 'Design not found' }, { status: 404 })
  }

  const payload: GadgetsPayload = {
    items:     items     ?? [],
    global:    global    ?? {},
    overrides: overrides ?? {},
  }

  await prisma.design.update({
    where: { id: designId },
    data:  { gadgets: payload as object },
  })

  return NextResponse.json({ ok: true })
}
