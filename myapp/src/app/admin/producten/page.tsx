import { Suspense } from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ProductenSearchFilter from './ProductenSearchFilter'

interface Props {
  searchParams: { q?: string; category?: string; shop?: string }
}

export default async function AdminProductenPage({ searchParams }: Props) {
  const q      = searchParams.q?.trim() ?? ''
  const catId  = searchParams.category ?? ''
  const shop   = searchParams.shop ?? ''

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        ...(q    ? { nameNl: { contains: q, mode: 'insensitive' as const } } : {}),
        ...(catId ? { categoryId: catId } : {}),
        ...(shop === 'ja'  ? { isVisibleInShop: true  } : {}),
        ...(shop === 'nee' ? { isVisibleInShop: false } : {}),
      },
      orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        category: true,
        _count: { select: { variants: true } },
        assets: { take: 1, orderBy: { sortOrder: 'asc' } },
      },
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { nameNl: 'asc' } }),
  ])

  const shopCount = products.filter((p) => p.isVisibleInShop).length

  return (
    <div>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Webshop producten</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {products.length} product{products.length !== 1 ? 'en' : ''}
            {shopCount > 0 && (
              <span className="ml-2 text-green-600 font-medium">· {shopCount} zichtbaar in shop</span>
            )}
          </p>
        </div>
        <Link
          href="/admin/producten/new"
          className="inline-flex items-center gap-2 bg-[#2C2416] text-white text-sm font-medium
                     px-4 py-2 rounded-lg hover:bg-[#3C3020] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nieuw product
        </Link>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <Suspense>
          <ProductenSearchFilter categories={categories} />
        </Suspense>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-sm font-medium text-gray-500">
            {q || catId || shop ? 'Geen resultaten gevonden' : 'Nog geen producten'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {q || catId || shop
              ? 'Probeer een andere zoekterm of filter.'
              : 'Maak je eerste product aan om te beginnen.'}
          </p>
          {!q && !catId && !shop && (
            <Link
              href="/admin/producten/new"
              className="mt-4 inline-flex items-center text-sm font-medium text-[#8B6F3E] hover:text-[#6B5230]"
            >
              Product aanmaken →
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 w-12" />
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Naam</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Categorie</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Prijs</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Varianten</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Webshop</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => {
                const thumb    = p.thumbnailImageUrl ?? p.mockupImageUrl ?? p.assets[0]?.url
                const varCount = p._count.variants

                return (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition-colors group">

                    {/* Thumbnail */}
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-lg border border-gray-100 bg-[#FAF8F5]
                                      overflow-hidden flex items-center justify-center shrink-0">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={1.5} />
                            <path strokeLinecap="round" strokeWidth={1.5} d="M3 15l5-5 4 4 3-3 6 6" />
                          </svg>
                        )}
                      </div>
                    </td>

                    {/* Name + slug */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{p.nameNl}</span>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">{p.slug}</p>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-gray-600 text-sm">{p.category?.nameNl ?? '—'}</td>

                    {/* Price */}
                    <td className="px-4 py-3 text-gray-700 font-medium text-sm">
                      €{(p.basePriceCents / 100).toFixed(2)}
                    </td>

                    {/* Variants */}
                    <td className="px-4 py-3">
                      {varCount > 0 ? (
                        <Link
                          href={`/admin/producten/${p.id}#varianten`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8B6F3E]
                                     hover:text-[#6B5230] transition-colors"
                        >
                          <span className="w-5 h-5 rounded-full bg-[#F5EDD8] text-[#8B6F3E] flex items-center
                                           justify-center text-[10px] font-bold">
                            {varCount}
                          </span>
                          variant{varCount !== 1 ? 'en' : ''}
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* Shop visibility */}
                    <td className="px-4 py-3">
                      <StatusDot active={p.isVisibleInShop} />
                    </td>

                    {/* Active status */}
                    <td className="px-4 py-3">
                      <StatusBadge active={p.isActive} activeLabel="Actief" inactiveLabel="Inactief" />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/producten/${p.id}`}
                        className="text-xs font-medium text-gray-500 hover:text-gray-900
                                   opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Bewerken →
                      </Link>
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

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={[
        'w-1.5 h-1.5 rounded-full',
        active ? 'bg-green-500' : 'bg-gray-300',
      ].join(' ')} />
      <span className={['text-xs', active ? 'text-green-700 font-medium' : 'text-gray-400'].join(' ')}>
        {active ? 'Zichtbaar' : 'Verborgen'}
      </span>
    </span>
  )
}

function StatusBadge({ active, activeLabel, inactiveLabel }: { active: boolean; activeLabel: string; inactiveLabel: string }) {
  return (
    <span className={[
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500',
    ].join(' ')}>
      {active ? activeLabel : inactiveLabel}
    </span>
  )
}
