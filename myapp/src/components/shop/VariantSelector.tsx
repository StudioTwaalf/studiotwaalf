'use client'

import { formatEuro } from '@/lib/money'

interface Variant {
  id: string
  name: string | null
  color: string | null
  sizeLabel: string | null
  priceCents: number | null
}

interface VariantSelectorProps {
  variants: Variant[]
  selectedId: string | null
  onChange: (variantId: string) => void
}

export default function VariantSelector({ variants, selectedId, onChange }: VariantSelectorProps) {
  if (!variants.length) return null

  const hasColors = variants.some((v) => v.color)

  if (hasColors) {
    return (
      <div className="flex flex-wrap gap-2.5">
        {variants.map((v) => (
          <button
            key={v.id}
            type="button"
            title={v.name ?? undefined}
            onClick={() => onChange(v.id)}
            className={[
              'w-9 h-9 rounded-full transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A46B]/60',
              selectedId === v.id
                ? 'ring-2 ring-offset-2 ring-studio-black scale-110'
                : 'ring-1 ring-[#E0D5C5] hover:scale-105',
            ].join(' ')}
            style={{ background: v.color ?? '#ccc' }}
          />
        ))}
      </div>
    )
  }

  // Pill buttons for non-color variants
  return (
    <div className="flex flex-wrap gap-2">
      {variants.map((v) => {
        const label = v.name ?? v.sizeLabel ?? v.id
        const isSelected = selectedId === v.id
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onChange(v.id)}
            className={[
              'px-4 py-2 text-sm font-medium rounded-xl border-2 transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A46B]/60',
              isSelected
                ? 'border-studio-black bg-studio-black text-white'
                : 'border-[#E0D5C5] text-[#5A4A3A] bg-white hover:border-[#C4B8A0] hover:bg-[#F5F0E8]',
            ].join(' ')}
          >
            {label}
            {v.priceCents != null && (
              <span className={`ml-1.5 text-xs ${isSelected ? 'text-white/70' : 'text-[#B5A48A]'}`}>
                {formatEuro(v.priceCents)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
