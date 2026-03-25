'use client'

/**
 * TemplatesPageClient — public template selection page with premium filter bar.
 *
 * Receives all published templates from the server page.
 * Handles filtering purely client-side for instant, no-reload response.
 *
 * Filter system uses the shared FilterPillBar + ActiveFilterChips components
 * — the same visual language as the gadget picker and future webshop.
 */

import { useState, useMemo, useEffect, useRef } from 'react'
import TemplatesGrid, { type TemplateSummary } from '@/components/TemplatesGrid'
import FilterPillBar from '@/components/filters/FilterPillBar'
import ActiveFilterChips from '@/components/filters/ActiveFilterChips'
import { buildFilterOptions, matchesFilters } from '@/lib/filters'
import type { FilterGroup, ActiveFilters } from '@/lib/filters'
import { trackEvent } from '@/lib/analytics'

interface Props {
  templates: TemplateSummary[]
}

export default function TemplatesPageClient({ templates }: Props) {
  // ── Analytics: diy_started — fires once on page mount ────────────────────
  // Derives entry_point from document.referrer so GTM can segment sessions
  // coming from the homepage, webshop, or external/direct traffic.
  const diyStartedFiredRef = useRef(false)
  useEffect(() => {
    if (diyStartedFiredRef.current) return
    diyStartedFiredRef.current = true

    let entry_point: 'homepage' | 'webshop' | 'direct' | 'other' = 'direct'
    try {
      const ref = document.referrer
      if (ref) {
        const refPath = new URL(ref).pathname
        if (refPath === '/' || refPath === '') entry_point = 'homepage'
        else if (refPath.startsWith('/webshop'))  entry_point = 'webshop'
        else                                       entry_point = 'other'
      }
    } catch { /* ignore malformed referrers */ }

    trackEvent({ event: 'diy_started', entry_point })
  }, [])

  // ── Filter state ──────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<ActiveFilters>({
    category: '',
  })

  // ── Derived filter options (computed once from data) ──────────────────────
  const categoryOptions = useMemo(
    () => buildFilterOptions(templates as unknown as Record<string, unknown>[], 'category'),
    [templates],
  )

  const filterGroups: FilterGroup[] = [
    { key: 'category', label: 'Categorie', options: categoryOptions },
  ]

  // ── Filtered results ──────────────────────────────────────────────────────
  const filtered = useMemo(
    () => templates.filter((t) =>
      matchesFilters(t as unknown as Record<string, unknown>, filters),
    ),
    [templates, filters],
  )

  // ── Filter handlers ───────────────────────────────────────────────────────
  function setFilter(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function removeFilter(key: string) {
    setFilters((prev) => ({ ...prev, [key]: '' }))
  }

  function resetFilters() {
    setFilters({ category: '' })
  }

  const hasActiveFilters = Boolean(filters.category)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Filter bar — only show if there are category options */}
      {categoryOptions.length > 1 && (
        <div className="space-y-3">
          <FilterPillBar
            options={categoryOptions}
            value={String(filters.category ?? '')}
            onChange={(v) => setFilter('category', v)}
            allLabel="Alles"
            showCount={false}
          />

          {/* Active chips + result count */}
          {hasActiveFilters && (
            <ActiveFilterChips
              filters={filters}
              filterGroups={filterGroups}
              onRemove={removeFilter}
              onReset={resetFilters}
              resultCount={filtered.length}
            />
          )}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-[#E0D5C5] bg-[#FAFAF7]">
          <p className="text-sm font-medium text-[#7A6A52]">
            Geen templates gevonden
          </p>
          <p className="text-xs text-[#B5A48A] mt-1">
            Probeer een ander filter of{' '}
            <button
              type="button"
              onClick={resetFilters}
              className="underline underline-offset-2 hover:text-[#2C2416] transition-colors"
            >
              bekijk alles
            </button>
          </p>
        </div>
      ) : (
        <TemplatesGrid templates={filtered} />
      )}
    </div>
  )
}
