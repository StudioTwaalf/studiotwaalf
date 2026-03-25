/**
 * Convert millimetres to pixels at 96 DPI (CSS standard).
 * px = (mm / 25.4) * 96
 */
export function mmToPx(mm: number): number {
  return (mm / 25.4) * 96
}

// ---------------------------------------------------------------------------
// Element types
// ---------------------------------------------------------------------------

/**
 * A text element stored in designJson.elements.
 *
 * Positions (x, y) are always in mm.
 * fontSize is in px (screen pixels, used directly in SVG fontSize).
 */
export interface TextElement {
  id: string
  type: 'text'
  x: number             // mm from left edge
  y: number             // mm from top edge
  text: string
  fontFamily: string
  fontSize: number      // px
  color: string         // #RRGGBB
  fontWeight?: number   // e.g. 400, 700
  letterSpacing?: number // px
}

/** Union of all supported element types (extendable later). */
export type DesignElement = TextElement

export interface DesignJson {
  background?: string
  elements?: DesignElement[]
  [key: string]: unknown
}

/**
 * Type-guard: is this a fully valid TextElement?
 * Checks every field that render code depends on to prevent runtime crashes
 * when the stored JSON is incomplete or uses unknown element types.
 */
export function isTextElement(el: unknown): el is TextElement {
  if (typeof el !== 'object' || el === null) return false
  const e = el as Record<string, unknown>
  return (
    e.type === 'text' &&
    typeof e.id === 'string' &&
    typeof e.x === 'number' &&
    typeof e.y === 'number' &&
    typeof e.text === 'string' &&
    typeof e.fontSize === 'number' &&
    typeof e.color === 'string' &&
    typeof e.fontFamily === 'string'
  )
}

/**
 * Safely parse a Prisma Json field as a DesignJson object.
 * Returns null if the value is missing or not an object.
 */
export function parseDesignJson(raw: unknown): DesignJson | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw as DesignJson
}

/** Generate a simple unique id for new elements. */
export function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

// ---------------------------------------------------------------------------
// TemplateDesign v1 → DesignJson bridge
// ---------------------------------------------------------------------------

/**
 * Detects whether `raw` is a TemplateDesign v1 object (the new admin schema).
 * Used to convert it to the legacy DesignJson format that DesignEditor understands.
 */
/** Public helper — returns true when raw is a TemplateDesign v1 object. */
export function isTemplateDesignV1(raw: unknown): boolean {
  return isTemplateDesignRaw(raw)
}

function isTemplateDesignRaw(raw: unknown): raw is Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return false
  const d = raw as Record<string, unknown>
  if (typeof d.version !== 'number') return false
  if (!Array.isArray(d.artboards) || d.artboards.length === 0) return false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const first = (d.artboards as any[])[0]
  return typeof first?.id === 'string' && first?.unit === 'mm' && Array.isArray(d.elements)
}

/**
 * Converts a TemplateDesign v1 JSON to a DesignJson that DesignEditor can use.
 *
 * What is converted:
 *  • artboards[0] — determines the front side and background colour
 *  • TextElements on artboard_0 → legacy TextElement (content→text, mm fontSize→px)
 *  • Background shape (name contains "background"/"achtergrond") → designJson.background
 *
 * What is NOT converted (not supported by SvgCanvas):
 *  • ShapeElements / ImageElements — SvgCanvas only renders text
 *  • Artboard 1+ (back side) — DesignEditor is single-artboard
 */
export function templateDesignToDesignJson(raw: unknown): DesignJson | null {
  if (!isTemplateDesignRaw(raw)) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const artboards  = (raw.artboards as any[])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allEls     = (raw.elements as any[])
  const firstAbId  = artboards[0].id

  // ── Background colour ────────────────────────────────────────────────────
  // Prefer the background shape's fill; fall back to artboard.backgroundColor.
  let background: string = artboards[0].backgroundColor ?? '#ffffff'
  const bgShape = allEls.find(
    (el) =>
      el.artboardId === firstAbId &&
      el.type === 'shape' &&
      typeof el.name === 'string' &&
      (el.name.toLowerCase().includes('background') ||
       el.name.toLowerCase().includes('achtergrond')) &&
      typeof el.style?.fill === 'string' &&
      el.style.fill !== 'none',
  )
  if (bgShape) background = bgShape.style.fill

  // ── Text elements ────────────────────────────────────────────────────────
  const textElements: TextElement[] = allEls
    .filter((el) => el.artboardId === firstAbId && el.type === 'text')
    .map((el) => {
      const style       = el.style ?? {}
      const fontSizeMm  = typeof style.fontSize === 'number' ? style.fontSize : 3
      const fontSizePx  = mmToPx(fontSizeMm)
      // letterSpacing in TemplateDesign is a unitless em ratio; SvgCanvas expects px.
      const lsEm        = typeof style.letterSpacing === 'number' ? style.letterSpacing : 0

      return {
        id:            typeof el.id === 'string' ? el.id : newId(),
        type:          'text' as const,
        x:             typeof el.x === 'number' ? el.x : 0,
        y:             typeof el.y === 'number' ? el.y : 0,
        text:          typeof el.content === 'string' ? el.content : '',
        fontFamily:    typeof style.fontFamily === 'string' ? style.fontFamily : 'sans-serif',
        fontSize:      fontSizePx,
        color:         typeof style.color === 'string' ? style.color : '#000000',
        fontWeight:    typeof style.fontWeight === 'number' ? style.fontWeight : 400,
        letterSpacing: lsEm * fontSizePx,
      }
    })

  return { background, elements: textElements }
}

/** Available font families shown in the properties panel. */
export const FONT_FAMILIES = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Playfair Display',
  'Merriweather',
  'Source Code Pro',
] as const
