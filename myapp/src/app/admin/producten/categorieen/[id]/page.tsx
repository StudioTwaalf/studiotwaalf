import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { updateCategoryAction, deleteCategoryAction } from '../actions'
import CategoryDeleteButton from './CategoryDeleteButton'

export const metadata: Metadata = { title: 'Categorie bewerken – Admin' }

interface Props {
  params:       Promise<{ id: string }>
  searchParams: Promise<{ saved?: string }>
}

export default async function EditCategoryPage({ params, searchParams }: Props) {
  const { id }    = await params
  const { saved } = await searchParams

  const [category, productCount] = await Promise.all([
    prisma.category.findUnique({
      where:   { id },
      include: { _count: { select: { products: true } } },
    }),
    prisma.product.count({ where: { categoryId: id } }),
  ])

  if (!category) notFound()

  const boundUpdate = updateCategoryAction.bind(null, id)
  const boundDelete = deleteCategoryAction.bind(null, id)

  return (
    <div className="max-w-2xl">

      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-5">
        <Link href="/admin/producten/categorieen" className="hover:text-gray-700 transition-colors">
          Categorieën
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 font-medium truncate max-w-[200px]">{category.nameNl}</span>
      </nav>

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {saved && (
        <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Wijzigingen opgeslagen
        </div>
      )}

      <div className="space-y-5">

        {/* ── Main form ────────────────────────────────────────────────── */}
        <form action={boundUpdate}>
          <div className="space-y-5">

            {/* ▸ Content card */}
            <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h1 className="text-sm font-semibold text-gray-900">Categorie bewerken</h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Sla op om wijzigingen door te voeren in de webshop.
                </p>
              </div>
              <div className="px-6 py-5 space-y-4">

                {/* Name */}
                <div>
                  <label htmlFor="nameNl" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Naam <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="nameNl" name="nameNl" type="text" required
                    defaultValue={category.nameNl}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1.5">
                    URL-slug
                  </label>
                  <input
                    id="slug" name="slug" type="text"
                    defaultValue={category.slug}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                               font-mono focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Gebruikt in <span className="font-mono">/webshop?categorie={category.slug}</span>
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="descriptionNl" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Beschrijving
                    <span className="ml-1.5 text-xs font-normal text-gray-400">(optioneel)</span>
                  </label>
                  <textarea
                    id="descriptionNl" name="descriptionNl" rows={3}
                    defaultValue={category.descriptionNl ?? ''}
                    placeholder="Korte omschrijving van de categorie…"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white resize-none
                               focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                  />
                </div>

              </div>
            </section>

            {/* ▸ Settings card */}
            <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Instellingen</h2>
              </div>
              <div className="px-6 py-5 space-y-4">

                {/* isActive */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-100
                                  cursor-pointer hover:bg-gray-50/70 transition-colors">
                  <input
                    type="checkbox" name="isActive" defaultChecked={category.isActive}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#C4A040]
                               focus:ring-[#C4A040]/30 focus:ring-2"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700 leading-tight">Actief</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Inactieve categorieën worden niet getoond als filter in de webshop.
                    </p>
                  </div>
                </label>

                {/* Sort order */}
                <div>
                  <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Volgorde
                    <span className="ml-1.5 text-xs font-normal text-gray-400">(lager = eerder)</span>
                  </label>
                  <input
                    id="sortOrder" name="sortOrder" type="number"
                    defaultValue={category.sortOrder}
                    className="w-32 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                  />
                </div>

              </div>
            </section>

            {/* ▸ Save + cancel */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="bg-[#2C2416] text-white text-sm font-semibold px-5 py-2.5
                           rounded-xl hover:bg-[#3C3020] transition-colors"
              >
                Wijzigingen opslaan
              </button>
              <Link
                href="/admin/producten/categorieen"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 py-2.5"
              >
                Annuleren
              </Link>
            </div>

          </div>
        </form>

        {/* ── Meta info ────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Info</h2>
          </div>
          <dl className="px-6 py-4 space-y-2.5 text-sm">
            <div className="flex justify-between items-center">
              <dt className="text-gray-400 text-xs">ID</dt>
              <dd className="font-mono text-[10px] text-gray-500 truncate max-w-[160px]" title={category.id}>
                {category.id}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-gray-400 text-xs">Aangemaakt</dt>
              <dd className="text-xs text-gray-600">
                {new Date(category.createdAt).toLocaleDateString('nl-BE', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-gray-400 text-xs">Producten</dt>
              <dd className="text-xs text-gray-600">
                {productCount > 0 ? (
                  <Link
                    href={`/admin/producten?category=${category.id}`}
                    className="text-[#8B6F3E] hover:text-[#6B5230] font-medium transition-colors"
                  >
                    {productCount} product{productCount !== 1 ? 'en' : ''} bekijken →
                  </Link>
                ) : (
                  <span className="text-gray-400">Geen producten</span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        {/* ── Delete ───────────────────────────────────────────────────── */}
        <CategoryDeleteButton
          boundAction={boundDelete}
          categoryName={category.nameNl}
          productCount={productCount}
        />

      </div>
    </div>
  )
}
