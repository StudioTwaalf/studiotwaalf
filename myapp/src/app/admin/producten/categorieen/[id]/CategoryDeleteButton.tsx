'use client'

import Link from 'next/link'

interface Props {
  boundAction:  () => Promise<void>
  categoryName: string
  productCount: number
}

export default function CategoryDeleteButton({ boundAction, categoryName, productCount }: Props) {
  // If products still linked: show a warning instead of a delete button.
  if (productCount > 0) {
    return (
      <section className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-amber-50 bg-amber-50/60">
          <h2 className="text-sm font-semibold text-amber-800">Categorie verwijderen</h2>
        </div>
        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-amber-700">
            Deze categorie heeft nog{' '}
            <strong>{productCount} product{productCount !== 1 ? 'en' : ''}</strong> toegewezen.
            Wijs ze opnieuw in voor je deze categorie verwijdert.
          </p>
          <Link
            href={`/admin/producten?category=`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700
                       hover:text-amber-900 transition-colors underline-offset-2 hover:underline"
          >
            Producten bekijken en herindelen →
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white rounded-2xl border border-red-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-red-50 bg-red-50/40">
        <h2 className="text-sm font-semibold text-red-700">Categorie verwijderen</h2>
      </div>
      <div className="px-6 py-4 space-y-3">
        <p className="text-sm text-gray-600">
          Verwijder <strong>{categoryName}</strong> definitief. Deze actie kan niet ongedaan gemaakt worden.
        </p>
        <form
          action={boundAction}
          onSubmit={(e) => {
            if (!confirm(`Weet je zeker dat je "${categoryName}" wil verwijderen? Dit kan niet ongedaan gemaakt worden.`)) {
              e.preventDefault()
            }
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                       bg-red-50 text-red-600 border border-red-100
                       hover:bg-red-100 hover:text-red-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
            </svg>
            Categorie verwijderen
          </button>
        </form>
      </div>
    </section>
  )
}
