'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { trackEcommerce, type EcommerceItem } from '@/lib/analytics'

interface AddToCartButtonProps {
  productId:        string
  variantId:        string | null
  quantity:         number
  personalization:  Record<string, string>
  disabled?:        boolean
  /** GA4 ecommerce item data — pass for accurate add_to_cart tracking. */
  ecommerceItem?:   EcommerceItem
}

export default function AddToCartButton({
  productId,
  variantId,
  quantity,
  personalization,
  disabled,
  ecommerceItem,
}: AddToCartButtonProps) {
  const { refreshCart } = useCart()
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleAdd() {
    setState('loading')
    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          variantId: variantId || undefined,
          quantity,
          personalization: Object.keys(personalization).length ? personalization : undefined,
        }),
      })
      if (!res.ok) throw new Error()
      setState('success')
      refreshCart()

      // GA4: add_to_cart — only fires when we have item context
      if (ecommerceItem) {
        const item: EcommerceItem = { ...ecommerceItem, quantity }
        trackEcommerce({
          event:    'add_to_cart',
          currency: 'EUR',
          value:    item.price * quantity,
          items:    [item],
        })
      }

      setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 2000)
    }
  }

  const isLoading = state === 'loading'
  const isSuccess = state === 'success'

  return (
    <button
      onClick={handleAdd}
      disabled={isLoading || disabled}
      className={[
        'w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200',
        isSuccess
          ? 'bg-[#A8BFA3] text-white'
          : 'bg-studio-black text-white hover:bg-[#2C2416] disabled:opacity-60 disabled:cursor-not-allowed',
      ].join(' ')}
    >
      {isLoading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {isSuccess ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Toegevoegd
        </>
      ) : isLoading ? (
        'Toevoegen...'
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          Voeg toe aan winkelwagen
        </>
      )}
    </button>
  )
}
