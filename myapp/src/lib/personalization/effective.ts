/**
 * Server-safe utilities for computing the final (effective) personalization
 * that should be rendered on a gadget — used by both the gadget picker page
 * and the PDF generators.
 *
 * No React, no browser APIs — safe to import in any server context.
 */

import {
  normalizeGadgetsPayload,
  getEffectivePersonalization,
} from '@/lib/gadget-personalization'
import type { GadgetPersonalization } from '@/lib/gadget-personalization'
import {
  parsePreviewConfig,
  DEFAULT_PREVIEW_CONFIG,
} from '@/lib/personalization/previewConfig'
import type { PreviewConfig } from '@/lib/personalization/previewConfig'

export {
  normalizeGadgetsPayload,
  getEffectivePersonalization,
  parsePreviewConfig,
  DEFAULT_PREVIEW_CONFIG,
}
export type { GadgetPersonalization, PreviewConfig }

// ─── GadgetPdfItem ────────────────────────────────────────────────────────────

/**
 * One gadget item as needed by the PDF generators.
 * All personalization is pre-merged (no global/override split needed downstream).
 */
export interface GadgetPdfItem {
  id:                  string
  name:                string
  priceCents:          number
  /** Absolute URL (http/https) or null when no image is available. */
  imageUrl:            string | null
  /** Already-merged text to display in the bounding-box overlay. */
  personalizationText: string | null
  /** Merged font / color / position choices. */
  personalization:     GadgetPersonalization
  /** Per-product bounding-box config. Undefined → DEFAULT_PREVIEW_CONFIG. */
  previewConfig:       PreviewConfig | undefined
}

// ─── Input shape for product data ─────────────────────────────────────────────

export interface GadgetProductData {
  basePriceCents:    number
  /** Absolute image URL. The caller is responsible for resolving relative paths. */
  imageUrl:          string | null
  previewConfigJson: unknown
}

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Merges `Design.gadgets` JSON (v1 or v2) with product data to produce a flat
 * list of items ready for PDF rendering.
 *
 * @param designGadgets  The raw `Design.gadgets` JSON value from the DB.
 * @param productMap     Map from productId → {@link GadgetProductData}.
 */
export function buildGadgetPdfItems(
  designGadgets: unknown,
  productMap:    Map<string, GadgetProductData>,
): GadgetPdfItem[] {
  const { items, global: globalP, overrides } = normalizeGadgetsPayload(designGadgets)

  return items.map((g) => {
    const product = productMap.get(g.id)
    const eff     = getEffectivePersonalization(g.id, globalP, overrides)

    return {
      id:                  g.id,
      name:                g.name,
      priceCents:          g.priceCents ?? product?.basePriceCents ?? 0,
      imageUrl:            product?.imageUrl ?? null,
      personalizationText: eff.name ?? g.personalizedText ?? null,
      personalization:     eff,
      previewConfig:       product?.previewConfigJson
                             ? parsePreviewConfig(product.previewConfigJson)
                             : undefined,
    }
  })
}
