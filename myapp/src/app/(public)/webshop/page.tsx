import type { Metadata } from 'next'
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import ProductGrid from '@/components/shop/ProductGrid'
import CategoryFilterPills from '@/components/shop/CategoryFilterPills'
import ShopSortControl from '@/components/shop/ShopSortControl'

export const metadata: Metadata = {
  title: 'Webshop – Studio Twaalf',
  description:
    'Bestel gepersonaliseerde doopsuiker, geboortekaartjes, labels, stickers en meer rechtstreeks in de Studio Twaalf webshop.',
}

type SortKey = 'aanbevolen' | 'nieuwste' | 'prijs-laag' | 'prijs-hoog'

const ORDER_BY: Record<SortKey, object> = {
  'aanbevolen': { sortOrder: 'asc' },
  'nieuwste':   { createdAt: 'desc' },
  'prijs-laag': { basePriceCents: 'asc' },
  'prijs-hoog': { basePriceCents: 'desc' },
}

interface PageProps {
  searchParams: Promise<{ categorie?: string; sorteer?: string }>
}

export default async function WebshopPage({ searchParams }: PageProps) {
  const { categorie, sorteer } = await searchParams
  const sortKey = (sorteer as SortKey) ?? 'aanbevolen'
  const orderBy = ORDER_BY[sortKey] ?? ORDER_BY['aanbevolen']

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let products: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let categories: any[] = []
  let dbError = false

  try {
    ;[products, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          isVisibleInShop: true,
          ...(categorie ? { category: { slug: categorie } } : {}),
        },
        include: {
          assets: { orderBy: { sortOrder: 'asc' }, take: 1 },
          category: true,
        },
        orderBy,
      }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ])
  } catch {
    dbError = true
  }

  const activeCategory = categories.find((c) => c.slug === categorie)

  return (
    <>
      {/* Hero */}
      <section className="bg-studio-beige pt-24 pb-14 lg:pt-32 lg:pb-20">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-3">
            Webshop
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3rem] font-semibold text-studio-black leading-tight text-balance mb-4">
            {activeCategory ? activeCategory.nameNl : 'Onze collectie'}
          </h1>
          <p className="text-[#8A7A6A] text-lg leading-relaxed max-w-xl">
            Bestel rechtstreeks — gepersonaliseerde doopsuiker, labels, stickers en meer.
            Alles met de warmte en stijl van Studio Twaalf.
          </p>
        </div>
      </section>

      {/* Catalog */}
      <section className="bg-white py-12 lg:py-16">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">

          {/* Filter + sort bar */}
          {!dbError && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
              {categories.length > 0 && (
                <div className="min-w-0">
                  <Suspense>
                    <CategoryFilterPills categories={categories} />
                  </Suspense>
                </div>
              )}
              <Suspense>
                <ShopSortControl />
              </Suspense>
            </div>
          )}

          {dbError ? (
            <p className="text-sm text-[#B5A48A] py-12 text-center">
              De webshop is tijdelijk niet beschikbaar. Probeer het later opnieuw.
            </p>
          ) : (
            <>
              {/* Result count */}
              <p className="text-xs text-[#B5A48A] mb-8">
                {products.length} {products.length === 1 ? 'product' : 'producten'}
                {activeCategory ? ` in ${activeCategory.nameNl}` : ''}
              </p>
              <ProductGrid products={products} />
            </>
          )}
        </div>
      </section>
    </>
  )
}
