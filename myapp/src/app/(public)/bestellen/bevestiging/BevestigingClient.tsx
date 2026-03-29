'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { formatEuro } from '@/lib/money'
import { trackEcommerce, toEcommerceItem } from '@/lib/analytics'

interface OrderItem {
  id: string
  productName: string
  variantName: string | null
  quantity: number
  unitPriceCents: number   // per-unit price — used for GA4 item price (not line total)
  totalCents: number       // line total (unitPriceCents × quantity) — used for display only
  personalization: Record<string, string> | null
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  shippingStreet: string
  shippingNumber: string
  shippingZip: string
  shippingCity: string
  shippingCountry: string
  subtotalCents: number
  shippingCents: number
  totalCents: number
  status: string
  paymentStatus: string
  items: OrderItem[]
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'In afwachting van betaling',
  AWAITING_PAYMENT: 'Wacht op betaling',
  PAID: 'Betaald',
  IN_PROGRESS: 'In verwerking',
  SHIPPED: 'Verzonden',
  COMPLETED: 'Afgerond',
  CANCELLED: 'Geannuleerd',
}

// How long to poll before giving up (Mollie webhook is usually <1s, but allow up to 30s)
const POLL_INTERVAL_MS  = 2500
const POLL_MAX_ATTEMPTS = 12   // 12 × 2.5s = 30s total

/** Payment statuses that mean polling should stop (terminal states). */
const TERMINAL_STATUSES = new Set(['PAID', 'CANCELLED', 'FAILED', 'EXPIRED'])

export default function BevestigingClient() {
  const params = useSearchParams()
  const orderId = params.get('orderId')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const purchaseFiredRef = useRef(false)

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) { setLoading(false); return }
    fetch(`/api/shop/orders/${orderId}`)
      .then((r) => r.json())
      .then((data: Order) => { setOrder(data); setLoading(false) })
  }, [orderId])

  // ── Webhook race-condition poller ──────────────────────────────────────────
  // Mollie fires its webhook and the browser redirect at the same time.
  // If the browser arrives at this page before the webhook has processed
  // (webhook HTTP round-trip + DB write), the order will still show
  // AWAITING_PAYMENT. We poll every 2.5 s until a terminal status arrives.
  // The purchase event fires automatically once order.paymentStatus === 'PAID'.
  useEffect(() => {
    if (!orderId || !order) return
    if (TERMINAL_STATUSES.has(order.paymentStatus)) return  // already resolved

    let attempts = 0
    const timer = setInterval(async () => {
      attempts++
      try {
        const res  = await fetch(`/api/shop/orders/${orderId}`)
        const data = await res.json() as Order
        if (TERMINAL_STATUSES.has(data.paymentStatus)) {
          setOrder(data)
          clearInterval(timer)
        }
      } catch { /* network hiccup — next attempt will retry */ }
      if (attempts >= POLL_MAX_ATTEMPTS) clearInterval(timer)
    }, POLL_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [orderId, order?.paymentStatus])   // re-evaluate only when status changes

  // ── GA4: purchase event ────────────────────────────────────────────────────
  // Fires once per order after backend confirms payment.
  //
  // Deduplication layers:
  //   1. paymentStatus guard — never fires without Mollie confirmation
  //   2. useRef             — blocks double-fire within React lifecycle (Strict Mode)
  //   3. sessionStorage     — blocks re-fire if user refreshes within same session
  //
  // item.unitPriceCents is the per-unit price (NOT line total).
  // GA4 calculates item revenue as price × quantity — passing the line total
  // here would inflate per-item revenue by the quantity factor.
  useEffect(() => {
    if (!order || order.paymentStatus !== 'PAID' || purchaseFiredRef.current) return

    const storageKey = `ga_purchase_${order.id}`
    if (typeof window !== 'undefined' && sessionStorage.getItem(storageKey)) return

    purchaseFiredRef.current = true
    if (typeof window !== 'undefined') sessionStorage.setItem(storageKey, '1')

    trackEcommerce({
      event:          'purchase',
      transaction_id: order.orderNumber,
      currency:       'EUR',
      value:          order.totalCents    / 100,
      shipping:       order.shippingCents / 100,
      items:          order.items.map((item, idx) =>
        toEcommerceItem({
          id:         item.id,
          name:       item.productName,
          priceCents: item.unitPriceCents,   // unit price — GA4 multiplies by quantity itself
          quantity:   item.quantity,
          index:      idx,
        })
      ),
    })
  }, [order])

  if (loading) {
    return (
      <div className="bg-studio-beige min-h-screen pt-24 flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-studio-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order || !orderId) {
    return (
      <div className="bg-studio-beige min-h-screen pt-24">
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <p className="font-serif text-2xl font-semibold text-studio-black mb-3">Bestelling niet gevonden</p>
          <Link href="/webshop" className="text-sm text-studio-yellow underline">Terug naar webshop</Link>
        </div>
      </div>
    )
  }

  const isPaid = order.paymentStatus === 'PAID'
  const isCancelled = ['CANCELLED', 'FAILED', 'EXPIRED'].includes(order.paymentStatus)

  return (
    <div className="bg-studio-beige min-h-screen">
      <div className="max-w-2xl mx-auto px-6 sm:px-8 pt-24 pb-20">

        {/* Status header */}
        <div className={`rounded-2xl p-8 text-center mb-8 ${
          isPaid ? 'bg-[#A8BFA3]/20 border border-[#A8BFA3]/40' :
          isCancelled ? 'bg-red-50 border border-red-200' :
          'bg-studio-yellow/20 border border-studio-yellow/30'
        }`}>
          {isPaid ? (
            <>
              <div className="w-14 h-14 bg-[#A8BFA3] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h1 className="font-serif text-2xl font-semibold text-studio-black mb-2">Bestelling bevestigd</h1>
              <p className="text-[#7A6A52] text-sm">Bedankt voor je bestelling! We gaan er meteen mee aan de slag.</p>
            </>
          ) : isCancelled ? (
            <>
              <h1 className="font-serif text-2xl font-semibold text-studio-black mb-2">Betaling mislukt</h1>
              <p className="text-[#7A6A52] text-sm">De betaling werd geannuleerd of is mislukt. Je kan het opnieuw proberen.</p>
              <Link href="/winkelwagen" className="inline-block mt-4 text-sm font-semibold text-studio-black underline">
                Terug naar winkelwagen
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-serif text-2xl font-semibold text-studio-black mb-2">Bestelling ontvangen</h1>
              <p className="text-[#7A6A52] text-sm">We wachten nog op bevestiging van je betaling. Je ontvangt een e-mail van zodra dit is afgerond.</p>
            </>
          )}
        </div>

        {/* Order number */}
        <div className="bg-white rounded-2xl border border-[#EDE7D9] p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest">Bestelnummer</span>
            <span className="font-mono font-semibold text-studio-black text-lg">{order.orderNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest">Status</span>
            <span className="text-sm font-medium text-studio-black">{STATUS_LABEL[order.status] ?? order.status}</span>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-[#EDE7D9] p-6 mb-5">
          <h2 className="text-sm font-semibold text-[#7A6A52] uppercase tracking-wide mb-4">Bestelde producten</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <span className="font-medium text-studio-black">{item.productName}</span>
                  {item.variantName && <span className="text-[#8A7A6A]"> — {item.variantName}</span>}
                  <span className="text-[#8A7A6A]"> × {item.quantity}</span>
                  {item.personalization?.name && (
                    <p className="text-xs text-[#B5A48A] mt-0.5">Naam: {item.personalization.name}</p>
                  )}
                </div>
                <span className="font-medium text-studio-black">{formatEuro(item.totalCents)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#EDE7D9] mt-4 pt-4 space-y-1">
            <div className="flex justify-between text-sm text-[#7A6A52]">
              <span>Subtotaal</span><span>{formatEuro(order.subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#7A6A52]">
              <span>Verzending</span><span>{order.shippingCents === 0 ? 'Gratis' : formatEuro(order.shippingCents)}</span>
            </div>
            <div className="flex justify-between font-semibold text-studio-black pt-1">
              <span>Totaal</span><span>{formatEuro(order.totalCents)}</span>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div className="bg-white rounded-2xl border border-[#EDE7D9] p-6 mb-8">
          <h2 className="text-sm font-semibold text-[#7A6A52] uppercase tracking-wide mb-3">Bezorgadres</h2>
          <p className="text-sm text-studio-black">{order.customerName}</p>
          <p className="text-sm text-[#7A6A52]">{order.shippingStreet} {order.shippingNumber}</p>
          <p className="text-sm text-[#7A6A52]">{order.shippingZip} {order.shippingCity}</p>
        </div>

        <div className="text-center space-y-3">
          <Link
            href="/webshop"
            className="inline-flex items-center gap-2 bg-studio-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#2C2416] transition-colors"
          >
            Verder winkelen
          </Link>
          <p className="text-xs text-[#B5A48A]">
            Bevestiging verstuurd naar {order.customerEmail}
          </p>
        </div>

      </div>
    </div>
  )
}
