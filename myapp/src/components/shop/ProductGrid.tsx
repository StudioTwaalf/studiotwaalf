import ProductCard from './ProductCard'

interface Product {
  id: string
  slug: string
  nameNl: string
  thumbnailImageUrl: string | null
  assets: { url: string }[]
  basePriceCents: number
  isPersonalizable: boolean
  category: { nameNl: string }
}

interface ProductGridProps {
  products: Product[]
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="font-serif text-2xl text-[#C4B8A0] mb-3">Geen producten gevonden</p>
        <p className="text-sm text-[#B5A48A]">Probeer een andere categorie of verwijder het filter.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10 sm:gap-x-7 sm:gap-y-14">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          slug={p.slug}
          name={p.nameNl}
          thumbnailUrl={p.thumbnailImageUrl ?? p.assets[0]?.url ?? null}
          basePriceCents={p.basePriceCents}
          categoryName={p.category.nameNl}
          isPersonalizable={p.isPersonalizable}
        />
      ))}
    </div>
  )
}
