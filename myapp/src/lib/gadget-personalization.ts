/**
 * Shared types, utilities and constants for gadget personalization.
 * Imported by components, server pages and API routes — NO React imports here.
 *
 * Test checklist:
 *   [ ] getEffectivePersonalization: override fields replace global ones
 *   [ ] getEffectivePersonalization: undefined override field falls back to global
 *   [ ] getEffectivePersonalization: no override entry → returns global unchanged
 *   [ ] isOverrideActive: true if productId key exists in overrides with ≥1 field
 *   [ ] isOverrideActive: false if key absent
 *   [ ] normalizeGadgetsPayload: v1 plain array → items extracted, first name → global.name
 *   [ ] normalizeGadgetsPayload: v2 object → items/global/overrides extracted
 *   [ ] normalizeGadgetsPayload: null/undefined/garbage → empty payload, no crash
 */

import type { PreviewConfig } from '@/lib/personalization/previewConfig'
export type { PreviewConfig }

import type { QuantityConfig } from '@/lib/quantity-config'
export type { QuantityConfig }

import type { ProductDimensions } from '@/lib/product-dimensions'
export type { ProductDimensions }

// ─── Primitive types ──────────────────────────────────────────────────────────

export type GadgetFont     = 'inter' | 'playfair' | 'poppins'
export type GadgetColor    = 'black' | 'darkgray' | 'white'
export type GadgetPosition = 'top' | 'middle' | 'bottom'

/** Extensible per-gadget personalization. Add fields here; no schema change needed. */
export type GadgetPersonalization = {
  name?:     string
  font?:     GadgetFont
  color?:    GadgetColor
  /** @deprecated Use textPos instead. Kept for backwards compat with v1 saves. */
  position?: GadgetPosition
  /**
   * Drag-to-position center point (Step 5).
   * xPct / yPct are 0–100 relative to the allowed bounds rectangle
   * (previewConfig.text.box, or the full container if no config).
   * When present, overrides the strip-based `position` field.
   */
  textPos?:   { xPct: number; yPct: number }
  /**
   * Font size in CSS pixels for the name overlay (Step 5 / font-size slider).
   * Rendered verbatim in the large modal preview; scaled proportionally in
   * card thumbnails and mini previews.  Defaults to 28 when absent.
   */
  fontSizePx?: number
}

// ─── Variant types ────────────────────────────────────────────────────────────

/** Slim variant shape sent to the client. */
export interface GadgetVariantOption {
  id:                string
  name:              string
  color?:            string | null
  sizeLabel?:        string | null
  /** null = inherit parent basePriceCents */
  priceCents?:       number | null
  thumbnailImageUrl?: string | null
  mockupImageUrl?:    string | null
  widthMm?:          number | null
  heightMm?:         number | null
  depthMm?:          number | null
  mockupScale?:      number | null
  visualPadding?:    number | null
  isDefault:         boolean
}

// ─── Gadget item types ────────────────────────────────────────────────────────
// Defined here (not in GadgetGrid) to avoid circular imports.

export interface GadgetItem {
  id:              string
  title:           string
  description:     string
  fromPriceCents?: number
  personalizable:  boolean
  /** emoji char OR image URL — rendered via ProductThumb */
  emoji?:          string
  /** Product category name (e.g. "Snoep", "Bedankjes") — used for filter tabs. */
  category?:       string
  /** Per-product bounding-box config for the name overlay (Step 3). Undefined = legacy strip. */
  previewConfig?:  PreviewConfig
  /** Quantity ordering rules from Product.configJson. Undefined = free mode (1–500). */
  quantityConfig?: QuantityConfig
  /** Physical dimensions from Product.configJson — used by the mockup engine for proportional scaling. */
  dimensions?:     ProductDimensions
  /** null = unlimited; 0 = out of stock (op bestelling); >0 = units in stock */
  stockQuantity?:  number | null
  /** Transparent PNG for the mockup engine. Falls back to `emoji` when absent. */
  mockupImageUrl?:    string | null
  /** Display image for cards, shop, lists. Falls back to `emoji` when absent. */
  thumbnailImageUrl?: string | null
  /** Variants for this gadget. undefined = no variants (legacy behaviour). */
  variants?: GadgetVariantOption[]
}

export type SelectedGadget = {
  id:               string
  name:             string
  isPersonalizable: boolean
  priceCents?:      number
  /** Quantity ordered. Defaults to 1 when absent (backwards compat). */
  quantity?:        number
  /** @deprecated prefer personalization.name — kept for backwards compat with old saves */
  personalizedText?: string
  /** Effective (or per-item) personalization stored after merge */
  personalization?:  GadgetPersonalization
  emoji?:            string
  /** Persisted variant choice (GadgetVariant.id). */
  variantId?:        string
  /** Display snapshot of the chosen variant (for offer/PDF labels). */
  variantLabel?:     string
  /** Bounding-box config from the product's PersonalizationTemplate (injected server-side) */
  previewConfig?:    PreviewConfig
  /**
   * Physical dimensions injected server-side at the concept page.
   * Not persisted in Design.gadgets — always re-fetched from the Product.configJson.
   * Used by MockupComposition for proportional scaling.
   */
  dimensions?:       ProductDimensions
}

// ─── Gadgets payload stored in Design.gadgets JSON ───────────────────────────
// v1 (legacy): plain SelectedGadget[]  — normalizeGadgetsPayload converts on read
// v2 (current): { items, global, overrides }

export interface GadgetsPayload {
  items:     SelectedGadget[]
  global:    GadgetPersonalization
  overrides: Record<string, GadgetPersonalization>
}

// ─── Normalisation ────────────────────────────────────────────────────────────

function isPlainObj(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

/**
 * Accepts both v1 (plain array) and v2 (object) shapes from the DB.
 * Safe to call with any value — always returns a valid GadgetsPayload.
 */
export function normalizeGadgetsPayload(raw: unknown): GadgetsPayload {
  // v1: flat SelectedGadget array
  if (Array.isArray(raw)) {
    const items = raw as SelectedGadget[]
    const firstName = items[0]?.personalization?.name ?? items[0]?.personalizedText
    return {
      items,
      global:    firstName ? { name: firstName } : {},
      overrides: {},
    }
  }
  // v2: { items, global, overrides }
  if (isPlainObj(raw)) {
    return {
      items:     Array.isArray(raw.items) ? (raw.items as SelectedGadget[]) : [],
      global:    isPlainObj(raw.global)   ? (raw.global   as GadgetPersonalization)              : {},
      overrides: isPlainObj(raw.overrides)? (raw.overrides as Record<string, GadgetPersonalization>) : {},
    }
  }
  return { items: [], global: {}, overrides: {} }
}

// ─── Merge utilities ──────────────────────────────────────────────────────────

/**
 * Returns the merged personalization for a product:
 * override fields take precedence; missing override fields fall back to global.
 */
export function getEffectivePersonalization(
  productId: string,
  global:    GadgetPersonalization,
  overrides: Record<string, GadgetPersonalization>,
): GadgetPersonalization {
  const ov = overrides[productId]
  if (!ov) return global
  return {
    name:       ov.name       !== undefined ? ov.name       : global.name,
    font:       ov.font       !== undefined ? ov.font       : global.font,
    color:      ov.color      !== undefined ? ov.color      : global.color,
    position:   ov.position   !== undefined ? ov.position   : global.position,
    textPos:    ov.textPos    !== undefined ? ov.textPos    : global.textPos,
    fontSizePx: ov.fontSizePx !== undefined ? ov.fontSizePx : global.fontSizePx,
  }
}

/**
 * Returns true when a non-empty per-product override exists.
 * Used to show the "Gepersonaliseerd" badge on cards.
 */
export function isOverrideActive(
  productId: string,
  overrides: Record<string, GadgetPersonalization>,
): boolean {
  const ov = overrides[productId]
  return ov !== undefined && Object.keys(ov).length > 0
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_PERSONALIZATION: GadgetPersonalization = {
  font:     'inter',
  color:    'black',
  position: 'bottom',
}

export const FONT_OPTIONS: Array<{
  value: GadgetFont
  label: string
  fontFamily: string
}> = [
  { value: 'inter',    label: 'Inter',    fontFamily: 'Inter, system-ui, sans-serif' },
  { value: 'playfair', label: 'Playfair', fontFamily: '"Playfair Display", Georgia, serif' },
  { value: 'poppins',  label: 'Poppins',  fontFamily: 'Poppins, system-ui, sans-serif' },
]

export const COLOR_OPTIONS: Array<{
  value:  GadgetColor
  label:  string
  swatch: string        // Tailwind classes for the color picker button
  style:  Record<string, string>  // inline CSS for the rendered text
}> = [
  {
    value:  'black',
    label:  'Zwart',
    swatch: 'bg-gray-900 border-gray-900',
    style:  { color: '#111' },
  },
  {
    value:  'darkgray',
    label:  'Donkergrijs',
    swatch: 'bg-gray-500 border-gray-500',
    style:  { color: '#555' },
  },
  {
    value:  'white',
    label:  'Wit',
    swatch: 'bg-white border-gray-300',
    // White text: add shadow so it reads on any background
    style:  {
      color:      '#fff',
      textShadow: '0 0 4px rgba(0,0,0,0.65), 0 1px 2px rgba(0,0,0,0.45)',
    },
  },
]

export const POSITION_OPTIONS: Array<{
  value: GadgetPosition
  label: string
}> = [
  { value: 'top',    label: 'Boven'  },
  { value: 'middle', label: 'Midden' },
  { value: 'bottom', label: 'Onder'  },
]

// ─── Style helpers (return plain objects — no React dependency) ───────────────

/** Returns inline-style object for the name text in a given personalization. */
export function getNameTextStyle(p: GadgetPersonalization): Record<string, string> {
  const font  = p.font  ?? DEFAULT_PERSONALIZATION.font!
  const color = p.color ?? DEFAULT_PERSONALIZATION.color!
  const fontOpt  = FONT_OPTIONS.find(f => f.value === font)
  const colorOpt = COLOR_OPTIONS.find(c => c.value === color)
  return {
    fontFamily: fontOpt?.fontFamily ?? 'system-ui, sans-serif',
    ...colorOpt?.style,
  }
}

/**
 * Returns the absolute-position Tailwind classes for the overlay strip.
 * The caller is responsible for applying `absolute` and any padding.
 */
export function getOverlayPositionClasses(p: GadgetPersonalization): string {
  const pos = p.position ?? DEFAULT_PERSONALIZATION.position!
  if (pos === 'top')    return 'top-0 inset-x-0'
  if (pos === 'middle') return 'top-1/2 -translate-y-1/2 inset-x-0'
  return 'bottom-0 inset-x-0' // default: bottom
}
