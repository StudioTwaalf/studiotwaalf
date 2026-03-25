import Link from 'next/link'
import type { Order } from '@/types/account'
import OrderStatusBadge from './OrderStatusBadge'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-BE', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('nl-BE', { style: 'currency', currency: 'EUR' })
}

interface Props {
  order: Order
}

export default function OrderCard({ order }: Props) {
  return (
    <article className="bg-white rounded-2xl border border-neutral-200 shadow-sm
                        hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-4">

        {/* Left — order info */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Reference + status */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-mono font-semibold text-[#9C8F7A] tracking-wider">
              {order.reference}
            </span>
            <OrderStatusBadge status={order.status} />
          </div>

          {/* Project name */}
          <p className="text-sm font-semibold text-[#2C2416] leading-snug line-clamp-1">
            {order.projectName}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-4 pt-0.5 flex-wrap">
            <span className="text-[11px] text-[#9C8F7A]">
              {formatDate(order.createdAt)}
            </span>
            <span className="text-[11px] text-[#B5A48A]">
              {order.itemCount} stuks
            </span>
            {order.totalCents !== null && (
              <span className="text-[11px] font-semibold text-[#2C2416]">
                {formatCents(order.totalCents)}
              </span>
            )}
            {order.totalCents === null && (
              <span className="text-[11px] italic text-[#C4B8A0]">
                Offerte in behandeling
              </span>
            )}
          </div>
        </div>

        {/* Right — CTA */}
        <div className="flex-shrink-0 flex items-center">
          <Link
            href={`/account/bestellingen/${order.id}`}
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

      {/* Progress bar for active orders */}
      {(order.status === 'in_productie' || order.status === 'bevestigd') && (
        <div className="h-0.5 bg-neutral-100 mx-5 mb-4 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#E7C46A] to-[#C4A040] rounded-full transition-all duration-500"
            style={{ width: order.status === 'in_productie' ? '65%' : '30%' }}
            aria-hidden
          />
        </div>
      )}
    </article>
  )
}
