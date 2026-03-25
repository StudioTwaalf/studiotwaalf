'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import CheckoutStepper from '@/components/checkout/CheckoutStepper'
import CustomerForm from '@/components/checkout/CustomerForm'
import ShippingForm from '@/components/checkout/ShippingForm'
import CartSummary from '@/components/cart/CartSummary'
import { formatEuro } from '@/lib/money'
import { trackEcommerce, toEcommerceItem } from '@/lib/analytics'

interface CartItem {
  id: string
  productName: string
  variantName: string | null
  quantity: number
  unitPriceCents: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [step, setStep] = useState(1)
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [customer, setCustomer] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
  })

  const [shipping, setShipping] = useState({
    shippingName: '',
    shippingStreet: '',
    shippingNumber: '',
    shippingZip: '',
    shippingCity: '',
    shippingCountry: 'BE',
  })

  const [customerNotes, setCustomerNotes] = useState('')
  const beginCheckoutFiredRef = useRef(false)

  // Load cart
  useEffect(() => {
    fetch('/api/cart').then((r) => r.json()).then((data) => {
      setItems(data.items ?? [])
      setLoading(false)
    })
  }, [])

  const subtotalCentsComputed = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0)

  // GA4: begin_checkout — fires once when cart is loaded with items
  useEffect(() => {
    if (loading || items.length === 0 || beginCheckoutFiredRef.current) return
    beginCheckoutFiredRef.current = true
    trackEcommerce({
      event:    'begin_checkout',
      currency: 'EUR',
      value:    subtotalCentsComputed / 100,
      items:    items.map((item, idx) =>
        toEcommerceItem({
          id:        item.id,
          name:      item.productName,
          variant:   item.variantName,
          priceCents: item.unitPriceCents,
          quantity:  item.quantity,
          index:     idx,
        })
      ),
    })
  }, [loading, items, subtotalCentsComputed])

  // Pre-fill from session
  useEffect(() => {
    if (session?.user) {
      setCustomer((prev) => ({
        ...prev,
        customerName: session.user?.name ?? prev.customerName,
        customerEmail: session.user?.email ?? prev.customerEmail,
      }))
    }
  }, [session])

  const subtotalCents = subtotalCentsComputed

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)

    // GA4: add_payment_info — fires when user clicks "Betalen via Mollie"
    trackEcommerce({
      event:        'add_payment_info',
      currency:     'EUR',
      value:        subtotalCents / 100,
      payment_type: 'mollie',
      items:        items.map((item, idx) =>
        toEcommerceItem({ id: item.id, name: item.productName, variant: item.variantName, priceCents: item.unitPriceCents, quantity: item.quantity, index: idx })
      ),
    })

    try {
      // 1. Create order
      const orderRes = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...customer, ...shipping, customerNotes }),
      })
      if (!orderRes.ok) {
        const e = await orderRes.json()
        throw new Error(e.error ?? 'Bestelling kon niet worden aangemaakt')
      }
      const { orderId } = await orderRes.json()

      // 2. Initiate payment
      const payRes = await fetch(`/api/shop/orders/${orderId}/payment`, { method: 'POST' })
      if (!payRes.ok) throw new Error('Betaling kon niet worden gestart')
      const { checkoutUrl } = await payRes.json()

      // 3. Redirect to Mollie
      window.location.href = checkoutUrl
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Er ging iets mis')
      setSubmitting(false)
    }
  }

  function canAdvanceStep1() {
    return customer.customerName.trim() && customer.customerEmail.trim()
  }

  function canAdvanceStep2() {
    const s = shipping
    return s.shippingStreet.trim() && s.shippingNumber.trim() && s.shippingZip.trim() && s.shippingCity.trim()
  }

  if (loading) {
    return (
      <div className="bg-studio-beige min-h-screen pt-24 flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-studio-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-studio-beige min-h-screen pt-24">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <p className="font-serif text-2xl font-semibold text-studio-black mb-3">Winkelwagen is leeg</p>
          <Link href="/webshop" className="text-sm text-studio-yellow underline">Terug naar webshop</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-studio-beige min-h-screen">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 pt-24 pb-20">

        {/* Header */}
        <div className="mb-8">
          <Link href="/winkelwagen" className="text-sm text-[#8A7A6A] hover:text-studio-black transition-colors flex items-center gap-1 mb-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Terug naar winkelwagen
          </Link>
          <h1 className="font-serif text-3xl font-semibold text-studio-black mb-6">Bestellen</h1>
          <CheckoutStepper current={step} />
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start mt-8">

          {/* Form area */}
          <div className="bg-white rounded-2xl border border-[#EDE7D9] p-6 sm:p-8">

            {step === 1 && (
              <>
                <h2 className="font-semibold text-studio-black mb-5">Jouw gegevens</h2>
                <CustomerForm value={customer} onChange={setCustomer} />
                <button
                  onClick={() => { if (canAdvanceStep1()) setStep(2) }}
                  disabled={!canAdvanceStep1()}
                  className="mt-6 w-full bg-studio-black text-white text-sm font-semibold py-3.5 rounded-xl hover:bg-[#2C2416] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Volgende: Bezorgadres
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-semibold text-studio-black mb-5">Bezorgadres</h2>
                <ShippingForm value={shipping} onChange={setShipping} />
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-[#7A6A52] uppercase tracking-wide mb-1.5">
                    Opmerkingen (optioneel)
                  </label>
                  <textarea
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    rows={3}
                    placeholder="Bijzondere wensen of opmerkingen..."
                    className="w-full border border-[#E0D5C5] rounded-xl px-4 py-3 text-sm text-studio-black bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-studio-yellow/50 resize-none"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 border border-[#E0D5C5] text-[#7A6A52] text-sm font-semibold py-3.5 rounded-xl hover:bg-[#F5F0E8] transition-colors"
                  >
                    Terug
                  </button>
                  <button
                    onClick={() => {
                      if (!canAdvanceStep2()) return
                      setStep(3)
                      // GA4: add_shipping_info
                      trackEcommerce({
                        event:         'add_shipping_info',
                        currency:      'EUR',
                        value:         subtotalCents / 100,
                        shipping_tier: shipping.shippingCountry === 'BE' ? 'standard_be' : 'standard_eu',
                        items:         items.map((item, idx) =>
                          toEcommerceItem({ id: item.id, name: item.productName, variant: item.variantName, priceCents: item.unitPriceCents, quantity: item.quantity, index: idx })
                        ),
                      })
                    }}
                    disabled={!canAdvanceStep2()}
                    className="flex-2 flex-1 bg-studio-black text-white text-sm font-semibold py-3.5 rounded-xl hover:bg-[#2C2416] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Overzicht bekijken
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-semibold text-studio-black mb-5">Overzicht & betalen</h2>

                {/* Order items */}
                <div className="space-y-2 mb-5">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm text-[#7A6A52]">
                      <span>{item.productName}{item.variantName ? ` — ${item.variantName}` : ''} × {item.quantity}</span>
                      <span className="font-medium text-studio-black">{formatEuro(item.unitPriceCents * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Customer summary */}
                <div className="bg-[#FAFAF7] rounded-xl p-4 text-sm space-y-1 mb-5">
                  <p className="font-medium text-studio-black">{customer.customerName}</p>
                  <p className="text-[#7A6A52]">{customer.customerEmail}</p>
                  <p className="text-[#7A6A52]">{shipping.shippingStreet} {shipping.shippingNumber}, {shipping.shippingZip} {shipping.shippingCity}</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    disabled={submitting}
                    className="flex-1 border border-[#E0D5C5] text-[#7A6A52] text-sm font-semibold py-3.5 rounded-xl hover:bg-[#F5F0E8] disabled:opacity-50 transition-colors"
                  >
                    Terug
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 bg-studio-yellow text-[#2C2416] text-sm font-semibold py-3.5 rounded-xl hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Even wachten...
                      </>
                    ) : (
                      'Betalen via Mollie'
                    )}
                  </button>
                </div>
                <p className="text-xs text-center text-[#B5A48A] mt-3">
                  Je wordt doorgestuurd naar de beveiligde betaalpagina van Mollie
                </p>
              </>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="space-y-4">
            <CartSummary subtotalCents={subtotalCents} country={shipping.shippingCountry} />
          </div>
        </div>
      </div>
    </div>
  )
}
