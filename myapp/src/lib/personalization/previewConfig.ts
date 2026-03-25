/**
 * PreviewConfig — per-product bounding-box configuration for the name overlay
 * shown on gadget cards and mini previews.
 *
 * All percentage values are relative to the container (0–100).
 *
 * Test checklist:
 *   [ ] parsePreviewConfig(null)        → DEFAULT_PREVIEW_CONFIG, no throw
 *   [ ] parsePreviewConfig(undefined)   → DEFAULT_PREVIEW_CONFIG, no throw
 *   [ ] parsePreviewConfig('garbage')   → DEFAULT_PREVIEW_CONFIG, no throw
 *   [ ] parsePreviewConfig({})          → DEFAULT_PREVIEW_CONFIG (partial → defaults)
 *   [ ] parsePreviewConfig(valid)       → fully validated config returned
 *   [ ] Out-of-range xPct (−5)          → clamped to 0
 *   [ ] Out-of-range opacity (2)        → clamped to 1
 *   [ ] Invalid align string            → 'center' fallback
 *   [ ] Missing chip key               → DEFAULT_PREVIEW_CONFIG chip used
 */

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface PreviewBox {
  /** Left edge as % of container width  (0–100) */
  xPct: number
  /** Top edge as % of container height  (0–100) */
  yPct: number
  /** Box width  as % of container width  (0–100) */
  wPct: number
  /** Box height as % of container height (0–100) */
  hPct: number
}

export interface PreviewChip {
  /** Whether to show a frosted-glass background behind the text */
  enabled: boolean
  /** Background opacity (0–1) */
  opacity: number
  /** Border-radius in px (0–100) */
  radius: number
  /** Inner padding as % of container width (0–100) */
  paddingPct: number
}

export interface PreviewConfig {
  text: {
    box:           PreviewBox
    align:         'left' | 'center' | 'right'
    verticalAlign: 'top' | 'middle' | 'bottom'
    /** Font size as % of container height — informational, used in print PDF */
    fontSizePct?:  number
    /** Truncate display text after this many characters */
    maxChars?:     number
    chip?:         PreviewChip
  }
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

/**
 * Full-width strip at the bottom (75–100% height) with a frosted-glass chip.
 * Matches the legacy overlay behaviour so products without a saved config
 * look identical to before Step 3.
 */
export const DEFAULT_PREVIEW_CONFIG: PreviewConfig = {
  text: {
    box:           { xPct: 0, yPct: 75, wPct: 100, hPct: 25 },
    align:         'center',
    verticalAlign: 'middle',
    fontSizePct:   12,
    maxChars:      20,
    chip: {
      enabled:    true,
      opacity:    0.8,
      radius:     0,
      paddingPct: 2,
    },
  },
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

function parsePct(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return isNaN(n) ? fallback : clamp(n, 0, 100)
}

function parseNum(v: unknown, fallback: number, lo = -Infinity, hi = Infinity): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return isNaN(n) ? fallback : clamp(n, lo, hi)
}

function isObj(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

// ─── Parser ───────────────────────────────────────────────────────────────────

/**
 * Safely parses and validates `previewConfigJson` from the DB.
 * Returns {@link DEFAULT_PREVIEW_CONFIG} for any null / undefined / malformed input.
 * Never throws.
 */
export function parsePreviewConfig(json: unknown): PreviewConfig {
  try {
    if (!isObj(json)) return DEFAULT_PREVIEW_CONFIG

    const raw = json as Record<string, unknown>
    if (!isObj(raw.text)) return DEFAULT_PREVIEW_CONFIG

    const text = raw.text as Record<string, unknown>
    const def  = DEFAULT_PREVIEW_CONFIG.text

    // ── Box ────────────────────────────────────────────────────────────────────
    const rawBox = isObj(text.box) ? (text.box as Record<string, unknown>) : {}
    const box: PreviewBox = {
      xPct: parsePct(rawBox.xPct, def.box.xPct),
      yPct: parsePct(rawBox.yPct, def.box.yPct),
      wPct: parsePct(rawBox.wPct, def.box.wPct),
      hPct: parsePct(rawBox.hPct, def.box.hPct),
    }

    // ── Align ─────────────────────────────────────────────────────────────────
    const ALIGNS   = ['left', 'center', 'right'] as const
    const V_ALIGNS = ['top', 'middle', 'bottom'] as const

    const align = ALIGNS.includes(text.align as never)
      ? (text.align as 'left' | 'center' | 'right')
      : def.align

    const verticalAlign = V_ALIGNS.includes(text.verticalAlign as never)
      ? (text.verticalAlign as 'top' | 'middle' | 'bottom')
      : def.verticalAlign

    // ── Optional scalars ──────────────────────────────────────────────────────
    const fontSizePct = text.fontSizePct !== undefined
      ? parsePct(text.fontSizePct, def.fontSizePct ?? 12)
      : def.fontSizePct

    const maxChars = text.maxChars !== undefined
      ? parseNum(text.maxChars, def.maxChars ?? 20, 1, 200)
      : def.maxChars

    // ── Chip ──────────────────────────────────────────────────────────────────
    const defChip = def.chip
    let chip: PreviewChip | undefined

    if (isObj(text.chip)) {
      const rc = text.chip as Record<string, unknown>
      chip = {
        enabled:    typeof rc.enabled === 'boolean' ? rc.enabled : (defChip?.enabled ?? true),
        opacity:    clamp(parseNum(rc.opacity,    defChip?.opacity    ?? 0.8), 0, 1),
        radius:     parseNum(rc.radius,     defChip?.radius     ?? 0,   0, 100),
        paddingPct: parsePct(rc.paddingPct, defChip?.paddingPct ?? 2),
      }
    } else {
      chip = defChip
    }

    return { text: { box, align, verticalAlign, fontSizePct, maxChars, chip } }
  } catch {
    return DEFAULT_PREVIEW_CONFIG
  }
}
