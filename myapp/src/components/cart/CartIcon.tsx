'use client'

import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'

export default function CartIcon() {
  const { cartCount } = useCart()

  return (
    <Link
      href="/winkelwagen"
      className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-black/[0.04] transition-colors"
      aria-label={`Winkelwagen${cartCount > 0 ? ` (${cartCount} items)` : ''}`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#111111"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-studio-yellow text-[#2C2416] text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      )}
    </Link>
  )
}
