'use client'

/**
 * OfferteSearchFilter — client-side search + filter bar for the offertes overview.
 * Pushes URL search params so the server page can filter without a full client state.
 */

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { ALL_OFFER_STATUSES, getOfferStatusMeta } from '@/lib/offer-status'

interface Props {
  /** Unique concept categories extracted from current data — e.g. ['Huwelijk', 'Geboorte'] */
  categories: string[]
}

export default function OfferteSearchFilter({ categories }: Props) {
  const router      = useRouter()
  const params      = useSearchParams()
  const [, startTransition] = useTransition()

  const q        = params.get('q')        ?? ''
  const status   = params.get('status')   ?? ''
  const category = params.get('category') ?? ''

  const push = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString())
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      startTransition(() => {
        router.replace(`/admin/offertes?${next.toString()}`)
      })
    },
    [params, router],
  )

  return (
    <div className="flex flex-wrap items-center gap-3">

      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="search"
          placeholder="Zoek op naam of e-mail…"
          defaultValue={q}
          onChange={(e) => push('q', e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg
                     bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500
                     focus:border-indigo-500 placeholder:text-gray-400"
        />
      </div>

      {/* Status filter */}
      <select
        value={status}
        onChange={(e) => push('status', e.target.value)}
        className="py-2 pl-3 pr-8 text-sm border border-gray-200 rounded-lg bg-white shadow-sm
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                   text-gray-700"
      >
        <option value="">Alle statussen</option>
        {ALL_OFFER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {getOfferStatusMeta(s).label}
          </option>
        ))}
      </select>

      {/* Concept / category filter */}
      {categories.length > 0 && (
        <select
          value={category}
          onChange={(e) => push('category', e.target.value)}
          className="py-2 pl-3 pr-8 text-sm border border-gray-200 rounded-lg bg-white shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                     text-gray-700"
        >
          <option value="">Alle concepten</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}

      {/* Clear button */}
      {(q || status || category) && (
        <button
          type="button"
          onClick={() => {
            startTransition(() => router.replace('/admin/offertes'))
          }}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Wis filters
        </button>
      )}
    </div>
  )
}
