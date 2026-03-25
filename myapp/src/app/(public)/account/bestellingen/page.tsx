import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAccountOrders } from '@/lib/data/account/get-account-orders'
import PageIntro from '@/components/account/PageIntro'
import OrderCard from '@/components/account/OrderCard'
import EmptyState from '@/components/account/EmptyState'
import Link from 'next/link'
import { formatEuro } from '@/lib/money'

export const metadata: Metadata = {
  title: 'Mijn bestellingen — Studio Twaalf',
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING:          'In afwachting',
  AWAITING_PAYMENT: 'Wacht op betaling',
  PAID:             'Betaald',
  FAILED:           'Mislukt',
  CANCELLED:        'Geannuleerd',
  EXPIRED:          'Verlopen',
  REFUNDED:         'Terugbetaald',
}

const FULFILLMENT_STATUS_LABEL: Record<string, string> = {
  PENDING:          'Geplaatst',
  AWAITING_PAYMENT: 'Wacht op betaling',
  PAID:             'Betaald',
  IN_PROGRESS:      'In verwerking',
  SHIPPED:          'Verzonden',
  COMPLETED:        'Afgerond',
  CANCELLED:        'Geannuleerd',
}

// Design-order sort order (existing flow)
const DESIGN_STATUS_ORDER: Record<string, number> = {
  in_productie: 0,
  bevestigd:    1,
  verzonden:    2,
  offerte:      3,
  geleverd:     4,
}

export default async function BestellingenPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null

  // Design / offerte orders (mock until design-order flow uses real DB)
  const MOCK_USER_ID = 'user-1'
  const designOrders = await getAccountOrders(MOCK_USER_ID)

  const sorted = [...designOrders].sort((a, b) => {
    const sa = DESIGN_STATUS_ORDER[a.status] ?? 99
    const sb = DESIGN_STATUS_ORDER[b.status] ?? 99
    if (sa !== sb) return sa - sb
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const active   = sorted.filter((o) => o.status !== 'geleverd')
  const archived = sorted.filter((o) => o.status === 'geleverd')

  // Webshop orders — real DB query for logged-in users
  let shopOrders: Array<{
    id: string
    orderNumber: string
    totalCents: number
    status: string
    paymentStatus: string
    createdAt: Date
    items: Array<{ productName: string; quantity: number }>
  }> = []

  if (userId) {
    try {
      shopOrders = await prisma.shopOrder.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { items: { select: { productName: true, quantity: true } } },
      })
    } catch {
      // DB unavailable — degrade gracefully
    }
  }

  const isEmpty = designOrders.length === 0 && shopOrders.length === 0

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Mijn account"
        title="Bestellingen"
        body="Volg de status van je bestellingen van offerte tot levering."
      />

      {isEmpty ? (
        <div className="grid">
          <EmptyState filtered={false} />
        </div>
      ) : (
        <>
          {/* ── Webshop bestellingen ───────────────────────────────────── */}
          {shopOrders.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold tracking-[0.12em] uppercase text-[#B5A48A] mb-4">
                Webshop bestellingen
              </h2>
              <div className="space-y-3">
                {shopOrders.map((order) => (
                  <article
                    key={order.id}
                    className="bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                  >
                    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-semibold text-[#9C8F7A] tracking-wider">
                            {order.orderNumber}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F5F0E8] text-[#7A6A52]">
                            {FULFILLMENT_STATUS_LABEL[order.status] ?? order.status}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F0F9F4] text-[#3D7A5A]">
                            {PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}
                          </span>
                        </div>
                        <p className="text-sm text-[#7A6A52] line-clamp-1">
                          {order.items.map((i) => `${i.quantity}× ${i.productName}`).join(', ')}
                        </p>
                        <div className="flex items-center gap-4 pt-0.5">
                          <span className="text-[11px] text-[#9C8F7A]">
                            {new Date(order.createdAt).toLocaleDateString('nl-BE', {
                              day: 'numeric', month: 'long', year: 'numeric',
                            })}
                          </span>
                          <span className="text-[11px] font-semibold text-[#2C2416]">
                            {formatEuro(order.totalCents)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Link
                          href={`/bestellen/bevestiging?orderId=${order.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2
                                     rounded-xl border border-neutral-200 text-[#2C2416] bg-white
                                     hover:bg-[#F5F0E8] transition-colors duration-150 whitespace-nowrap"
                        >
                          Details
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* ── Design / offerte orders ────────────────────────────────── */}
          {active.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold tracking-[0.12em] uppercase text-[#B5A48A] mb-4">
                Lopend
              </h2>
              <div className="space-y-3">
                {active.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </section>
          )}

          {archived.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold tracking-[0.12em] uppercase text-[#B5A48A] mb-4">
                Afgerond
              </h2>
              <div className="space-y-3">
                {archived.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
