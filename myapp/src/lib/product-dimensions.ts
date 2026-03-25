/**
 * Product physical dimensions — stored in Product.configJson as { dimensions: ProductDimensions }.
 *
 * Imported by server components, API routes, and client components — NO React here.
 *
 * Used by the mockup composition engine to scale gadgets proportionally against
 * the card format (artboard.widthMm / heightMm).  When no dimensions are stored,
 * the engine falls back to a visual heuristic.
 *
 * Stored shape (inside Product.configJson):
 *   {
 *     quantity?:   QuantityConfig,    ← existing key, untouched
 *     dimensions?: ProductDimensions, ← this module
 *   }
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductDimensions {
  /** Dominant visual width in millimetres (e.g. label width, box front face). */
  widthMm:      number
  /** Dominant visual height in millimetres. */
  heightMm:     number
  /**
   * Depth / thickness in mm — mainly relevant for 3-D products (boxes, jars).
   * Exposed to future mockup renderers that may want to infer volume or cast a
   * perspective shadow.  Currently stored but not used for scaling.
   */
  depthMm?:     number
  /**
   * Optional visual-scale multiplier on top of the dimension-based calculation.
   * Defaults to 1.0.  Range 0.3–3.0.
   *
   * Use cases:
   *   < 1.0  — product looks small in real life and needs to appear even smaller
   *            relative to the card (e.g. a tiny charm or sticker)
   *   > 1.0  — product is visually dominant and should be shown larger than its
   *            raw mm ratio would suggest (e.g. a standout luxury box)
   */
  mockupScale?: number
  /**
   * Uniform transparent-padding fraction applied to ALL four sides.
   * Range 0.0–0.45.  Acts as the default for any per-side field not set.
   *
   * Many product photos have large transparent margins so the visible object
   * appears smaller than its container.  This multiplier compensates: the engine
   * inflates the CSS maxWidth/maxHeight so the visible product area matches
   * the expected physical size.
   *
   * Example: visualPadding = 0.12 →
   *   compW = compH = 1 / (1 - 0.12 - 0.12) ≈ 1.316×
   *
   * Use per-side fields below for asymmetric padding (e.g. product centred
   * high in the frame, or extra left-padding for angled product shots).
   */
  visualPadding?: number
  /**
   * Per-side transparent-padding fractions.  Each value overrides `visualPadding`
   * for that specific side.  Range 0.0–0.45 per side.
   *
   * The engine applies width-axis compensation from (left + right) and
   * height-axis compensation from (top + bottom) independently, so asymmetric
   * PNG crops are handled correctly.
   */
  visualPaddingTop?:    number
  visualPaddingRight?:  number
  visualPaddingBottom?: number
  visualPaddingLeft?:   number
}

// ─── Parse ────────────────────────────────────────────────────────────────────

/**
 * Safely extracts ProductDimensions from a raw configJson value (Prisma Json).
 * Returns null when no dimensions are stored or the shape is invalid.
 *
 * Expects:  configJson = { ..., dimensions: { widthMm, heightMm, depthMm?, mockupScale? } }
 */
export function parseProductDimensions(configJson: unknown): ProductDimensions | null {
  if (!configJson || typeof configJson !== 'object' || Array.isArray(configJson)) return null

  const root = configJson as Record<string, unknown>
  const d    = root.dimensions
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null

  const dc = d as Record<string, unknown>

  const widthMm  = typeof dc.widthMm  === 'number' && dc.widthMm  > 0 ? dc.widthMm  : null
  const heightMm = typeof dc.heightMm === 'number' && dc.heightMm > 0 ? dc.heightMm : null

  // Both width and height are required for the dimensions to be useful
  if (widthMm === null || heightMm === null) return null

  const depthMm = typeof dc.depthMm === 'number' && dc.depthMm >= 0
    ? Math.round(dc.depthMm * 10) / 10
    : undefined

  const rawScale    = typeof dc.mockupScale === 'number' ? dc.mockupScale : 1.0
  const mockupScale = Math.max(0.3, Math.min(3.0, rawScale))

  function parsePad(key: string): number | undefined {
    const v = typeof dc[key] === 'number' ? (dc[key] as number) : undefined
    if (v === undefined) return undefined
    const clamped = Math.max(0, Math.min(0.45, v))
    return clamped > 0 ? clamped : undefined
  }

  const visualPadding       = parsePad('visualPadding')
  const visualPaddingTop    = parsePad('visualPaddingTop')
  const visualPaddingRight  = parsePad('visualPaddingRight')
  const visualPaddingBottom = parsePad('visualPaddingBottom')
  const visualPaddingLeft   = parsePad('visualPaddingLeft')

  return {
    widthMm:  Math.round(widthMm  * 10) / 10,
    heightMm: Math.round(heightMm * 10) / 10,
    ...(depthMm             !== undefined ? { depthMm }             : {}),
    ...(mockupScale         !== 1.0       ? { mockupScale }         : {}),
    ...(visualPadding       !== undefined ? { visualPadding }       : {}),
    ...(visualPaddingTop    !== undefined ? { visualPaddingTop }    : {}),
    ...(visualPaddingRight  !== undefined ? { visualPaddingRight }  : {}),
    ...(visualPaddingBottom !== undefined ? { visualPaddingBottom } : {}),
    ...(visualPaddingLeft   !== undefined ? { visualPaddingLeft }   : {}),
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Result of gadgetVirtualSize — both axes returned so GadgetObject can clamp
 * the image with the correct max-width AND max-height instead of a single value.
 */
export interface GadgetVirtualDims {
  /** Target max-width for the product image in virtual canvas px. */
  maxWidth:  number
  /** Target max-height for the product image in virtual canvas px. */
  maxHeight: number
  /**
   * The "dominant" size — the larger of the two clamped dimensions.
   * Used by buildPlacements() to allocate space in the composition.
   */
  dominant:  number
}

/**
 * Converts a gadget's physical ProductDimensions to virtual-canvas pixel sizes
 * that keep the product proportionally correct relative to the card.
 *
 * Algorithm — three independent steps
 * ─────────────────────────────────────
 *
 * Step 1 — Natural visible size
 *   How large should the VISIBLE product area be, in virtual canvas pixels?
 *   Derived from the physical mm ratio relative to the artboard:
 *
 *     visW = (widthMm  / artboardWidthMm)  × cardVW × mockupScale
 *     visH = (heightMm / artboardHeightMm) × cardVH × mockupScale
 *
 * Step 2 — Clamp on dominant visible axis
 *   Portrait  (visH ≥ visW): clamp visH to [minPx, maxPx]; derive visW from aspect.
 *   Landscape (visW > visH): clamp visW to [minPx, maxPx]; derive visH from aspect.
 *
 *   This keeps clamping in the "visible product" space, not the image container
 *   space, so minPx/maxPx always describes how large the product LOOKS.
 *
 * Step 3 — Inflate for transparent padding
 *   The PNG image may have transparent margins around the product.
 *   To render the visible product at the target visible size, we must make the
 *   CSS max-width/max-height larger:
 *
 *     maxWidth  = clampedVisW / (1 - padLeft - padRight)
 *     maxHeight = clampedVisH / (1 - padTop  - padBottom)
 *
 *   Per-side values (visualPaddingTop/Right/Bottom/Left) take precedence over
 *   the uniform `visualPadding` fallback.  Per-axis compensation is independent,
 *   so asymmetric crops (product sitting high in frame, angled shots, etc.) are
 *   handled correctly.
 *
 * @param dims              Gadget's stored physical dimensions
 * @param artboardWidthMm   Card artboard width in mm
 * @param artboardHeightMm  Card artboard height in mm
 * @param cardVW            Card rendered width in virtual canvas px
 * @param cardVH            Card rendered height in virtual canvas px
 * @param minPx             Minimum visible dominant size (default 70).
 *                          Callers should prefer a card-relative value such as
 *                          `Math.max(32, Math.round(cardVH * 0.12))` so the
 *                          limit scales with the card rather than being an
 *                          absolute pixel cap that shrinks tall products.
 * @param maxPx             Maximum visible dominant size (default 240).
 *                          Callers should prefer a card-relative value such as
 *                          `Math.round(cardVH * 1.35)` — this allows a product
 *                          that is physically taller than the card to render
 *                          proportionally larger, as it would in a real flat-lay.
 */
export function gadgetVirtualSize(
  dims:               ProductDimensions,
  artboardWidthMm:    number,
  artboardHeightMm:   number,
  cardVW:             number,
  cardVH:             number,
  minPx = 32,
  maxPx = 600,
): GadgetVirtualDims {
  // ── Per-side padding resolution ─────────────────────────────────────────────
  // Per-side values take precedence; fall back to uniform visualPadding.
  // Each side is independently clamped to [0, 0.45].
  const unif = Math.max(0, Math.min(0.45, dims.visualPadding ?? 0))
  function padSide(v: number | undefined): number {
    return v !== undefined ? Math.max(0, Math.min(0.45, v)) : unif
  }
  const padTop    = padSide(dims.visualPaddingTop)
  const padRight  = padSide(dims.visualPaddingRight)
  const padBottom = padSide(dims.visualPaddingBottom)
  const padLeft   = padSide(dims.visualPaddingLeft)

  // Per-axis compensation factors.  Guard against degenerate values (sum ≥ 1).
  const compW = 1 / Math.max(0.1, 1 - padLeft - padRight)
  const compH = 1 / Math.max(0.1, 1 - padTop  - padBottom)

  // ── Step 1: natural visible size from physical mm ratio × scale ─────────────
  const scale  = dims.mockupScale ?? 1.0
  const aspect = dims.widthMm / dims.heightMm   // < 1 portrait, > 1 landscape
  const visW   = (dims.widthMm  / artboardWidthMm)  * cardVW * scale
  const visH   = (dims.heightMm / artboardHeightMm) * cardVH * scale

  // ── Step 2: clamp on dominant VISIBLE axis ───────────────────────────────────
  let clampedVisW: number
  let clampedVisH: number

  if (visH >= visW) {
    // Portrait / tall product — height is dominant
    clampedVisH = Math.max(minPx, Math.min(maxPx, Math.round(visH)))
    clampedVisW = Math.round(clampedVisH * aspect)
  } else {
    // Landscape / wide product — width is dominant
    clampedVisW = Math.max(minPx, Math.min(maxPx, Math.round(visW)))
    clampedVisH = Math.round(clampedVisW / aspect)
  }

  // ── Step 3: inflate by per-axis padding compensation ────────────────────────
  // maxWidth/maxHeight are the CSS constraints on the <img> element.
  // The browser fits the image within this box (preserving natural aspect ratio);
  // the transparent margins reduce the visible product to the clamped target.
  const maxWidth  = Math.round(clampedVisW * compW)
  const maxHeight = Math.round(clampedVisH * compH)
  const dominant  = Math.max(maxWidth, maxHeight)

  return { maxWidth, maxHeight, dominant }
}
