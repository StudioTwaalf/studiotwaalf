/**
 * offer-status.ts
 *
 * Central source of truth for OfferRequestStatus labels + badge styling.
 * Import `getOfferStatusMeta` wherever a status label or badge is needed.
 *
 * Usage:
 *   const meta = getOfferStatusMeta(r.status)
 *   <span className={meta.className}>{meta.label}</span>
 */

import type { OfferRequestStatus } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OfferStatusMeta {
  label:     string
  /** Full Tailwind className — render directly on a <span> */
  className: string
  /** Dot color for table row indicators */
  dotColor:  string
}

// ─── Shared base ─────────────────────────────────────────────────────────────

const BASE = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium'

// ─── Map ──────────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<OfferRequestStatus, OfferStatusMeta> = {
  // ── Active statuses (preferred) ────────────────────────────────────────────
  OFFER_REQUESTED: {
    label:     'Offerte aangevraagd',
    dotColor:  'bg-slate-400',
    className: `${BASE} bg-slate-100 text-slate-700 border-slate-200`,
  },
  SAMPLES_REQUESTED: {
    label:     'Samples aangevraagd',
    dotColor:  'bg-purple-400',
    className: `${BASE} bg-purple-50 text-purple-700 border-purple-200`,
  },
  APPOINTMENT_MADE: {
    label:     'Afspraak gemaakt',
    dotColor:  'bg-amber-400',
    className: `${BASE} bg-amber-50 text-amber-700 border-amber-200`,
  },
  SAMPLES_SENT: {
    label:     'Samples verzonden',
    dotColor:  'bg-teal-400',
    className: `${BASE} bg-teal-50 text-teal-700 border-teal-200`,
  },
  CONFIRMED: {
    label:     'Bevestigd',
    dotColor:  'bg-emerald-500',
    className: `${BASE} bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold`,
  },
  REJECTED: {
    label:     'Afgekeurd',
    dotColor:  'bg-red-400',
    className: `${BASE} bg-red-50 text-red-600 border-red-200`,
  },

  // ── Legacy statuses — kept for backward compatibility ─────────────────────
  TO_CONTACT: {
    label:     'Offerte aangevraagd',
    dotColor:  'bg-slate-400',
    className: `${BASE} bg-slate-100 text-slate-700 border-slate-200`,
  },
  APPOINTMENT_SET: {
    label:     'Afspraak gemaakt',
    dotColor:  'bg-amber-400',
    className: `${BASE} bg-amber-50 text-amber-700 border-amber-200`,
  },
}

// ─── Exported helpers ─────────────────────────────────────────────────────────

export function getOfferStatusMeta(status: OfferRequestStatus): OfferStatusMeta {
  return STATUS_MAP[status] ?? STATUS_MAP.OFFER_REQUESTED
}

/**
 * Ordered list of the 6 canonical statuses shown in the admin UI.
 * Legacy values (TO_CONTACT, APPOINTMENT_SET) are intentionally excluded here
 * — they still display correctly via getOfferStatusMeta but aren't selectable
 * as targets when an admin changes status.
 */
export const ALL_OFFER_STATUSES: OfferRequestStatus[] = [
  'OFFER_REQUESTED',
  'SAMPLES_REQUESTED',
  'APPOINTMENT_MADE',
  'SAMPLES_SENT',
  'CONFIRMED',
  'REJECTED',
]
