import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMolliePaymentStatus } from '@/lib/shop/mollie'
import { sendBestelbevestiging } from '@/lib/email'

// POST /api/shop/payment-webhook — Mollie webhook handler
export async function POST(req: NextRequest) {
  // Verify webhook secret
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== (process.env.MOLLIE_WEBHOOK_SECRET ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.formData().catch(() => null)
  const molliePaymentId = body?.get('id')?.toString()

  if (!molliePaymentId) {
    return NextResponse.json({ error: 'Missing payment id' }, { status: 400 })
  }

  // Find order by Mollie payment ID
  const order = await prisma.shopOrder.findFirst({
    where: { molliePaymentId },
  })

  if (!order) {
    // Mollie may call for unknown payments (e.g. test), just return 200
    return NextResponse.json({ ok: true })
  }

  // Fetch current status from Mollie
  const mollieStatus = await getMolliePaymentStatus(molliePaymentId)

  const statusMap: Record<string, { paymentStatus: 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED'; status: 'PAID' | 'IN_PROGRESS' | 'CANCELLED' }> = {
    paid:      { paymentStatus: 'PAID',      status: 'IN_PROGRESS' },
    failed:    { paymentStatus: 'FAILED',    status: 'CANCELLED'   },
    cancelled: { paymentStatus: 'CANCELLED', status: 'CANCELLED'   },
    expired:   { paymentStatus: 'EXPIRED',   status: 'CANCELLED'   },
  }

  const update = statusMap[mollieStatus]
  if (update) {
    await prisma.shopOrder.update({
      where: { id: order.id },
      data: {
        paymentStatus: update.paymentStatus,
        status:        update.status,
        paidAt:        mollieStatus === 'paid' ? new Date() : null,
      },
    })

    // Send confirmation email only when payment succeeds (idempotent — safe on retries)
    if (mollieStatus === 'paid') {
      sendBestelbevestiging(order).catch((err) =>
        console.error('[webhook] Email error:', err)
      )
    }
  }

  return NextResponse.json({ ok: true })
}
