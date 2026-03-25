'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface Category {
  slug: string
  nameNl: string
}

interface CategoryFilterPillsProps {
  categories: Category[]
}

export default function CategoryFilterPills({ categories }: CategoryFilterPillsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = searchParams.get('categorie')

  function setCategory(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (slug) {
      params.set('categorie', slug)
    } else {
      params.delete('categorie')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const pillBase =
    'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0'
  const pillActive = 'bg-studio-black text-white'
  const pillInactive = 'bg-white border border-[#E0D5C5] text-[#7A6A52] hover:bg-[#F5F0E8]'

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <button
        onClick={() => setCategory(null)}
        className={`${pillBase} ${!active ? pillActive : pillInactive}`}
      >
        Alles
      </button>
      {categories.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => setCategory(cat.slug)}
          className={`${pillBase} ${active === cat.slug ? pillActive : pillInactive}`}
        >
          {cat.nameNl}
        </button>
      ))}
    </div>
  )
}
