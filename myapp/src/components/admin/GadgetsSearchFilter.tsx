'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface Props {
  categories: { id: string; nameNl: string }[]
}

export default function GadgetsSearchFilter({ categories }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const sp       = useSearchParams()

  function update(updates: Record<string, string>) {
    const params = new URLSearchParams(sp.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
        </svg>
        <input
          type="search"
          placeholder="Zoeken op naam…"
          defaultValue={sp.get('q') ?? ''}
          onChange={(e) => update({ q: e.target.value })}
          className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-56
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
      </div>

      {/* Category filter */}
      <select
        defaultValue={sp.get('category') ?? ''}
        onChange={(e) => update({ category: e.target.value })}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">Alle categorieën</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.nameNl}</option>
        ))}
      </select>

      {/* Status filter */}
      <select
        defaultValue={sp.get('status') ?? ''}
        onChange={(e) => update({ status: e.target.value })}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">Alle statussen</option>
        <option value="active">Actief</option>
        <option value="inactive">Inactief</option>
      </select>
    </div>
  )
}
