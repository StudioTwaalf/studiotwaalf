import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateCart, setCartCookie } from '@/lib/shop/cart-session'

// PATCH /api/cart/items/[id] — update quantity
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { cart, sessionId } = await getOrCreateCart(req)
  const { id } = await params
  const { quantity } = await req.json()

  if (quantity < 1) {
    return NextResponse.json({ error: 'Quantity must be >= 1' }, { status: 400 })
  }

  // Ensure item belongs to this cart
  const item = await prisma.cartItem.findFirst({ where: { id, cartId: cart.id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.cartItem.update({ where: { id }, data: { quantity } })

  const res = NextResponse.json({ ok: true })
  setCartCookie(res, sessionId)
  return res
}

// DELETE /api/cart/items/[id] — remove item
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { cart, sessionId } = await getOrCreateCart(req)
  const { id } = await params

  const item = await prisma.cartItem.findFirst({ where: { id, cartId: cart.id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.cartItem.delete({ where: { id } })

  const res = NextResponse.json({ ok: true })
  setCartCookie(res, sessionId)
  return res
}
