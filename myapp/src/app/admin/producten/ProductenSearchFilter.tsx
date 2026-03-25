'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface Props {
  categories: Array<{ id: string; nameNl: string }>
}

export default function ProductenSearchFilter({ categories }: Props) {
  const router     = useRouter()
  const searchParams = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/admin/producten?${params.toString()}`)
  }

  const q    = searchParams.get('q') ?? ''
  const cat  = searchParams.get('category') ?? ''
  const shop = searchParams.get('shop') ?? ''

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="search"
        placeholder="Zoeken op naam…"
        defaultValue={q}
        onChange={(e) => update('q', e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white
                   focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]
                   placeholder:text-gray-400 min-w-[200px]"
      />

      <select
        value={cat}
        onChange={(e) => update('category', e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white
                   focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
      >
        <option value="">Alle categorieën</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.nameNl}</option>
        ))}
      </select>

      <select
        value={shop}
        onChange={(e) => update('shop', e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white
                   focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
      >
        <option value="">Alle (shop)</option>
        <option value="ja">Zichtbaar in shop</option>
        <option value="nee">Verborgen in shop</option>
      </select>

      {(q || cat || shop) && (
        <button
          onClick={() => router.push('/admin/producten')}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Filters wissen
        </button>
      )}
    </div>
  )
}
