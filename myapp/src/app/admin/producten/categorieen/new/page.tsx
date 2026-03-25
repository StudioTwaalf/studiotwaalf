import Link from 'next/link'
import type { Metadata } from 'next'
import { createCategoryAction } from '../actions'

export const metadata: Metadata = { title: 'Nieuwe categorie – Admin' }

export default function NewCategoryPage() {
  return (
    <div className="max-w-2xl">

      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-5">
        <Link href="/admin/producten/categorieen" className="hover:text-gray-700 transition-colors">
          Categorieën
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 font-medium">Nieuwe categorie</span>
      </nav>

      {/* ── Form ─────────────────────────────────────────────────────────── */}
      <form action={createCategoryAction}>
        <div className="space-y-5">

          {/* ▸ Main card */}
          <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h1 className="text-sm font-semibold text-gray-900">Nieuwe categorie</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Categorieën helpen klanten snel de juiste producten vinden.
              </p>
            </div>
            <div className="px-6 py-5 space-y-4">

              {/* Name */}
              <div>
                <label htmlFor="nameNl" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Naam <span className="text-red-400">*</span>
                </label>
                <input
                  id="nameNl" name="nameNl" type="text" required autoFocus
                  placeholder="bv. Doopsuiker, Geboortekaartjes…"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                />
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1.5">
                  URL-slug
                  <span className="ml-1.5 text-xs font-normal text-gray-400">(automatisch gegenereerd)</span>
                </label>
                <input
                  id="slug" name="slug" type="text"
                  placeholder="doopsuiker"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                             font-mono focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Wordt gebruikt als filterwaarde in de webshop-URL. Leeglaten = automatisch afgeleid van naam.
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
                  type="checkbox" name="isActive" defaultChecked
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
                  id="sortOrder" name="sortOrder" type="number" defaultValue={0}
                  className="w-32 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                />
              </div>

            </div>
          </section>

          {/* ▸ Actions */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="bg-[#2C2416] text-white text-sm font-semibold px-5 py-2.5
                         rounded-xl hover:bg-[#3C3020] transition-colors"
            >
              Categorie aanmaken
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

    </div>
  )
}
