/**
 * Analytics — Studio Twaalf
 *
 * Single source of truth for all dataLayer / GTM events.
 * Uses sendGTMEvent (@next/third-parties/google) — a thin wrapper around
 * window.dataLayer.push() that is safe on the server (no-op).
 *
 * Architecture:
 *   Code → dataLayer.push(event) → GTM → GA4
 *
 * Two categories:
 *   1. GA4 Ecommerce — structured items[] for webshop funnel analysis
 *   2. Custom funnel events — DIY tool, quote, account, engagement
 *
 * Usage:
 *   import { trackEvent, trackEcommerce, toEcommerceItem } from '@/lib/analytics'
 *
 *   // Custom event (DIY funnel)
 *   trackEvent({ event: 'select_template', flow_step: 'templates', ... })
 *
 *   // Ecommerce event (clears previous data automatically)
 *   trackEcommerce({
 *     event: 'add_to_cart',
 *     currency: 'EUR',
 *     value: 12.50,
 *     items: [toEcommerceItem({ id: 'p1', name: 'Hoog doosje', priceCents: 1250, quantity: 1 })],
 *   })
 */

import { sendGTMEvent } from '@next/third-parties/google'

// ─────────────────────────────────────────────────────────────────────────────
// GA4 Ecommerce item structure
// https://developers.google.com/analytics/devguides/collection/ga4/reference/events
// ─────────────────────────────────────────────────────────────────────────────

export type EcommerceItem = {
  item_id:        string
  item_name:      string
  item_category?: string
  item_variant?:  string
  /** Price in EUR (not cents) */
  price:          number
  quantity?:      number
  /** List position — used for view_item_list / select_item */
  index?:         number
}

/** Convert app product data to a GA4 EcommerceItem (cents → EUR). */
export function toEcommerceItem(opts: {
  id:         string
  name:       string
  category?:  string | null
  variant?:   string | null
  priceCents: number
  quantity?:  number
  index?:     number
}): EcommerceItem {
  return {
    item_id:                          opts.id,
    item_name:                        opts.name,
    ...(opts.category ? { item_category: opts.category } : {}),
    ...(opts.variant  ? { item_variant:  opts.variant  } : {}),
    price:                            opts.priceCents / 100,
    ...(opts.quantity !== undefined ? { quantity: opts.quantity } : {}),
    ...(opts.index    !== undefined ? { index:    opts.index    } : {}),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GA4 Ecommerce event types
// ─────────────────────────────────────────────────────────────────────────────

type EcommerceBase = { currency: 'EUR'; value: number; items: EcommerceItem[] }

export type ViewItemListEvent   = { event: 'view_item_list'; item_list_id: string; item_list_name: string } & Omit<EcommerceBase, 'value'>
export type SelectItemEvent     = { event: 'select_item';   item_list_id: string; item_list_name: string } & Omit<EcommerceBase, 'value'>
export type ViewItemEvent       = { event: 'view_item' }           & EcommerceBase
export type AddToCartEvent      = { event: 'add_to_cart' }         & EcommerceBase
export type RemoveFromCartEvent = { event: 'remove_from_cart' }    & EcommerceBase
export type ViewCartEvent       = { event: 'view_cart' }           & EcommerceBase
export type BeginCheckoutEvent  = { event: 'begin_checkout' }      & EcommerceBase
export type AddShippingInfoEvent = {
  event: 'add_shipping_info'
  shipping_tier: string     // e.g. "standard_be"
} & EcommerceBase
export type AddPaymentInfoEvent = {
  event: 'add_payment_info'
  payment_type: string      // e.g. "mollie"
} & EcommerceBase
export type PurchaseEvent = {
  event:          'purchase'
  transaction_id: string    // order number e.g. "ST-2026-0001"
  shipping?:      number
  tax?:           number
} & EcommerceBase

export type EcommerceEvent =
  | ViewItemListEvent | SelectItemEvent | ViewItemEvent
  | AddToCartEvent | RemoveFromCartEvent | ViewCartEvent
  | BeginCheckoutEvent | AddShippingInfoEvent | AddPaymentInfoEvent
  | PurchaseEvent

// ─────────────────────────────────────────────────────────────────────────────
// Shared base params — required on every DIY configurator funnel event
// ─────────────────────────────────────────────────────────────────────────────

export type BaseParams = {
  /** Which configurator step the event occurred in. */
  flow_step: 'templates' | 'editor' | 'gadgets' | 'concept' | 'quote'
  /** Active design session ID (from URL / DB). Required for all funnel events. */
  session_design_id: string
  /** Template chosen for this session. Required — every funnel event has a template. */
  template_id: string
  /** Nature of the design journey. Required — drives segmentation in GTM. */
  journey_type: 'birth' | 'wedding' | 'baptism' | 'gift' | 'total_concept'
  /** Human-readable template name (optional — available from the template object). */
  template_name?: string
  /** Design concept DB id. Available from the concept/quote stages onward. */
  concept_id?: string
}

type FunnelEvent<E extends string, Extra extends object = object> =
  { event: E } & BaseParams & Extra

// ─────────────────────────────────────────────────────────────────────────────
// Non-funnel events
// ─────────────────────────────────────────────────────────────────────────────

export type PageViewEvent = {
  event:      'page_view'
  page_path:  string
  /** Route-derived classification — helps segment in GTM/GA4 */
  page_type?: string
}

type StartDesignEvent = {
  event:          'start_design'
  template_id:    string
  template_name?: string
}

type RequestQuoteEvent = {
  event:          'request_quote'
  template_id:    string
  product_count?: number
}

type ContactSubmitEvent = {
  event:    'contact_submit'
  subject?: string
}

type DownloadPdfEvent = {
  event:       'download_pdf'
  pdf_type:    'quote' | 'gadgets'
  template_id: string
}

// GA4 standard account events — no PII
type SignUpEvent = { event: 'sign_up'; method: 'email' }
type LoginEvent  = { event: 'login';  method: 'email' }

// ─────────────────────────────────────────────────────────────────────────────
// DIY configurator funnel events
// ─────────────────────────────────────────────────────────────────────────────

/**
 * User arrives on the /templates page — top of the DIY funnel.
 * Fires once per page load, guarded by useRef in TemplatesPageClient.
 * entry_point is derived from document.referrer so GTM can segment
 * users coming from homepage vs webshop vs direct / organic.
 */
type DiyStartedEvent = {
  event:       'diy_started'
  /** Origin of this DIY session. */
  entry_point: 'homepage' | 'webshop' | 'direct' | 'other'
}

/**
 * User completes a step and navigates to the next one.
 * Fires at the handoff moment (just before the router.push / link click).
 * Provides clean funnel data: step completion rates + drop-off points.
 *
 * Steps in order:
 *   template        — template selected, entering the editor
 *   personalization — editor done, moving to gadgets
 *   gadgets         — gadgets confirmed, moving to concept preview
 *   preview         — concept reviewed, clicking through to the quote form
 */
type DiyStepCompletedEvent = FunnelEvent<'diy_step_completed', {
  step: 'template' | 'personalization' | 'gadgets' | 'preview'
}>

/** User picks a template from the gallery. */
type SelectTemplateEvent = FunnelEvent<'select_template'>

/** User adds a gadget (doopsuiker item, accessory, etc.) to their concept. */
type AddGadgetEvent = FunnelEvent<'add_gadget', {
  gadget_id:       string
  gadget_category: string
}>

/** User removes a gadget from their concept. */
type RemoveGadgetEvent = FunnelEvent<'remove_gadget', {
  gadget_id: string
}>

/** User lands on the concept overview page. */
type ViewConceptEvent = FunnelEvent<'view_concept', {
  concept_item_count: number
}>

/** User clicks the main CTA to proceed to the quote. */
type StartQuoteEvent = FunnelEvent<'start_quote', {
  concept_item_count: number
  /** Whether the concept includes any gadgets (doopsuiker etc.) */
  has_gadgets: boolean
}>

/**
 * User has arrived on the offerte form page.
 * Distinct from start_quote (which fires on the concept page on click intent).
 * The gap between start_quote and quote_request_started exposes drop-off
 * between clicking the CTA and the offerte page actually loading.
 */
type QuoteRequestStartedEvent = {
  event:             'quote_request_started'
  session_design_id: string
  template_id:       string
  journey_type:      BaseParams['journey_type']
  has_gadgets:       boolean
}

/** User successfully submits / downloads the quote. */
type SubmitQuoteEvent = FunnelEvent<'submit_quote', {
  concept_item_count:    number
  quote_value_estimate?: number
}>

// ─────────────────────────────────────────────────────────────────────────────
// Full GTMEvent union
// ─────────────────────────────────────────────────────────────────────────────

export type GTMEvent =
  // Infrastructure
  | PageViewEvent
  // Ecommerce (GA4 enhanced ecommerce — always use trackEcommerce())
  | EcommerceEvent
  // Acquisition
  | StartDesignEvent
  | DiyStartedEvent
  // DIY configurator funnel
  | DiyStepCompletedEvent
  | SelectTemplateEvent
  | AddGadgetEvent
  | RemoveGadgetEvent
  | ViewConceptEvent
  | StartQuoteEvent
  | QuoteRequestStartedEvent
  | SubmitQuoteEvent
  // Conversion
  | RequestQuoteEvent
  // Account (GA4 standard)
  | SignUpEvent
  | LoginEvent
  // Engagement
  | ContactSubmitEvent
  | DownloadPdfEvent

// ─────────────────────────────────────────────────────────────────────────────
// Core tracking functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Push a typed custom event to the GTM dataLayer.
 * For GA4 ecommerce events, use trackEcommerce() instead.
 */
export function trackEvent(payload: GTMEvent): void {
  sendGTMEvent(payload)
}

/**
 * Push a GA4 ecommerce event to the dataLayer.
 *
 * Automatically clears the previous ecommerce object before each push —
 * this is the GA4 / GTM best practice and prevents stale item data from
 * leaking between events.
 */
export function trackEcommerce(payload: EcommerceEvent): void {
  // GA4 best practice: clear previous ecommerce data before pushing a new event
  sendGTMEvent({ ecommerce: null } as unknown as GTMEvent)
  // GA4 via GTM requires all ecommerce fields nested under the 'ecommerce' key.
  // Flat payloads (fields at root level alongside 'event') are NOT picked up by
  // the standard GA4 ecommerce trigger in GTM.
  const { event, ...ecommerceData } = payload
  sendGTMEvent({ event, ecommerce: ecommerceData } as unknown as GTMEvent)
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map a free-form Template.category string to a typed journey_type.
 *
 * Explicit mappings (Dutch and English) are checked first.
 * If the category is non-empty but unrecognised, a warning is emitted in
 * development so the mapping can be extended.
 * Only null / undefined / empty string falls back to 'birth' without warning.
 */
export function deriveJourneyType(category: string | null | undefined): BaseParams['journey_type'] {
  const c = (category ?? '').toLowerCase().trim()

  if (c.includes('huwelijk') || c.includes('wedding'))  return 'wedding'
  if (c.includes('doopsel')  || c.includes('bapti'))    return 'baptism'
  if (c.includes('cadeau')   || c.includes('gift'))     return 'gift'
  if (c.includes('concept'))                             return 'total_concept'
  if (c.includes('geboorte') || c.includes('birth'))    return 'birth'

  if (c.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn(
      `[analytics] deriveJourneyType: unrecognised category "${category}". ` +
      `Add a mapping in analytics.ts. Falling back to 'birth'.`,
    )
  }

  return 'birth'
}

/**
 * Classify a URL pathname to a page_type string for GTM/GA4 segmentation.
 * Returns null for admin routes — callers should skip tracking admin activity.
 */
export function derivePageType(pathname: string): string | null {
  if (pathname.startsWith('/admin'))                                    return null  // exclude admin

  if (pathname === '/')                                                  return 'home'
  if (pathname.startsWith('/webshop/'))                                  return 'product'
  if (pathname.startsWith('/webshop'))                                   return 'product_list'
  if (pathname.startsWith('/winkelwagen'))                               return 'cart'
  if (pathname.startsWith('/bestellen/bevestiging'))                     return 'purchase_confirmation'
  if (pathname.startsWith('/bestellen'))                                 return 'checkout'
  if (pathname.startsWith('/design/') && pathname.includes('/gadgets'))  return 'diy_gadgets'
  if (pathname.startsWith('/design/') && pathname.includes('/concept'))  return 'diy_concept'
  if (pathname.startsWith('/design/') && pathname.includes('/offerte'))  return 'diy_quote'
  if (pathname.startsWith('/design/'))                                   return 'diy_editor'
  if (pathname.startsWith('/templates'))                                 return 'template_list'
  if (pathname.startsWith('/account/bestellingen'))                      return 'account_orders'
  if (pathname.startsWith('/account/projecten'))                         return 'account_projects'
  if (pathname.startsWith('/account'))                                   return 'account'
  if (pathname.startsWith('/register'))                                  return 'register'
  if (pathname.startsWith('/login'))                                     return 'login'
  if (pathname.startsWith('/contact'))                                   return 'contact'

  return 'other'
}
