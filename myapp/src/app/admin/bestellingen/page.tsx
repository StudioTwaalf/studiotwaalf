import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatEuro } from '@/lib/money'
import { getPaymentStatusMeta, getOrderStatusMeta } from '@/lib/shop/shop-status'
import type { ShopOrderStatus } from '@prisma/client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Bestellingen – Admin' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('nl-BE', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  }).format(date)
}

// ─── Order status filter tabs ─────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: ShopOrderStatus | null }[] = [
  { label: 'Alle',           value: null },
  { label: 'Nieuw',          value: 'PENDING' },
  { label: 'Betaald',        value: 'PAID' },
  { label: 'In verwerking',  value: 'IN_PROGRESS' },
  { label: 'Verzonden',      value: 'SHIPPED' },
  { label: 'Afgerond',       value: 'COMPLETED' },
  { label: 'Geannuleerd',    value: 'CANCELLED' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function AdminBestellingenPage({ searchParams }: PageProps) {
  const { status, page: pageParam } = await searchParams
  const page  = Math.max(1, parseInt(pageParam ?? '1', 10))
  const limit = 25

  const where = status ? { status: status as ShopOrderStatus } : {}

  const [orders, total, statusCounts] = await Promise.all([
    prisma.shopOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:  (page - 1) * limit,
      take:  limit,
      include: { _count: { select: { items: true } } },
    }),
    prisma.shopOrder.count({ where }),
    prisma.shopOrder.groupBy({ by: ['status'], _count: true }),
  ])

  const countByStatus = Object.fromEntries(statusCounts.map((r) => [r.status, r._count]))
  const pages = Math.ceil(total / limit)

  return (
    <div className="max-w-6xl space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Bestellingen</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} bestelling{total !== 1 ? 'en' : ''} in totaal
          </p>
        </div>
      </div>

      {/* ── Status summary pills ─────────────────────────────────────────── */}
      {!status && total > 0 && (
        <div className="flex flex-wrap gap-2">
          {(['PENDING', 'PAID', 'IN_PROGRESS', 'SHIPPED'] as ShopOrderStatus[])
            .filter((s) => countByStatus[s])
            .map((s) => {
              const meta  = getOrderStatusMeta(s)
              const count = countByStatus[s]!
              return (
                <Link
                  key={s}
                  href={`/admin/bestellingen?status=${s}`}
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

      {/* ── Status filter tabs ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map(({ label, value }) => {
            const isActive = (status ?? null) === value
            const href     = value ? `/admin/bestellingen?status=${value}` : '/admin/bestellingen'
            const count    = value ? (countByStatus[value] ?? 0) : total
            return (
              <Link
                key={value ?? 'all'}
                href={href}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                ].join(' ')}
              >
                {label}
                {count > 0 && (
                  <span className={`text-[10px] font-semibold tabular-nums ${isActive ? 'opacity-70' : 'text-gray-400'}`}>
                    {count}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-sm font-medium text-gray-500">Geen bestellingen gevonden</p>
          {status && (
            <Link
              href="/admin/bestellingen"
              className="mt-2 inline-block text-xs text-indigo-600 hover:text-indigo-800 underline"
            >
              Wis filter
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Bestelling
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Klant
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Datum
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Totaal
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Betaling
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => {
                const payMeta   = getPaymentStatusMeta(order.paymentStatus)
                const orderMeta = getOrderStatusMeta(order.status)
                return (
                  <tr key={order.id} className="hover:bg-gray-50/60 transition-colors group">

                    {/* Bestelling */}
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs font-semibold text-gray-800">{order.orderNumber}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{order._count.items} artikel{order._count.items !== 1 ? 'en' : ''}</p>
                    </td>

                    {/* Klant */}
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{order.customerName}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{order.customerEmail}</p>
                    </td>

                    {/* Datum */}
                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>

                    {/* Totaal */}
                    <td className="px-5 py-4 font-semibold text-gray-900 tabular-nums whitespace-nowrap">
                      {formatEuro(order.totalCents)}
                    </td>

                    {/* Betaling */}
                    <td className="px-5 py-4">
                      <span className={payMeta.className}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${payMeta.dotColor} mr-1.5`} />
                        {payMeta.label}
                      </span>
                    </td>

                    {/* Verwerkingsstatus */}
                    <td className="px-5 py-4">
                      <span className={orderMeta.className}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${orderMeta.dotColor} mr-1.5`} />
                        {orderMeta.label}
                      </span>
                    </td>

                    {/* Actie */}
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/bestellingen/${order.id}`}
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

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {pages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/bestellingen?page=${p}${status ? `&status=${status}` : ''}`}
              className={[
                'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors',
                p === page ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              ].join(' ')}
            >
              {p}
            </Link>
          ))}
        </div>
      )}

    </div>
  )
}
