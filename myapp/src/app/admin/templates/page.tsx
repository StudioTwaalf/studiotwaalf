import { Suspense } from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import TemplateDeleteButton from '@/components/admin/TemplateDeleteButton'
import TemplatesSearchFilter from '@/components/admin/TemplatesSearchFilter'

interface Props {
  searchParams: { q?: string; category?: string; status?: string }
}

export default async function AdminTemplatesPage({ searchParams }: Props) {
  const q      = searchParams.q?.trim() ?? ''
  const catStr = searchParams.category ?? ''
  const status = searchParams.status ?? ''

  // Get all distinct categories for the filter
  const allTemplates = await prisma.template.findMany({
    select: { category: true },
  })
  const categories = Array.from(
    new Set(allTemplates.map((t) => t.category).filter(Boolean) as string[])
  ).sort()

  const templates = await prisma.template.findMany({
    where: {
      ...(q      ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
      ...(catStr ? { category: catStr } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: [{ updatedAt: 'desc' }],
    include: { _count: { select: { designs: true } } },
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/templates/new"
          className="inline-flex items-center gap-2 bg-studio-yellow text-[#2C2416] text-sm font-medium
                     px-4 py-2 rounded-lg hover:brightness-95 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nieuwe template
        </Link>
      </div>

      {/* Search / filter */}
      <div className="mb-4">
        <Suspense>
          <TemplatesSearchFilter categories={categories} />
        </Suspense>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-sm font-medium text-gray-500">
            {q || catStr || status ? 'Geen resultaten gevonden' : 'Nog geen templates'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {q || catStr || status
              ? 'Probeer een andere zoekterm of filter.'
              : 'Maak je eerste template aan om te beginnen.'}
          </p>
          {!q && !catStr && !status && (
            <Link
              href="/admin/templates/new"
              className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Template aanmaken →
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
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Designs</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {templates.map((t) => {
                const thumb = t.previewImageUrl ?? t.thumbnail
                const statusCfg = STATUS_MAP[t.status] ?? STATUS_MAP.draft

                return (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    {/* Thumbnail */}
                    <td className="px-4 py-3">
                      <div className="w-9 h-9 rounded-lg border border-gray-100 bg-gray-50
                                      overflow-hidden flex items-center justify-center shrink-0">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-300 text-base">🃏</span>
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{t.name}</span>
                      {t.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{t.description}</p>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-gray-600">{t.category ?? '—'}</td>

                    {/* Dimensions */}
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {t.widthMm && t.heightMm ? `${t.widthMm}×${t.heightMm} mm` : '—'}
                    </td>

                    {/* Designs */}
                    <td className="px-4 py-3 text-gray-600 tabular-nums">{t._count.designs}</td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <span className={[
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                        statusCfg.cls,
                      ].join(' ')}>
                        <span className={['w-1.5 h-1.5 rounded-full shrink-0', statusCfg.dot].join(' ')} />
                        {statusCfg.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/templates/${t.id}/builder`}
                          className="px-2 py-1 text-xs font-medium text-emerald-600 hover:text-emerald-700
                                     hover:bg-emerald-50 rounded transition-colors"
                        >
                          Builder
                        </Link>
                        <Link
                          href={`/admin/templates/${t.id}`}
                          className="px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700
                                     hover:bg-indigo-50 rounded transition-colors"
                        >
                          Bewerken
                        </Link>
                        <TemplateDeleteButton id={t.id} name={t.name} />
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

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; cls: string; dot: string }> = {
  published: {
    label: 'Actief',
    cls:   'bg-green-50 text-green-700',
    dot:   'bg-green-500',
  },
  draft: {
    label: 'Concept',
    cls:   'bg-amber-50 text-amber-700',
    dot:   'bg-amber-400',
  },
  archived: {
    label: 'Verborgen',
    cls:   'bg-red-50 text-red-600',
    dot:   'bg-red-400',
  },
}
