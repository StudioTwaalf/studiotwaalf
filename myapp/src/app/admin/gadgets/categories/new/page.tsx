import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { createCategoryAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function NewCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  const topLevel = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: [{ sortOrder: 'asc' }, { nameNl: 'asc' }],
  })

  return (
    <div className="max-w-lg">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/admin/gadgets" className="hover:text-gray-600 transition-colors">Gadgets</Link>
        <span>/</span>
        <Link href="/admin/gadgets/categories" className="hover:text-gray-600 transition-colors">Categorieën</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Nieuwe categorie</span>
      </nav>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h1 className="text-lg font-semibold text-gray-900 mb-6">Categorie aanmaken</h1>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form action={createCategoryAction} className="space-y-5">
          <div>
            <label htmlFor="nameNl" className="block text-sm font-medium text-gray-700 mb-1">
              Naam <span className="text-red-500">*</span>
            </label>
            <input
              id="nameNl" name="nameNl" type="text" required autoFocus
              placeholder="bijv. Papier & Karton"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">De slug wordt automatisch gegenereerd.</p>
          </div>

          <div>
            <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1">
              Bovenliggende categorie
            </label>
            <select
              id="parentId" name="parentId"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— Geen (hoofd-categorie) —</option>
              {topLevel.map((c) => (
                <option key={c.id} value={c.id}>{c.nameNl}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Laat leeg voor een hoofd-categorie, kies een categorie voor een subcategorie.
            </p>
          </div>

          <div>
            <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
              Sorteervolgorde
            </label>
            <input
              id="sortOrder" name="sortOrder" type="number"
              defaultValue={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button
              type="submit"
              className="bg-indigo-600 text-white text-sm font-medium px-5 py-2 rounded-lg
                         hover:bg-indigo-700 transition-colors"
            >
              Aanmaken
            </button>
            <Link href="/admin/gadgets/categories" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Terug
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
