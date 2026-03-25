import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { nameNl: 'asc' }],
    include: { _count: { select: { products: true } } },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link href="/admin/gadgets" className="hover:text-gray-600 transition-colors">Gadgets</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">Categorieën</span>
          </nav>
          <h1 className="text-xl font-semibold text-gray-900">Categorieën</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {categories.length} categorie{categories.length !== 1 ? 'ën' : ''}
          </p>
        </div>
        <Link
          href="/admin/gadgets/categories/new"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium
                     px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nieuwe categorie
        </Link>
      </div>

      {categories.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-sm font-medium text-gray-500">Nog geen categorieën</p>
          <p className="text-xs text-gray-400 mt-1">Maak een categorie aan om gadgets in te groeperen.</p>
          <Link
            href="/admin/gadgets/categories/new"
            className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Categorie aanmaken →
          </Link>
        </div>
      )}

      {categories.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Naam</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Slug</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Producten</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Volgorde</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{c.nameNl}</td>
                  <td className="px-5 py-3.5 text-gray-500 font-mono text-xs">{c.slug}</td>
                  <td className="px-5 py-3.5 text-gray-600">{c._count.products}</td>
                  <td className="px-5 py-3.5 text-gray-600">{c.sortOrder}</td>
                  <td className="px-5 py-3.5">
                    <span className={[
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
                    ].join(' ')}>
                      {c.isActive ? 'Actief' : 'Inactief'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
