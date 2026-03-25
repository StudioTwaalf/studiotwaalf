'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const SORT_OPTIONS = [
  { value: 'aanbevolen', label: 'Aanbevolen' },
  { value: 'nieuwste',   label: 'Nieuwste' },
  { value: 'prijs-laag', label: 'Prijs: laag → hoog' },
  { value: 'prijs-hoog', label: 'Prijs: hoog → laag' },
] as const

export default function ShopSortControl() {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()
  const active      = searchParams.get('sorteer') ?? 'aanbevolen'

  function setSort(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'aanbevolen') {
      params.delete('sorteer')
    } else {
      params.set('sorteer', value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-xs text-[#B5A48A] hidden sm:block whitespace-nowrap">Sorteren</span>
      <div className="relative">
        <select
          value={active}
          onChange={(e) => setSort(e.target.value)}
          className="appearance-none text-sm text-[#5A4A3A] bg-white border border-[#E0D5C5]
                     rounded-lg pl-3 pr-7 py-1.5 cursor-pointer
                     focus:outline-none focus:ring-1 focus:ring-[#C4B8A0]
                     hover:bg-[#F5F0E8] transition-colors"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <svg
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#B5A48A] pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}
