/**
 * shop-status.ts
 *
 * Central source of truth for ShopOrderStatus and PaymentStatus labels + badge styling.
 * Import `getOrderStatusMeta` / `getPaymentStatusMeta` wherever a status badge is needed.
 *
 * Follows the same pattern as src/lib/offer-status.ts.
 */

import type { ShopOrderStatus, PaymentStatus } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StatusMeta {
  label:     string
  /** Full Tailwind className — render directly on a <span> */
  className: string
  /** Dot color for row indicators */
  dotColor:  string
}

// ─── Shared base ──────────────────────────────────────────────────────────────

const BASE = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium'

// ─── Payment status ───────────────────────────────────────────────────────────

const PAYMENT_MAP: Record<PaymentStatus, StatusMeta> = {
  PENDING:   { label: 'Wacht op betaling', dotColor: 'bg-gray-400',    className: `${BASE} bg-gray-100   text-gray-600    border-gray-200` },
  PAID:      { label: 'Betaald',           dotColor: 'bg-emerald-500', className: `${BASE} bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold` },
  FAILED:    { label: 'Mislukt',           dotColor: 'bg-red-500',     className: `${BASE} bg-red-50     text-red-600     border-red-200` },
  CANCELLED: { label: 'Geannuleerd',       dotColor: 'bg-red-400',     className: `${BASE} bg-red-50     text-red-600     border-red-200` },
  EXPIRED:   { label: 'Verlopen',          dotColor: 'bg-orange-400',  className: `${BASE} bg-orange-50  text-orange-700  border-orange-200` },
  REFUNDED:  { label: 'Terugbetaald',      dotColor: 'bg-purple-400',  className: `${BASE} bg-purple-50  text-purple-700  border-purple-200` },
}

// ─── Order (fulfillment) status ───────────────────────────────────────────────

const ORDER_MAP: Record<ShopOrderStatus, StatusMeta> = {
  PENDING:          { label: 'Nieuw',             dotColor: 'bg-gray-400',    className: `${BASE} bg-gray-100   text-gray-600    border-gray-200` },
  AWAITING_PAYMENT: { label: 'Wacht op betaling', dotColor: 'bg-yellow-400',  className: `${BASE} bg-yellow-50  text-yellow-700  border-yellow-200` },
  PAID:             { label: 'Betaald',            dotColor: 'bg-blue-400',    className: `${BASE} bg-blue-50    text-blue-700    border-blue-200` },
  IN_PROGRESS:      { label: 'In verwerking',      dotColor: 'bg-indigo-400',  className: `${BASE} bg-indigo-50  text-indigo-700  border-indigo-200` },
  SHIPPED:          { label: 'Verzonden',           dotColor: 'bg-cyan-500',    className: `${BASE} bg-cyan-50    text-cyan-700    border-cyan-200` },
  COMPLETED:        { label: 'Afgerond',            dotColor: 'bg-emerald-500', className: `${BASE} bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold` },
  CANCELLED:        { label: 'Geannuleerd',         dotColor: 'bg-red-400',     className: `${BASE} bg-red-50     text-red-600     border-red-200` },
}

// ─── Exported helpers ─────────────────────────────────────────────────────────

export function getPaymentStatusMeta(status: PaymentStatus): StatusMeta {
  return PAYMENT_MAP[status] ?? PAYMENT_MAP.PENDING
}

export function getOrderStatusMeta(status: ShopOrderStatus): StatusMeta {
  return ORDER_MAP[status] ?? ORDER_MAP.PENDING
}

/**
 * Ordered list of canonical ShopOrderStatus values for the status selector.
 */
export const ALL_ORDER_STATUSES: ShopOrderStatus[] = [
  'PENDING',
  'AWAITING_PAYMENT',
  'PAID',
  'IN_PROGRESS',
  'SHIPPED',
  'COMPLETED',
  'CANCELLED',
]
