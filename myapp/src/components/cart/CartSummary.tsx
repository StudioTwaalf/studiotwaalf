import { formatEuro } from '@/lib/money'
import { calcShipping, FREE_SHIPPING_THRESHOLD_CENTS, SHIPPING_RATES } from '@/lib/shop/shipping'

interface CartSummaryProps {
  subtotalCents: number
  country?: string
}

export default function CartSummary({ subtotalCents, country = 'BE' }: CartSummaryProps) {
  const shippingCents    = calcShipping(country, subtotalCents)
  const totalCents       = subtotalCents + shippingCents
  const freeShippingLeft = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents)
  const freeShippingPct  = Math.min(100, Math.round((subtotalCents / FREE_SHIPPING_THRESHOLD_CENTS) * 100))
  const isFreeShipping   = shippingCents === 0

  return (
    <div className="bg-white border border-[#EDE7D9] rounded-2xl overflow-hidden">

      {/* Free shipping progress */}
      {isFreeShipping ? (
        <div className="px-5 pt-4 pb-3 border-b border-[#F0EAD8] flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs font-medium text-green-700">Gratis verzending van toepassing</span>
        </div>
      ) : (
        <div className="px-5 pt-4 pb-3 border-b border-[#F0EAD8]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-[#8A7A6A]">
              Nog {formatEuro(freeShippingLeft)} voor gratis verzending
            </span>
            <span className="text-xs font-semibold text-[#8B6F3E]">{freeShippingPct}%</span>
          </div>
          <div className="h-1.5 bg-[#F0EAD8] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C4A46B] rounded-full transition-all duration-500"
              style={{ width: `${freeShippingPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Price rows */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex justify-between text-sm text-[#7A6A52]">
          <span>Subtotaal</span>
          <span className="tabular-nums">{formatEuro(subtotalCents)}</span>
        </div>
        <div className="flex justify-between text-sm text-[#7A6A52]">
          <span>Verzending ({SHIPPING_RATES[country]?.label ?? 'Overig Europa'})</span>
          <span className={`tabular-nums ${isFreeShipping ? 'text-green-700 font-medium' : ''}`}>
            {isFreeShipping ? 'Gratis' : formatEuro(shippingCents)}
          </span>
        </div>
        <div className="border-t border-[#F0EAD8] pt-3 flex justify-between">
          <span className="text-sm font-semibold text-studio-black">Totaal</span>
          <span className="text-base font-semibold text-studio-black tabular-nums">
            {formatEuro(totalCents)}
          </span>
        </div>
      </div>

      {/* Reassurance */}
      <div className="px-5 pb-4 space-y-1.5 border-t border-[#F0EAD8] pt-3">
        <div className="flex items-center gap-2 text-[11px] text-[#B5A48A]">
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Veilig betalen via Mollie
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#B5A48A]">
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Persoonlijk verwerkt met zorg
        </div>
      </div>

    </div>
  )
}
