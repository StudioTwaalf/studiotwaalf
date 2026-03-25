import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createMolliePayment } from '@/lib/shop/mollie'
import { sendBestelbevestiging } from '@/lib/email'

// POST /api/shop/orders/[id]/payment — initiate Mollie payment
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const order = await prisma.shopOrder.findUnique({
    where: { id },
    include: { items: true },
  })

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  if (order.paymentStatus === 'PAID') {
    return NextResponse.json({ error: 'Order already paid' }, { status: 400 })
  }

  // If Mollie already initiated, return existing URL
  if (order.mollieCheckoutUrl && order.status === 'AWAITING_PAYMENT') {
    return NextResponse.json({ checkoutUrl: order.mollieCheckoutUrl })
  }

  // ── Dev bypass ────────────────────────────────────────────────────────────
  // When MOLLIE_API_KEY is not configured, skip Mollie entirely and mark the
  // order as paid so the full flow can be tested without external dependencies.
  // Add MOLLIE_API_KEY to .env to enable real Mollie payments.
  if (!process.env.MOLLIE_API_KEY) {
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

    await prisma.shopOrder.update({
      where: { id },
      data: {
        status:            'IN_PROGRESS',
        paymentStatus:     'PAID',
        paidAt:            new Date(),
        molliePaymentId:   'dev-bypass',
        mollieCheckoutUrl: null,
      },
    })

    console.log(`[payment] DEV BYPASS — order ${order.orderNumber} marked as PAID (no MOLLIE_API_KEY set)`)

    // Fire-and-forget: confirmation email (idempotent — safe to call even if called twice)
    sendBestelbevestiging(order).catch((err) =>
      console.error('[payment] Email error (dev bypass):', err)
    )

    return NextResponse.json({ checkoutUrl: `${baseUrl}/bestellen/bevestiging?orderId=${id}` })
  }
  // ─────────────────────────────────────────────────────────────────────────

  try {
    const { id: mollieId, checkoutUrl } = await createMolliePayment(order)

    await prisma.shopOrder.update({
      where: { id },
      data: {
        molliePaymentId: mollieId,
        mollieCheckoutUrl: checkoutUrl,
        status: 'AWAITING_PAYMENT',
      },
    })

    return NextResponse.json({ checkoutUrl })
  } catch (err) {
    console.error('[payment] Mollie error:', err)
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 })
  }
}
