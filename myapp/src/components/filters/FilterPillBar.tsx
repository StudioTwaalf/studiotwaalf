'use client'

/**
 * FilterPillBar — shared premium pill-style filter bar.
 *
 * Used by:
 *   - Public templates page  (category filter)
 *   - Gadget picker           (category filter)
 *   - Future webshop          (any listing filter)
 *
 * Design language: soft pills, warm brand palette, subtle hover states.
 */

import type { FilterOption } from '@/lib/filters'

interface Props {
  options:    FilterOption[]
  value:      string
  onChange:   (value: string) => void
  /** Label for the "show all" pill. Default: "Alles" */
  allLabel?:  string
  /** Show item counts next to labels */
  showCount?: boolean
  className?: string
}

export default function FilterPillBar({
  options,
  value,
  onChange,
  allLabel  = 'Alles',
  showCount = false,
  className = '',
}: Props) {
  const allOption: FilterOption = { value: '', label: allLabel }
  const allOptions = [allOption, ...options]

  return (
    <div className={['flex gap-2 overflow-x-auto scrollbar-hide pb-0.5', className].join(' ')}>
      {allOptions.map((opt) => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              'shrink-0 rounded-full px-4 py-1.5 text-xs font-medium',
              'transition-all duration-150 whitespace-nowrap',
              isActive
                ? 'bg-[#2C2416] text-[#F4EFE6] shadow-sm'
                : 'bg-white border border-[#E0D5C5] text-[#7A6A52]' +
                  ' hover:border-[#B5A48A] hover:text-[#2C2416]',
            ].join(' ')}
          >
            {opt.label}
            {showCount && opt.count !== undefined && (
              <span className={[
                'ml-1.5 tabular-nums',
                isActive ? 'text-[#C4B8A0]' : 'text-[#C4B8A0]',
              ].join(' ')}>
                {opt.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
