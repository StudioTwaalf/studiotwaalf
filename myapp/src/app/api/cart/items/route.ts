import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateCart, setCartCookie } from '@/lib/shop/cart-session'

// POST /api/cart/items — add item to cart
export async function POST(req: NextRequest) {
  const { cart, sessionId } = await getOrCreateCart(req)
  const body = await req.json()

  const { productId, variantId, quantity = 1, personalization, optionValues } = body

  if (!productId || quantity < 1) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  // Fetch product to get price
  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true, isVisibleInShop: true },
    include: { variants: { where: { isActive: true } } },
  })

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Resolve price: variant price or product base price
  let unitPriceCents = product.basePriceCents
  if (variantId) {
    const variant = product.variants.find((v) => v.id === variantId)
    if (variant?.priceCents != null) unitPriceCents = variant.priceCents
  }

  // Check if this product+variant combo is already in cart → update qty
  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantId: variantId ?? null },
  })

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    })
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId: variantId ?? null,
        quantity,
        unitPriceCents,
        personalization: personalization ?? null,
        optionValues: optionValues ?? null,
      },
    })
  }

  const res = NextResponse.json({ ok: true })
  setCartCookie(res, sessionId)
  return res
}
