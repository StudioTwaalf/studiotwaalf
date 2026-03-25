/**
 * Shared filter system — used by the public template page, gadget picker, and future webshop.
 * Keep this file free of React imports so it can be used in both server and client contexts.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterOption {
  value: string
  label: string
  /** Optional count shown next to the label */
  count?: number
}

export interface FilterGroup {
  /** Matches the data field name used for filtering */
  key:       string
  label:     string
  options:   FilterOption[]
  /** Allow selecting multiple values at once (default: false) */
  multiple?: boolean
}

/** Map of filter key → selected value(s) */
export type ActiveFilters = Record<string, string | string[]>

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns true if `item` matches all active filters.
 * Empty / unset filters are ignored (show everything).
 */
export function matchesFilters(
  item:    Record<string, unknown>,
  filters: ActiveFilters,
): boolean {
  for (const [key, value] of Object.entries(filters)) {
    if (!value || (Array.isArray(value) && value.length === 0)) continue
    const itemValue = item[key]
    if (Array.isArray(value)) {
      if (!value.includes(String(itemValue ?? ''))) return false
    } else {
      if (String(itemValue ?? '') !== value) return false
    }
  }
  return true
}

/**
 * Derive unique `FilterOption[]` from a list of items for a given field.
 * Automatically calculates item counts per option.
 */
export function buildFilterOptions<T extends Record<string, unknown>>(
  items:  T[],
  field:  keyof T,
  labelFn?: (value: string) => string,
): FilterOption[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    const v = item[field]
    if (v == null || v === '') continue
    const key = String(v)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([value, count]) => ({
      value,
      label: labelFn ? labelFn(value) : value,
      count,
    }))
}

/** Count how many active filter keys have a non-empty value. */
export function countActiveFilters(filters: ActiveFilters): number {
  return Object.values(filters).filter((v) =>
    Array.isArray(v) ? v.length > 0 : Boolean(v),
  ).length
}
