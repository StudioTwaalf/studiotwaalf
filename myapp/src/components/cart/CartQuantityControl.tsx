'use client'

import { useState } from 'react'

interface CartQuantityControlProps {
  itemId: string
  quantity: number
  onChanged: () => void
}

export default function CartQuantityControl({ itemId, quantity, onChanged }: CartQuantityControlProps) {
  const [qty, setQty] = useState(quantity)
  const [busy, setBusy] = useState(false)

  async function update(next: number) {
    if (next === qty || busy) return
    setBusy(true)
    setQty(next) // optimistic
    try {
      await fetch(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: next }),
      })
      onChanged()
    } catch {
      setQty(qty) // revert on error
    } finally {
      setBusy(false)
    }
  }

  const btnClass =
    'w-8 h-8 flex items-center justify-center rounded-lg border border-[#E0D5C5] text-[#7A6A52] ' +
    'hover:bg-[#F5F0E8] hover:border-[#C4B8A0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => update(qty - 1)}
        disabled={busy || qty <= 1}
        className={btnClass}
        aria-label="Minder"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M5 12h14" />
        </svg>
      </button>

      <span className="w-8 text-center text-sm font-semibold text-studio-black tabular-nums select-none">
        {qty}
      </span>

      <button
        type="button"
        onClick={() => update(qty + 1)}
        disabled={busy}
        className={btnClass}
        aria-label="Meer"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  )
}
