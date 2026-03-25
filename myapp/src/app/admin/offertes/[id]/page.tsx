import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getOfferStatusMeta } from '@/lib/offer-status'
import OfferStatusSelector from '@/components/admin/OfferStatusSelector'
import { updateOfferStatusAction, updateOfferNotesAction } from './actions'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEuro(cents: number) {
  return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat('nl-BE', {
    day:    '2-digit',
    month:  'long',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  }).format(date)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: { id: string }
}

export default async function OfferteDetailPage({ params }: Props) {
  const offer = await prisma.offerRequest.findUnique({
    where: { id: params.id },
    include: {
      user:     true,
      template: { select: { id: true, name: true, category: true } },
      design:   { select: { id: true, name: true } },
    },
  })

  if (!offer) notFound()

  const meta = getOfferStatusMeta(offer.status)

  // Customer info — prefer user relation, fall back to offer fields
  const firstName = offer.user?.firstName ?? null
  const lastName  = offer.user?.lastName  ?? null
  const fullName  = [firstName, lastName].filter(Boolean).join(' ') || offer.customerName || '—'
  const email     = offer.user?.email     ?? offer.customerEmail ?? null
  const phone     = offer.user?.phone     ?? null

  // Items
  type OfferItem = { gadgetId?: string; name: string; priceCents: number; quantity: number }
  const items = (offer.itemsJson as OfferItem[] | null) ?? []

  // Bound actions
  const boundNotesAction = updateOfferNotesAction.bind(null, offer.id)

  return (
    <div className="max-w-5xl space-y-6">

      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/admin/offertes" className="hover:text-gray-600 transition-colors">
          Offertes
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium truncate max-w-xs">{fullName}</span>
      </nav>

      {/* ── Page title + status badge ──────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{fullName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Aangevraagd op {formatDateTime(offer.createdAt)}
          </p>
        </div>
        <span className={`${meta.className} shrink-0`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${meta.dotColor} mr-1.5`} />
          {meta.label}
        </span>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">

        {/* ── LEFT: customer + items + notes ─────────────────────────────── */}
        <div className="space-y-5">

          {/* Customer info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Klantgegevens</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">Naam</dt>
                <dd className="font-medium text-gray-900">{fullName}</dd>
              </div>
              {email && (
                <div>
                  <dt className="text-xs text-gray-400 mb-0.5">E-mail</dt>
                  <dd>
                    <a
                      href={`mailto:${email}`}
                      className="text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      {email}
                    </a>
                  </dd>
                </div>
              )}
              {phone && (
                <div>
                  <dt className="text-xs text-gray-400 mb-0.5">Telefoon</dt>
                  <dd>
                    <a
                      href={`tel:${phone}`}
                      className="text-gray-900 hover:text-indigo-600 transition-colors"
                    >
                      {phone}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">Concept / template</dt>
                <dd className="text-gray-900">
                  {offer.template.category && (
                    <span className="font-medium">{offer.template.category} — </span>
                  )}
                  {offer.template.name}
                </dd>
              </div>
              {offer.expectedDueDate && (
                <div>
                  <dt className="text-xs text-gray-400 mb-0.5">Gewenste datum</dt>
                  <dd className="text-gray-900">
                    {new Intl.DateTimeFormat('nl-BE', {
                      day: '2-digit', month: 'long', year: 'numeric',
                    }).format(offer.expectedDueDate)}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Gadgets / items */}
          {items.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Geselecteerde gadgets
                <span className="ml-2 font-normal text-gray-400">({items.length})</span>
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-2 text-left text-xs font-semibold text-gray-400">Product</th>
                    <th className="pb-2 text-center text-xs font-semibold text-gray-400">Aantal</th>
                    <th className="pb-2 text-right text-xs font-semibold text-gray-400">Stukprijs</th>
                    <th className="pb-2 text-right text-xs font-semibold text-gray-400">Subtotaal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item, i) => (
                    <tr key={i} className="text-gray-700">
                      <td className="py-2.5 font-medium">{item.name}</td>
                      <td className="py-2.5 text-center tabular-nums">{item.quantity}</td>
                      <td className="py-2.5 text-right tabular-nums">{formatEuro(item.priceCents)}</td>
                      <td className="py-2.5 text-right tabular-nums font-medium">
                        {formatEuro(item.priceCents * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200">
                    <td colSpan={3} className="pt-3 text-sm font-semibold text-gray-700">Totaal</td>
                    <td className="pt-3 text-right text-sm font-bold text-gray-900 tabular-nums">
                      {formatEuro(offer.totalCents)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Customer notes */}
          {offer.notes && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Opmerking klant</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{offer.notes}</p>
            </div>
          )}

          {/* Design link */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Ontwerp</h2>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 font-medium truncate">
                  {offer.design.name ?? 'Ontwerp zonder naam'}
                </p>
                <p className="text-xs text-gray-400 font-mono truncate mt-0.5">{offer.design.id}</p>
              </div>
              <Link
                href={`/design/${offer.template.id}/concept?design=${offer.design.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                           text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100
                           transition-colors border border-indigo-100"
              >
                Bekijk concept
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* ── RIGHT: sticky panel — status + notes ───────────────────────── */}
        <div className="lg:sticky lg:top-6 space-y-4">

          {/* Status selector */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <OfferStatusSelector
              offerId={offer.id}
              currentStatus={offer.status}
              updateAction={updateOfferStatusAction}
            />
          </div>

          {/* Internal notes */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Interne notities
            </h3>
            <form action={boundNotesAction} className="space-y-3">
              <textarea
                name="internalNotes"
                rows={5}
                defaultValue={offer.internalNotes ?? ''}
                placeholder="Notities voor intern gebruik (niet zichtbaar voor klant)…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                           placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="w-full py-2 text-sm font-medium bg-gray-900 text-white rounded-lg
                           hover:bg-gray-700 transition-colors"
              >
                Notities opslaan
              </button>
            </form>
          </div>

          {/* Meta info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Meta
            </h3>
            <dl className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between gap-2">
                <dt>Aangemaakt</dt>
                <dd className="text-gray-700 text-right">
                  {new Intl.DateTimeFormat('nl-BE', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  }).format(offer.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Bijgewerkt</dt>
                <dd className="text-gray-700 text-right">
                  {new Intl.DateTimeFormat('nl-BE', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  }).format(offer.updatedAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Valuta</dt>
                <dd className="text-gray-700">{offer.currency}</dd>
              </div>
              <div className="pt-1 border-t border-gray-100">
                <dt className="mb-1">ID</dt>
                <dd className="font-mono text-[11px] text-gray-400 break-all">{offer.id}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
