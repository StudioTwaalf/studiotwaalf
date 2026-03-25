import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateCart } from '@/lib/shop/cart-session'
import { calcShipping } from '@/lib/shop/shipping'
import { generateOrderNumber } from '@/lib/shop/order-number'
import { getToken } from 'next-auth/jwt'
import { Prisma } from '@prisma/client'

// POST /api/shop/orders — create order from cart + checkout form data
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    customerName,
    customerEmail,
    customerPhone,
    shippingName,
    shippingStreet,
    shippingNumber,
    shippingZip,
    shippingCity,
    shippingCountry = 'BE',
    customerNotes,
  } = body

  if (!customerName || !customerEmail || !shippingStreet || !shippingNumber || !shippingZip || !shippingCity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { cart } = await getOrCreateCart(req)

  if (!cart.items.length) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const userId = token?.sub ?? null

  // Calc totals
  const subtotalCents = cart.items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0
  )
  const shippingCents = calcShipping(shippingCountry, subtotalCents)
  const totalCents = subtotalCents + shippingCents

  const orderNumber = await generateOrderNumber()

  // Build order items with snapshots
  const itemsData = cart.items.map((item) => ({
    productId: item.productId,
    productName: item.product.nameNl,
    variantName: item.variant?.name ?? null,
    unitPriceCents: item.unitPriceCents,
    quantity: item.quantity,
    totalCents: item.unitPriceCents * item.quantity,
    personalization: item.personalization ?? Prisma.JsonNull,
    optionValues: item.optionValues ?? Prisma.JsonNull,
  }))

  const order = await prisma.shopOrder.create({
    data: {
      orderNumber,
      userId,
      customerName,
      customerEmail,
      customerPhone: customerPhone ?? null,
      shippingName: shippingName || customerName,
      shippingStreet,
      shippingNumber,
      shippingZip,
      shippingCity,
      shippingCountry,
      subtotalCents,
      shippingCents,
      totalCents,
      customerNotes: customerNotes ?? null,
      items: { create: itemsData },
    },
    include: { items: true },
  })

  // Clear cart
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })

  return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber })
}
