'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import CartItemRow from '@/components/cart/CartItemRow'
import CartSummary from '@/components/cart/CartSummary'
import { trackEcommerce, toEcommerceItem } from '@/lib/analytics'

interface CartItem {
  id: string
  productName: string
  productSlug: string
  thumbnailUrl: string | null
  variantName: string | null
  quantity: number
  unitPriceCents: number
  personalization: Record<string, string> | null
  optionValues?: Record<string, string> | null
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const viewCartFiredRef = useRef(false)

  const fetchCart = useCallback(async () => {
    const res = await fetch('/api/cart')
    if (res.ok) {
      const data = await res.json()
      setItems(data.items ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchCart() }, [fetchCart])

  const subtotalCents = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0)

  // GA4: view_cart — fires once when non-empty cart is loaded
  useEffect(() => {
    if (loading || items.length === 0 || viewCartFiredRef.current) return
    viewCartFiredRef.current = true
    trackEcommerce({
      event:    'view_cart',
      currency: 'EUR',
      value:    subtotalCents / 100,
      items:    items.map((item, idx) =>
        toEcommerceItem({
          id:        item.productSlug,
          name:      item.productName,
          variant:   item.variantName,
          priceCents: item.unitPriceCents,
          quantity:  item.quantity,
          index:     idx,
        })
      ),
    })
  }, [loading, items, subtotalCents])

  if (loading) {
    return (
      <div className="bg-studio-beige min-h-screen pt-24">
        <div className="max-w-6xl mx-auto px-6 py-20 flex justify-center">
          <div className="w-8 h-8 border-2 border-studio-yellow border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-studio-beige min-h-screen">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 pt-24 pb-20">

        {/* Header */}
        <div className="mb-8">
          <Link href="/webshop" className="text-sm text-[#8A7A6A] hover:text-studio-black transition-colors flex items-center gap-1 mb-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Verder winkelen
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-studio-black">Winkelwagen</h1>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EDE7D9] py-16 px-8 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-[#F5F0E8] flex items-center justify-center mx-auto mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B5A48A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <p className="font-serif text-xl font-semibold text-studio-black mb-2">Je winkelwagen is leeg</p>
            <p className="text-[#8A7A6A] text-sm mb-7 leading-relaxed">
              Ontdek onze collectie en voeg je favorieten toe.
            </p>
            <Link
              href="/webshop"
              className="inline-flex items-center gap-2 bg-studio-black text-white text-sm font-semibold px-7 py-3 rounded-xl hover:bg-[#2C2416] transition-colors"
            >
              Bekijk de collectie
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">

            {/* Items */}
            <div className="bg-white rounded-2xl border border-[#EDE7D9] px-5 sm:px-7">
              {items.map((item) => (
                <CartItemRow key={item.id} item={item} onChanged={fetchCart} />
              ))}
            </div>

            {/* Summary + CTA */}
            <div className="lg:sticky lg:top-8 space-y-3">
              <CartSummary subtotalCents={subtotalCents} />
              <Link
                href="/bestellen"
                className="w-full flex items-center justify-center gap-2 bg-studio-black text-white text-sm font-semibold px-6 py-4 rounded-xl hover:bg-[#2C2416] transition-colors"
              >
                Bestelling plaatsen
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
