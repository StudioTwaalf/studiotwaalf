import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { normalizeGadgetsPayload } from '@/lib/personalization/effective'
import { sendOfferteBevestiging } from '@/lib/email'

// ─── POST /api/offer-requests — submit a quote request ───────────────────────

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { templateId, designId, notes, expectedDate, items, totalCents } = body

  if (!templateId || !designId) {
    return NextResponse.json(
      { error: 'templateId and designId are required' },
      { status: 400 },
    )
  }

  // Verify the design belongs to this user
  const design = await prisma.design.findFirst({
    where: { id: designId, userId: token.id as string },
  })

  if (!design) {
    return NextResponse.json({ error: 'Design not found' }, { status: 404 })
  }

  // Derive items and total from saved gadgets if not supplied by client
  let resolvedItems = items ?? null
  let resolvedTotal = totalCents ?? 0

  if (!resolvedItems) {
    const { items: gadgetItems } = normalizeGadgetsPayload(design.gadgets)
    resolvedItems = gadgetItems.map((g) => ({
      gadgetId:   g.id,
      name:       g.name,
      priceCents: g.priceCents ?? 0,
      quantity:   g.quantity   ?? 1,
    }))
    resolvedTotal = resolvedItems.reduce(
      (sum: number, i: { priceCents: number; quantity: number }) =>
        sum + i.priceCents * i.quantity,
      0,
    )
  }

  const offerRequest = await prisma.offerRequest.create({
    data: {
      userId:          token.id as string,
      templateId,
      designId,
      notes:           notes        ?? null,
      expectedDueDate: expectedDate ? new Date(expectedDate) : null,
      totalCents:      resolvedTotal,
      itemsJson:       resolvedItems,
    },
  })

  // ── event: quote.requested ─────────────────────────────────────────────────
  // Fetch user + template for email context (fire-and-forget, never blocks response)
  prisma.user.findUnique({
    where: { id: token.id as string },
    select: { firstName: true, lastName: true, email: true },
  }).then(async (user) => {
    if (!user?.email) return

    const template = await prisma.template.findUnique({
      where: { id: templateId },
      select: { name: true },
    })

    const customerName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Klant'

    await sendOfferteBevestiging({
      id:            offerRequest.id,
      concept:       template?.name ?? 'jouw concept',
      customerEmail: user.email,
      customerName,
    })
  }).catch((err) => console.error('[offer-requests] Email error:', err))
  // ──────────────────────────────────────────────────────────────────────────

  return NextResponse.json(offerRequest, { status: 201 })
}
