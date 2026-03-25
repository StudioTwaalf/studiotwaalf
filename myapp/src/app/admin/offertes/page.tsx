import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getOfferStatusMeta } from '@/lib/offer-status'
import type { OfferRequestStatus } from '@prisma/client'   // used in STATUS_COUNTS_ORDER + statusCounts type
import OfferteSearchFilter from '@/components/admin/OfferteSearchFilter'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEuro(cents: number) {
  return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function displayName(offer: {
  customerName: string | null
  user: { firstName: string | null; lastName: string | null; email: string } | null
}): string {
  if (offer.user?.firstName || offer.user?.lastName) {
    return [offer.user.firstName, offer.user.lastName].filter(Boolean).join(' ')
  }
  return offer.customerName ?? offer.user?.email ?? '—'
}

// ─── Status count badge ───────────────────────────────────────────────────────

const STATUS_COUNTS_ORDER: OfferRequestStatus[] = [
  'OFFER_REQUESTED', 'TO_CONTACT',
  'SAMPLES_REQUESTED',
  'APPOINTMENT_MADE', 'APPOINTMENT_SET',
  'SAMPLES_SENT',
  'CONFIRMED',
  'REJECTED',
]

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: { q?: string; status?: string; category?: string }
}

export default async function OffertesPage({ searchParams }: PageProps) {
  const { q, status, category } = searchParams

  // Fetch all offers — then do in-memory filtering for name/email/category
  // (avoids complex Prisma OR queries across relations)
  const raw = await prisma.offerRequest.findMany({
    ...(status ? { where: { status: status as OfferRequestStatus } } : {}),
    orderBy: { createdAt: 'desc' },
    select: {
      id:            true,
      createdAt:     true,
      status:        true,
      customerName:  true,
      customerEmail: true,
      totalCents:    true,
      notes:         true,
      internalNotes: true,
      user: {
        select: {
          firstName: true,
          lastName:  true,
          email:     true,
          phone:     true,
        },
      },
      template: {
        select: {
          id:       true,
          name:     true,
          category: true,
        },
      },
    },
  })

  // In-memory search + category filter
  const offers = raw.filter((o) => {
    if (category && o.template.category !== category) return false
    if (q) {
      const needle = q.toLowerCase()
      const name   = displayName(o).toLowerCase()
      const email  = (o.user?.email ?? o.customerEmail ?? '').toLowerCase()
      if (!name.includes(needle) && !email.includes(needle)) return false
    }
    return true
  })

  // Unique categories for filter dropdown
  const allCategories = Array.from(new Set(
    raw.map((o) => o.template.category).filter(Boolean) as string[],
  )).sort()

  // Status summary counts (on unfiltered data)
  const statusCounts: Partial<Record<OfferRequestStatus, number>> = {}
  for (const o of raw) {
    statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1
  }

  const hasFilters = Boolean(q || status || category)

  return (
    <div className="max-w-6xl space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Offertes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {raw.length} aanvra{raw.length === 1 ? 'ag' : 'gen'} in totaal
          </p>
        </div>
      </div>

      {/* ── Status summary pills ──────────────────────────────────────────── */}
      {!hasFilters && raw.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {STATUS_COUNTS_ORDER.filter((s) => statusCounts[s]).map((s) => {
            const meta  = getOfferStatusMeta(s)
            const count = statusCounts[s]!
            return (
              <Link
                key={s}
                href={`/admin/offertes?status=${s}`}
                className={`${meta.className} gap-1.5 transition-opacity hover:opacity-80`}
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${meta.dotColor} shrink-0`} />
                {meta.label}
                <span className="ml-1 font-semibold">{count}</span>
              </Link>
            )
          })}
        </div>
      )}

      {/* ── Search + filter bar ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
        <OfferteSearchFilter categories={allCategories} />
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {offers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-sm font-medium text-gray-500">Geen offertes gevonden</p>
          {hasFilters && (
            <Link
              href="/admin/offertes"
              className="mt-2 inline-block text-xs text-indigo-600 hover:text-indigo-800 underline"
            >
              Wis filters
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Klant
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Concept
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Totaal
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Datum
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {offers.map((offer) => {
                const meta     = getOfferStatusMeta(offer.status)
                const name     = displayName(offer)
                const email    = offer.user?.email ?? offer.customerEmail
                const concept  = offer.template.category ?? offer.template.name
                const template = offer.template.name

                return (
                  <tr
                    key={offer.id}
                    className="hover:bg-gray-50/60 transition-colors group"
                  >
                    {/* Klant */}
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{name}</p>
                      {email && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{email}</p>
                      )}
                    </td>

                    {/* Concept */}
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">{concept ?? template}</p>
                      {concept && concept !== template && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{template}</p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={meta.className}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${meta.dotColor} mr-1.5`} />
                        {meta.label}
                      </span>
                    </td>

                    {/* Totaal */}
                    <td className="px-5 py-4 tabular-nums text-gray-700">
                      {offer.totalCents > 0 ? formatEuro(offer.totalCents) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Datum */}
                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                      {formatDate(offer.createdAt)}
                    </td>

                    {/* Actie */}
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/offertes/${offer.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                                   text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100
                                   transition-colors border border-indigo-100"
                      >
                        Bekijk meer
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
    </div>
  )
}
