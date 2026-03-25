import { createMollieClient } from '@mollie/api-client'
import type { ShopOrder } from '@prisma/client'

function getMollie() {
  const key = process.env.MOLLIE_API_KEY
  if (!key) throw new Error('MOLLIE_API_KEY is not set')
  return createMollieClient({ apiKey: key })
}

interface MolliePaymentResult {
  id: string
  checkoutUrl: string
}

export async function createMolliePayment(
  order: ShopOrder & { items: { productName: string; quantity: number }[] }
): Promise<MolliePaymentResult> {
  const mollie = getMollie()
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const webhookSecret = process.env.MOLLIE_WEBHOOK_SECRET ?? ''

  const description = `Studio Twaalf bestelling ${order.orderNumber}`

  const payment = await mollie.payments.create({
    amount: {
      currency: 'EUR',
      value: (order.totalCents / 100).toFixed(2),
    },
    description,
    redirectUrl: `${baseUrl}/bestellen/bevestiging?orderId=${order.id}`,
    webhookUrl: `${baseUrl}/api/shop/payment-webhook?secret=${webhookSecret}`,
    metadata: { orderId: order.id, orderNumber: order.orderNumber },
  })

  const checkoutUrl = payment._links?.checkout?.href
  if (!checkoutUrl) throw new Error('Mollie did not return a checkout URL')

  return { id: payment.id, checkoutUrl }
}

export async function getMolliePaymentStatus(molliePaymentId: string): Promise<string> {
  const mollie = getMollie()
  const payment = await mollie.payments.get(molliePaymentId)
  return payment.status
}
