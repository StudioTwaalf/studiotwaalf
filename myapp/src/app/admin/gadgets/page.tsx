import { Suspense } from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { parseProductDimensions } from '@/lib/product-dimensions'
import GadgetDeleteButton from '@/components/admin/GadgetDeleteButton'
import GadgetsSearchFilter from '@/components/admin/GadgetsSearchFilter'

interface Props {
  searchParams: { q?: string; category?: string; status?: string }
}

export default async function AdminGadgetsPage({ searchParams }: Props) {
  const q      = searchParams.q?.trim() ?? ''
  const catId  = searchParams.category ?? ''
  const status = searchParams.status ?? ''

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        ...(q     ? { nameNl: { contains: q, mode: 'insensitive' as const } } : {}),
        ...(catId  ? { categoryId: catId } : {}),
        ...(status === 'active'   ? { isActive: true  } : {}),
        ...(status === 'inactive' ? { isActive: false } : {}),
      },
      orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        category: true,
        _count: { select: { variants: true } },
      },
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { nameNl: 'asc' } }),
  ])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Gadgets</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {products.length} product{products.length !== 1 ? 'en' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/gadgets/categories"
            className="inline-flex items-center gap-2 text-sm text-gray-600 border border-gray-300
                       bg-white px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Categorieën
          </Link>
          <Link
            href="/admin/gadgets/new"
            className="inline-flex items-center gap-2 bg-studio-yellow text-[#2C2416] text-sm font-medium
                       px-4 py-2 rounded-lg hover:brightness-95 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nieuw gadget
          </Link>
        </div>
      </div>

      {/* Search / filter */}
      <div className="mb-4">
        <Suspense>
          <GadgetsSearchFilter categories={categories} />
        </Suspense>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-sm font-medium text-gray-500">
            {q || catId || status ? 'Geen resultaten gevonden' : 'Nog geen gadgets'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {q || catId || status
              ? 'Probeer een andere zoekterm of filter.'
              : 'Maak je eerste gadget aan om te beginnen.'}
          </p>
          {!q && !catId && !status && (
            <Link
              href="/admin/gadgets/new"
              className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Gadget aanmaken →
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 w-10" />
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Naam</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Categorie</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Afmetingen</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Prijs</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Varianten</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">DIY</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Shop</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => {
                const dims     = parseProductDimensions(p.configJson)
                const thumb    = p.thumbnailImageUrl ?? p.mockupImageUrl
                const varCount = p._count.variants

                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    {/* Thumbnail */}
                    <td className="px-4 py-3">
                      <div className="w-9 h-9 rounded-lg border border-gray-100 bg-gray-50
                                      overflow-hidden flex items-center justify-center shrink-0">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-gray-300 text-base">🖼</span>
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{p.nameNl}</span>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">{p.slug}</p>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-gray-600">{p.category?.nameNl ?? '—'}</td>

                    {/* Dimensions */}
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {dims ? (
                        <span>{dims.widthMm}×{dims.heightMm}{dims.depthMm ? `×${dims.depthMm}` : ''} mm</span>
                      ) : (
                        <span className="text-amber-500 font-sans">Niet ingesteld</span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 text-gray-600">
                      €{(p.basePriceCents / 100).toFixed(2)}
                    </td>

                    {/* Variants */}
                    <td className="px-4 py-3">
                      {varCount > 0 ? (
                        <Link
                          href={`/admin/gadgets/${p.id}#varianten`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600
                                     hover:text-indigo-800 transition-colors"
                        >
                          <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center
                                           justify-center text-[10px] font-bold">
                            {varCount}
                          </span>
                          variant{varCount !== 1 ? 'en' : ''}
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* DIY */}
                    <td className="px-4 py-3">
                      <Badge active={p.isVisibleInDIY} label="DIY" />
                    </td>

                    {/* Shop */}
                    <td className="px-4 py-3">
                      <Badge active={p.isVisibleInShop} label="Shop" />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge active={p.isActive} label={p.isActive ? 'Actief' : 'Inactief'} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/gadgets/${p.id}`}
                          className="text-indigo-600 hover:text-indigo-700 text-xs font-medium"
                        >
                          Bewerken
                        </Link>
                        <GadgetDeleteButton id={p.id} name={p.nameNl} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Badge({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={[
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
    ].join(' ')}>
      {label}
    </span>
  )
}
