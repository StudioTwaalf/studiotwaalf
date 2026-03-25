import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatEuro } from '@/lib/money'
import { getPaymentStatusMeta, getOrderStatusMeta } from '@/lib/shop/shop-status'
import OrderStatusSelector from '@/components/admin/OrderStatusSelector'
import { updateOrderStatusAction, updateOrderNotesAction } from './actions'

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  params: Promise<{ id: string }>
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params

  const order = await prisma.shopOrder.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { id: 'asc' },
        select: {
          id:            true,
          productName:   true,
          variantName:   true,
          quantity:      true,
          unitPriceCents: true,
          totalCents:    true,
          personalization: true,
          optionValues:  true,
        },
      },
    },
  })

  if (!order) notFound()

  const payMeta   = getPaymentStatusMeta(order.paymentStatus)
  const orderMeta = getOrderStatusMeta(order.status)

  const boundNotesAction  = updateOrderNotesAction.bind(null, order.id)

  return (
    <div className="max-w-5xl space-y-6">

      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/admin/bestellingen" className="hover:text-gray-600 transition-colors">
          Bestellingen
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium font-mono">{order.orderNumber}</span>
      </nav>

      {/* ── Page title + badges ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Besteld op {formatDateTime(order.createdAt)}
          </p>
        </div>
        {/* Dual status badges */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <span className={payMeta.className}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${payMeta.dotColor} mr-1.5`} />
            {payMeta.label}
          </span>
          <span className={orderMeta.className}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${orderMeta.dotColor} mr-1.5`} />
            {orderMeta.label}
          </span>
        </div>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">

        {/* ── LEFT: items + customer notes + internal notes ───────────────── */}
        <div className="space-y-5">

          {/* Order items */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Producten
              <span className="ml-2 font-normal text-gray-400">({order.items.length})</span>
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => {
                const personalization = item.personalization as Record<string, string> | null
                const optionValues    = item.optionValues    as Record<string, string> | null
                const extraFields     = { ...(optionValues ?? {}), ...(personalization ?? {}) }
                const hasExtra        = Object.values(extraFields).some(Boolean)

                return (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.variantName}</p>
                      )}
                      {hasExtra && (
                        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 space-y-0.5">
                          {Object.entries(extraFields).map(([k, v]) =>
                            v ? (
                              <div key={k}>
                                <span className="font-semibold capitalize">{k}:</span>{' '}
                                <span className="whitespace-pre-wrap">{v}</span>
                              </div>
                            ) : null,
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm shrink-0">
                      <p className="text-gray-400 text-xs">×{item.quantity} × {formatEuro(item.unitPriceCents)}</p>
                      <p className="font-semibold text-gray-900 mt-0.5">{formatEuro(item.totalCents)}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 mt-5 pt-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotaal</span>
                <span className="tabular-nums">{formatEuro(order.subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Verzending</span>
                <span className="tabular-nums">
                  {order.shippingCents === 0 ? 'Gratis' : formatEuro(order.shippingCents)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-100">
                <span>Totaal</span>
                <span className="tabular-nums">{formatEuro(order.totalCents)}</span>
              </div>
            </div>
          </div>

          {/* Customer notes */}
          {order.customerNotes && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Opmerking klant</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.customerNotes}</p>
            </div>
          )}

          {/* Internal notes */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Interne notities</h2>
            <form action={boundNotesAction} className="space-y-3">
              <textarea
                name="internalNotes"
                rows={4}
                defaultValue={order.internalNotes ?? ''}
                placeholder="Notities voor intern gebruik (niet zichtbaar voor klant)…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900
                           resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
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

        </div>

        {/* ── RIGHT: sticky panel ───────────────────────────────────────── */}
        <div className="lg:sticky lg:top-6 space-y-4">

          {/* Order status selector */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <OrderStatusSelector
              orderId={order.id}
              currentStatus={order.status}
              updateAction={updateOrderStatusAction}
            />
          </div>

          {/* Customer info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Klant</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-gray-900">{order.customerName}</p>
                <a
                  href={`mailto:${order.customerEmail}`}
                  className="text-indigo-600 hover:text-indigo-800 text-xs transition-colors"
                >
                  {order.customerEmail}
                </a>
              </div>
              {order.customerPhone && (
                <div>
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="text-gray-700 hover:text-indigo-600 text-xs transition-colors"
                  >
                    {order.customerPhone}
                  </a>
                </div>
              )}
            </dl>
          </div>

          {/* Shipping address */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Bezorgadres</h3>
            <address className="text-sm text-gray-700 not-italic space-y-0.5">
              <p className="font-medium">{order.shippingName}</p>
              <p className="text-gray-500">{order.shippingStreet} {order.shippingNumber}</p>
              <p className="text-gray-500">{order.shippingZip} {order.shippingCity}</p>
              <p className="text-gray-500">{order.shippingCountry}</p>
            </address>
          </div>

          {/* Payment info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Betaling</h3>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between items-center gap-2">
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <span className={payMeta.className}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${payMeta.dotColor} mr-1`} />
                    {payMeta.label}
                  </span>
                </dd>
              </div>
              {order.molliePaymentId && (
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Mollie ID</dt>
                  <dd className="font-mono text-gray-700 text-[11px]">{order.molliePaymentId}</dd>
                </div>
              )}
              {order.paidAt && (
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Betaald op</dt>
                  <dd className="text-gray-700">
                    {new Intl.DateTimeFormat('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' }).format(order.paidAt)}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Meta */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Meta</h3>
            <dl className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between gap-2">
                <dt>Aangemaakt</dt>
                <dd className="text-gray-700 text-right">
                  {new Intl.DateTimeFormat('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' }).format(order.createdAt)}
                </dd>
              </div>
              <div className="pt-1 border-t border-gray-100">
                <dt className="mb-1">ID</dt>
                <dd className="font-mono text-[11px] text-gray-400 break-all">{order.id}</dd>
              </div>
            </dl>
          </div>

        </div>
      </div>
    </div>
  )
}
