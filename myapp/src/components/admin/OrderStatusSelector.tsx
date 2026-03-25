'use client'

/**
 * OrderStatusSelector — segmented status picker for the admin order detail page.
 *
 * Renders all ShopOrderStatus values as clickable pills.
 * Calls the server action immediately on click (optimistic UI via useTransition).
 * Follows the same pattern as OfferStatusSelector.
 */

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ALL_ORDER_STATUSES, getOrderStatusMeta } from '@/lib/shop/shop-status'
import type { ShopOrderStatus } from '@prisma/client'

interface Props {
  orderId:       string
  currentStatus: ShopOrderStatus
  updateAction:  (id: string, status: ShopOrderStatus) => Promise<void>
}

export default function OrderStatusSelector({ orderId, currentStatus, updateAction }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleChange(status: ShopOrderStatus) {
    if (status === currentStatus) return
    startTransition(async () => {
      await updateAction(orderId, status)
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Verwerkingsstatus
      </p>
      <div className="flex flex-col gap-1.5">
        {ALL_ORDER_STATUSES.map((s) => {
          const meta     = getOrderStatusMeta(s)
          const isActive = s === currentStatus

          return (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => handleChange(s)}
              className={[
                'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium',
                'text-left transition-all duration-150',
                isActive
                  ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50 text-indigo-900'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100',
                pending ? 'opacity-50 cursor-wait' : '',
              ].join(' ')}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dotColor}`} />
              {meta.label}
              {isActive && (
                <svg
                  className="ml-auto w-4 h-4 text-indigo-500 shrink-0"
                  fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
