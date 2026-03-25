'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { formatEuro } from '@/lib/money'
import { useCart } from '@/contexts/CartContext'
import CartQuantityControl from './CartQuantityControl'
import CartPersonalizationSummary from './CartPersonalizationSummary'

export interface CartItem {
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

interface CartItemRowProps {
  item: CartItem
  onChanged?: () => void
  onRemoved?: () => void // backward compat alias
}

export default function CartItemRow({ item, onChanged, onRemoved }: CartItemRowProps) {
  const { refreshCart } = useCart()
  const [removing, setRemoving] = useState(false)

  function handleChanged() {
    refreshCart()
    onChanged?.()
    onRemoved?.()
  }

  async function handleRemove() {
    setRemoving(true)
    await fetch(`/api/cart/items/${item.id}`, { method: 'DELETE' })
    handleChanged()
  }

  // Merge variantName + optionValues into one readable line
  const variantParts: string[] = []
  if (item.variantName) variantParts.push(item.variantName)
  if (item.optionValues) {
    Object.values(item.optionValues).forEach((v) => {
      if (v && !variantParts.includes(v)) variantParts.push(v)
    })
  }
  const variantLabel = variantParts.join(' · ')

  return (
    <div
      className={`flex gap-4 sm:gap-5 py-6 border-b border-[#F0EAD8] last:border-0 transition-opacity ${
        removing ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      {/* Thumbnail — portrait ratio, links to product */}
      <Link
        href={`/webshop/${item.productSlug}`}
        className="shrink-0 w-[72px] h-[90px] sm:w-20 sm:h-[100px] rounded-xl overflow-hidden bg-[#F5F0E8] relative block"
        tabIndex={-1}
        aria-hidden
      >
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt={item.productName}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C4B8A0" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Name + line total */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/webshop/${item.productSlug}`}
              className="text-sm font-semibold text-studio-black leading-snug hover:text-[#8A6A30] transition-colors line-clamp-2"
            >
              {item.productName}
            </Link>
            {variantLabel && (
              <p className="text-xs text-[#8A7A6A] mt-0.5">{variantLabel}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-studio-black tabular-nums">
              {formatEuro(item.unitPriceCents * item.quantity)}
            </p>
            {item.quantity > 1 && (
              <p className="text-[10px] text-[#B5A48A] mt-0.5 tabular-nums">
                {item.quantity} × {formatEuro(item.unitPriceCents)}
              </p>
            )}
          </div>
        </div>

        {/* Personalization */}
        {item.personalization && Object.keys(item.personalization).length > 0 && (
          <CartPersonalizationSummary personalization={item.personalization} />
        )}

        {/* Quantity + remove */}
        <div className="flex items-center justify-between mt-3">
          <CartQuantityControl
            itemId={item.id}
            quantity={item.quantity}
            onChanged={handleChanged}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-[#B5A48A] hover:text-red-400 transition-colors flex items-center gap-1.5 py-1"
            aria-label="Verwijder uit winkelwagen"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
            <span className="hidden sm:inline">Verwijderen</span>
          </button>
        </div>

      </div>
    </div>
  )
}
