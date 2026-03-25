import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateCart, setCartCookie } from '@/lib/shop/cart-session'

// GET /api/cart — returns current cart with items
export async function GET(req: NextRequest) {
  try {
    const { cart, sessionId } = await getOrCreateCart(req)

    const res = NextResponse.json({
      id: cart.id,
      items: cart.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.nameNl,
        productSlug: item.product.slug,
        thumbnailUrl:
          item.variant?.thumbnailImageUrl ??
          item.product.thumbnailImageUrl ??
          item.product.assets[0]?.url ??
          null,
        variantId: item.variantId,
        variantName: item.variant?.name ?? null,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        personalization: item.personalization,
        optionValues: item.optionValues,
      })),
    })

    setCartCookie(res, sessionId)
    return res
  } catch {
    return NextResponse.json({ id: null, items: [] })
  }
}
