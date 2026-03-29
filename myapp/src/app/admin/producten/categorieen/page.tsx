import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'Categorieën – Admin' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('nl-BE', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  }).format(date)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminCategorieenPage() {
  // Fetch all categories (incl. inactive) with product counts
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { nameNl: 'asc' }],
    include: { _count: { select: { products: true } } },
  })

  const activeCount   = categories.filter((c) => c.isActive).length
  const inactiveCount = categories.length - activeCount

  return (
    <div className="max-w-4xl space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Categorieën</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Organiseer webshop producten in overzichtelijke categorieën.
            {categories.length > 0 && (
              <> · <span className="text-gray-600 font-medium">{categories.length}</span> in totaal</>
            )}
            {inactiveCount > 0 && (
              <> · <span className="text-gray-400">{inactiveCount} inactief</span></>
            )}
          </p>
        </div>
        <Link
          href="/admin/producten/categorieen/new"
          className="inline-flex items-center gap-2 bg-[#2C2416] text-white text-sm font-medium
                     px-4 py-2 rounded-lg hover:bg-[#3C3020] transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nieuwe categorie
        </Link>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Totaal',   value: categories.length,   color: 'text-gray-900' },
            { label: 'Actief',   value: activeCount,          color: 'text-green-700' },
            { label: 'Inactief', value: inactiveCount,        color: 'text-gray-400' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
              <p className={`text-2xl font-semibold tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {categories.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF5EA] border border-[#EDE0C4] flex items-center
                          justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-[#8B6F3E]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700">Nog geen categorieën</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            Maak je eerste categorie aan om webshop producten overzichtelijk in te delen.
          </p>
          <Link
            href="/admin/producten/categorieen/new"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#8B6F3E]
                       hover:text-[#6B5230] transition-colors"
          >
            Eerste categorie toevoegen
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {/* ── Category list ────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Naam
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">
                  Slug
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">
                  Producten
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">
                  Aangemaakt
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((cat) => {
                const count = cat._count.products
                return (
                  <tr key={cat.id} className="hover:bg-gray-50/60 transition-colors group">

                    {/* Naam + beschrijving */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 leading-tight">{cat.nameNl}</p>
                      {cat.descriptionNl && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                          {cat.descriptionNl}
                        </p>
                      )}
                    </td>

                    {/* Slug */}
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-xs font-mono text-gray-500 bg-gray-50 border border-gray-100
                                       px-2 py-0.5 rounded-md">
                        {cat.slug}
                      </span>
                    </td>

                    {/* Product count */}
                    <td className="px-5 py-4 hidden md:table-cell">
                      {count > 0 ? (
                        <Link
                          href={`/admin/producten?category=${cat.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#8B6F3E]
                                     hover:text-[#6B5230] transition-colors"
                        >
                          <span className="w-5 h-5 rounded-full bg-[#F5EDD8] text-[#8B6F3E]
                                           flex items-center justify-center text-[10px] font-bold">
                            {count}
                          </span>
                          product{count !== 1 ? 'en' : ''}
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>

                    {/* Created at */}
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap hidden lg:table-cell">
                      {formatDate(cat.createdAt)}
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-4">
                      <CategoryStatusBadge isActive={cat.isActive} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/producten/categorieen/${cat.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                                   text-gray-600 bg-white border border-gray-200 rounded-lg
                                   hover:bg-gray-50 hover:text-gray-900 transition-colors
                                   opacity-0 group-hover:opacity-100"
                      >
                        Bewerken
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>

                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Footer hint ──────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Categorieën worden gebruikt als filters op de webshop.{' '}
          <Link href="/webshop" target="_blank" className="text-[#8B6F3E] hover:underline">
            Bekijk webshop →
          </Link>
        </p>
      )}

    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function CategoryStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={[
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
      isActive
        ? 'bg-green-50 text-green-700 border-green-100'
        : 'bg-gray-50 text-gray-400 border-gray-100',
    ].join(' ')}>
      <span className={[
        'w-1.5 h-1.5 rounded-full',
        isActive ? 'bg-green-500' : 'bg-gray-300',
      ].join(' ')} />
      {isActive ? 'Actief' : 'Inactief'}
    </span>
  )
}
