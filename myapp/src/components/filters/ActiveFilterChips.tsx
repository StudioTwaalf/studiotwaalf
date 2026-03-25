'use client'

/**
 * ActiveFilterChips — shows currently active filters as removable chips.
 *
 * Used below FilterPillBar to give users clear visibility of what's selected
 * and a one-click way to remove individual filters or reset everything.
 */

import type { ActiveFilters, FilterGroup } from '@/lib/filters'

interface Props {
  filters:        ActiveFilters
  filterGroups:   FilterGroup[]
  onRemove:       (key: string, value?: string) => void
  onReset:        () => void
  /** Label for the reset button. Default: "Alles wissen" */
  resetLabel?:    string
  /** Total result count — shown when filters are active */
  resultCount?:   number
}

export default function ActiveFilterChips({
  filters,
  filterGroups,
  onRemove,
  onReset,
  resetLabel  = 'Alles wissen',
  resultCount,
}: Props) {
  // Build chips from active filters
  const chips: { key: string; value: string; label: string }[] = []

  for (const [key, val] of Object.entries(filters)) {
    if (!val || (Array.isArray(val) && val.length === 0)) continue
    const group = filterGroups.find((g) => g.key === key)
    const values = Array.isArray(val) ? val : [val]
    for (const v of values) {
      const optLabel = group?.options.find((o) => o.value === v)?.label ?? v
      chips.push({ key, value: v, label: optLabel })
    }
  }

  if (chips.length === 0) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Result count */}
      {resultCount !== undefined && (
        <span className="text-xs text-[#9C8F7A] shrink-0">
          {resultCount} resultaat{resultCount !== 1 ? 'en' : ''}
        </span>
      )}

      {/* Active chips */}
      {chips.map((chip) => (
        <button
          key={`${chip.key}-${chip.value}`}
          type="button"
          onClick={() => onRemove(chip.key, chip.value)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                     bg-[#2C2416]/8 text-[#2C2416] border border-[#2C2416]/15
                     hover:bg-[#2C2416]/15 transition-colors duration-150 group"
        >
          {chip.label}
          <svg
            className="w-3 h-3 text-[#7A6A52] group-hover:text-[#2C2416] transition-colors"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ))}

      {/* Reset all */}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-[#B5A48A] hover:text-[#2C2416] underline
                     underline-offset-2 transition-colors duration-150 ml-1"
        >
          {resetLabel}
        </button>
      )}
    </div>
  )
}
