import Link from 'next/link'

export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { createProductAction } from './actions'

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { nameNl: 'asc' },
  })

  return (
    <div className="max-w-xl">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/admin/producten" className="hover:text-gray-600 transition-colors">Producten</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Nieuw product</span>
      </nav>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Nieuw product aanmaken</h1>
        <p className="text-sm text-gray-500 mb-6">
          Vul de basisinformatie in. Je kan na het aanmaken afbeeldingen, varianten en meer toevoegen.
        </p>

        <form action={createProductAction} className="space-y-5">

          {/* Naam */}
          <div>
            <label htmlFor="nameNl" className="block text-sm font-medium text-gray-700 mb-1.5">
              Naam <span className="text-red-500">*</span>
            </label>
            <input
              id="nameNl" name="nameNl" type="text" required autoFocus
              placeholder="bijv. Gepersonaliseerde sticker"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1.5">
              Slug <span className="text-gray-400 text-xs font-normal">(leeg = automatisch)</span>
            </label>
            <input
              id="slug" name="slug" type="text"
              placeholder="bijv. gepersonaliseerde-sticker"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                         font-mono focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
            />
          </div>

          {/* Categorie + prijs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1.5">
                Categorie <span className="text-red-500">*</span>
              </label>
              <select
                id="categoryId" name="categoryId" required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
              >
                <option value="">Kies een categorie…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nameNl}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="basePriceCents" className="block text-sm font-medium text-gray-700 mb-1.5">
                Basisprijs (€) <span className="text-red-500">*</span>
              </label>
              <input
                id="basePriceCents" name="basePriceCents" type="number"
                step="0.01" min="0" required
                placeholder="0.00"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button
              type="submit"
              className="bg-[#2C2416] text-white text-sm font-medium px-5 py-2.5 rounded-xl
                         hover:bg-[#3C3020] transition-colors"
            >
              Product aanmaken
            </button>
            <Link href="/admin/producten" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Annuleren
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
