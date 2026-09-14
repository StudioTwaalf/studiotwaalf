import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import CategoryDeleteButton from '@/components/admin/CategoryDeleteButton'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parents: any[] = []
  let dbError: string | null = null

  try {
    parents = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: [{ sortOrder: 'asc' }, { nameNl: 'asc' }],
      include: {
        _count: { select: { products: true } },
        children: {
          orderBy: [{ sortOrder: 'asc' }, { nameNl: 'asc' }],
          include: { _count: { select: { products: true } } },
        },
      },
    })
  } catch (err) {
    dbError = err instanceof Error ? err.message : 'Onbekende fout'
  }

  if (dbError) {
    return (
      <div>
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/admin/gadgets" className="hover:text-gray-600 transition-colors">Gadgets</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Categorieën</span>
        </nav>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <p className="text-sm font-medium text-red-700 mb-1">Fout bij laden van categorieën</p>
          <p className="text-xs text-red-500 font-mono">{dbError}</p>
        </div>
      </div>
    )
  }

  const total = parents.reduce((n, p) => n + 1 + p.children.length, 0)

  const rows = parents.flatMap((parent) => {
    const parentCanDelete  = parent._count.products === 0 && parent.children.length === 0
    const parentBlockReason = parent._count.products > 0
      ? `${parent._count.products} gadget(s) gekoppeld`
      : parent.children.length > 0
        ? 'Verwijder eerst de subcategorieën'
        : undefined

    const parentRow = (
      <tr key={`p-${parent.id}`} className="hover:bg-gray-50 transition-colors">
        <td className="px-5 py-3.5 font-semibold text-gray-900">{parent.nameNl}</td>
        <td className="px-5 py-3.5 text-gray-500 font-mono text-xs">{parent.slug}</td>
        <td className="px-5 py-3.5 text-gray-600">{parent._count.products}</td>
        <td className="px-5 py-3.5 text-gray-600">{parent.sortOrder}</td>
        <td className="px-5 py-3.5">
          <span className={[
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
            parent.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
          ].join(' ')}>
            {parent.isActive ? 'Actief' : 'Inactief'}
          </span>
        </td>
        <td className="px-3 py-3.5 text-right">
          <CategoryDeleteButton
            id={parent.id}
            name={parent.nameNl}
            canDelete={parentCanDelete}
            blockReason={parentBlockReason}
          />
        </td>
      </tr>
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const childRows = parent.children.map((child: any) => {
      const childCanDelete  = child._count.products === 0
      const childBlockReason = child._count.products > 0
        ? `${child._count.products} gadget(s) gekoppeld`
        : undefined

      return (
        <tr key={`c-${child.id}`} className="hover:bg-gray-50 transition-colors bg-gray-50/50">
          <td className="px-5 py-3 text-gray-700">
            <span className="inline-flex items-center gap-2 pl-4">
              <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {child.nameNl}
            </span>
          </td>
          <td className="px-5 py-3 text-gray-400 font-mono text-xs">{child.slug}</td>
          <td className="px-5 py-3 text-gray-600">{child._count.products}</td>
          <td className="px-5 py-3 text-gray-600">{child.sortOrder}</td>
          <td className="px-5 py-3">
            <span className={[
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
              child.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
            ].join(' ')}>
              {child.isActive ? 'Actief' : 'Inactief'}
            </span>
          </td>
          <td className="px-3 py-3 text-right">
            <CategoryDeleteButton
              id={child.id}
              name={child.nameNl}
              canDelete={childCanDelete}
              blockReason={childBlockReason}
            />
          </td>
        </tr>
      )
    })

    return [parentRow, ...childRows]
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
            {total} categorie{total !== 1 ? 'ën' : ''}
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

      {total === 0 && (
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

      {total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Naam</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Slug</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Gadgets</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Volgorde</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
