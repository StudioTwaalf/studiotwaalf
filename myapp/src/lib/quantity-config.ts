/**
 * Quantity configuration for gadget products.
 *
 * Stored in Product.configJson as { quantity: QuantityConfig }.
 * Imported by server components, API routes, and client components — NO React here.
 *
 * Three modes:
 *   free        — any integer in [min, max]
 *   recommended — must be one of the recommended list (or custom if allowCustom)
 *   pack        — must be a multiple of step within [min, max]
 *
 * Backward compat: products with no configJson → free mode, min 1, max 500.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuantityMode = 'free' | 'recommended' | 'pack'

export interface QuantityConfig {
  mode:         QuantityMode
  min:          number           // default 1
  max:          number           // default 500
  recommended?: number[]         // required for mode 'recommended'
  step?:        number           // required for mode 'pack'
  allowCustom?: boolean          // only for mode 'recommended'
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export function defaultQuantityConfig(): QuantityConfig {
  return { mode: 'free', min: 1, max: 500 }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the initial/default quantity for a product given its config.
 * - recommended → first recommended value
 * - pack        → min rounded up to nearest step (≥ min)
 * - free        → min
 */
export function getDefaultQuantity(cfg: QuantityConfig): number {
  if (cfg.mode === 'recommended' && cfg.recommended?.length) {
    return cfg.recommended[0]
  }
  if (cfg.mode === 'pack' && cfg.step) {
    const s = cfg.step
    return Math.max(cfg.min, Math.ceil(cfg.min / s) * s)
  }
  return cfg.min
}

/**
 * Normalizes `qty` to a valid value for the given config.
 * - recommended (no allowCustom): snaps to closest recommended value
 * - recommended (allowCustom):    clamps to [min, max]
 * - pack:                         rounds up to nearest step, clamps to [min, max]
 * - free:                         clamps to [min, max]
 * Always returns an integer.
 */
export function normalizeQuantity(qty: number, cfg: QuantityConfig): number {
  const q = Math.round(qty)
  if (cfg.mode === 'recommended' && cfg.recommended?.length) {
    if (!cfg.allowCustom) {
      // Snap to closest recommended value
      return cfg.recommended.reduce((prev, curr) =>
        Math.abs(curr - q) < Math.abs(prev - q) ? curr : prev,
      )
    }
    // allowCustom: just clamp
    return Math.max(cfg.min, Math.min(cfg.max, q))
  }
  if (cfg.mode === 'pack' && cfg.step) {
    const stepped = Math.ceil(q / cfg.step) * cfg.step
    return Math.max(cfg.min, Math.min(cfg.max, stepped))
  }
  // free
  return Math.max(cfg.min, Math.min(cfg.max, q))
}

/**
 * Returns true when `qty` is a valid (canonical) quantity for the given config
 * without any normalization being needed.
 * - free:        integer in [min, max]
 * - recommended: one of the recommended list (or in [min, max] if allowCustom)
 * - pack:        positive multiple of step within [min, max]
 */
export function isValidQuantity(qty: number, cfg: QuantityConfig): boolean {
  if (!Number.isInteger(qty) || qty < cfg.min || qty > cfg.max) return false
  if (cfg.mode === 'recommended') {
    if (!cfg.allowCustom && cfg.recommended?.length) {
      return cfg.recommended.includes(qty)
    }
    return true  // allowCustom → any value in [min, max] is valid
  }
  if (cfg.mode === 'pack' && cfg.step) {
    return qty % cfg.step === 0
  }
  return true  // free mode: already checked [min, max] above
}

/**
 * Returns a short Dutch hint string explaining why `qty` is invalid,
 * or null if `qty` is valid.
 */
export function getQuantityHint(qty: number, cfg: QuantityConfig): string | null {
  if (isValidQuantity(qty, cfg)) return null
  if (cfg.mode === 'pack' && cfg.step) {
    // Build a short list of valid quantities to show as examples
    const s = cfg.step
    const examples: number[] = []
    let q = s
    // Start from the first valid pack quantity >= min
    if (cfg.min > s) q = Math.ceil(cfg.min / s) * s
    while (q <= cfg.max && examples.length < 5) { examples.push(q); q += s }
    const hasMore = examples.length === 5 && examples[4] + s <= cfg.max
    return `Alleen per ${s} stuks: ${examples.join(', ')}${hasMore ? ' …' : ''}.`
  }
  if (cfg.mode === 'recommended' && !cfg.allowCustom && cfg.recommended?.length) {
    return `Kies een aanbevolen aantal: ${cfg.recommended.join(', ')}.`
  }
  return `Aantal moet tussen ${cfg.min} en ${cfg.max} zijn.`
}

/**
 * Safely parses a raw configJson value (from DB or API) into a QuantityConfig.
 * Expects { quantity: { mode, min, max, ... } } shape.
 * Returns defaultQuantityConfig() on any parse failure.
 */
export function parseQuantityConfig(configJson: unknown): QuantityConfig {
  if (!configJson || typeof configJson !== 'object' || Array.isArray(configJson)) {
    return defaultQuantityConfig()
  }
  const root = configJson as Record<string, unknown>
  const q    = root.quantity
  if (!q || typeof q !== 'object' || Array.isArray(q)) return defaultQuantityConfig()
  const qc = q as Record<string, unknown>

  const mode: QuantityMode =
    qc.mode === 'recommended' ? 'recommended'
    : qc.mode === 'pack'    ? 'pack'
    : 'free'

  const min = typeof qc.min === 'number' ? Math.max(1, Math.round(qc.min)) : 1
  const max = typeof qc.max === 'number' ? Math.max(min, Math.round(qc.max)) : 500

  const recommended: number[] | undefined = Array.isArray(qc.recommended)
    ? (qc.recommended as unknown[]).filter((n): n is number => typeof n === 'number' && n > 0)
    : undefined

  const step: number | undefined = typeof qc.step === 'number' && qc.step > 0
    ? Math.round(qc.step)
    : undefined

  const allowCustom = typeof qc.allowCustom === 'boolean' ? qc.allowCustom : false

  return { mode, min, max, recommended, step, allowCustom }
}
