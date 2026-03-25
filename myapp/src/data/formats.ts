/**
 * Studio Twaalf — Card Format Library
 *
 * Defines the standard paper sizes available in the editor.
 * The "format" purely governs artboard dimensions; paper material
 * and texture are a separate concern (see papers.ts).
 *
 * All measurements are in millimetres.
 * Orientation is encoded directly in width/height — no separate flag.
 *
 * To add new formats, append to CARD_FORMATS.  The editor picks up the
 * new entry automatically; no other changes are required.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type FormatCategory = 'a-series' | 'square' | 'envelope' | 'us'

export interface CardFormat {
  /** Stable identifier — stored on the artboard to remember the chosen format. */
  id:          string
  /** Short display name, e.g. "A6" or "Vierkant". */
  name:        string
  /** Full human-readable label, e.g. "A6 Staand". */
  label:       string
  /** Artboard width in mm. */
  widthMm:     number
  /** Artboard height in mm. */
  heightMm:    number
  /** Visual group for the picker. */
  category:    FormatCategory
  /** Optional tooltip / info text. */
  description?: string
}

// ─── Presets ──────────────────────────────────────────────────────────────────

export const CARD_FORMATS: CardFormat[] = [
  // ── A-series ──────────────────────────────────────────────────────────────
  {
    id:          'a6-staand',
    name:        'A6',
    label:       'A6 Staand',
    widthMm:     105,
    heightMm:    148,
    category:    'a-series',
    description: 'Meest gekozen formaat voor geboortekaartjes',
  },
  {
    id:          'a6-liggend',
    name:        'A6 ↔',
    label:       'A6 Liggend',
    widthMm:     148,
    heightMm:    105,
    category:    'a-series',
    description: 'Liggend A6',
  },
  {
    id:          'a5-staand',
    name:        'A5',
    label:       'A5 Staand',
    widthMm:     148,
    heightMm:    210,
    category:    'a-series',
    description: 'Groot formaat voor uitnodigingen',
  },
  {
    id:          'a5-liggend',
    name:        'A5 ↔',
    label:       'A5 Liggend',
    widthMm:     210,
    heightMm:    148,
    category:    'a-series',
    description: 'Liggend A5',
  },

  // ── Square ────────────────────────────────────────────────────────────────
  {
    id:          'vierkant-148',
    name:        'Vierkant',
    label:       'Vierkant 148',
    widthMm:     148,
    heightMm:    148,
    category:    'square',
    description: '148 × 148 mm — trendy vierkant',
  },
  {
    id:          'vierkant-100',
    name:        'Vierkant S',
    label:       'Vierkant 100',
    widthMm:     100,
    heightMm:    100,
    category:    'square',
    description: '100 × 100 mm — compact vierkant',
  },

  // ── Envelope / DL ─────────────────────────────────────────────────────────
  {
    id:          'dl',
    name:        'DL',
    label:       'DL',
    widthMm:     99,
    heightMm:    210,
    category:    'envelope',
    description: 'Smal envelop-formaat',
  },

  // ── US ────────────────────────────────────────────────────────────────────
  {
    id:          'us-5x7',
    name:        'US 5×7',
    label:       'US 5 × 7″',
    widthMm:     127,
    heightMm:    177,
    category:    'us',
    description: 'Standaard uitnodigingsformaat VS',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Find the format that matches the given artboard dimensions exactly.
 * Returns null when the artboard has custom dimensions not in the preset list.
 */
export function matchFormat(widthMm: number, heightMm: number): CardFormat | null {
  return CARD_FORMATS.find(
    (f) => f.widthMm === widthMm && f.heightMm === heightMm,
  ) ?? null
}
