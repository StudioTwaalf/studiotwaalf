/**
 * Studio Twaalf — canonical TemplateDesign schema (v1)
 *
 * This is the single source of truth for all template data in the app.
 *
 * Workflow:
 *   Illustrator design
 *   → export-template.jsx (ExtendScript)
 *   → TemplateDesign JSON  (this schema)
 *   → stored in admin DB
 *   → TemplatePreview renders it
 *   → TemplateEditor lets the customer personalise it
 *
 * Coordinate system:
 *   • Origin: top-left corner of the artboard
 *   • x: mm from the LEFT edge of the artboard
 *   • y: mm from the TOP edge of the artboard
 *   • width / height: mm
 *   • fontSize: mm  (same unit; scales proportionally with the artboard)
 *
 * Schema versioning:
 *   Bump `version` when making breaking changes.
 *   The current version is 1.
 */

// ─── Artboard ─────────────────────────────────────────────────────────────────

export interface Artboard {
  /** Unique identifier — e.g. "front", "back", "artboard_0". */
  id: string
  /** Human-readable label — e.g. "Voorkant". */
  name?: string
  /** Width of the artboard in mm. */
  width: number
  /** Height of the artboard in mm. */
  height: number
  /** Always "mm" — included explicitly so parsers can verify the unit. */
  unit: 'mm'
  /** CSS-compatible hex colour for the artboard background — e.g. "#F6D7DC". */
  backgroundColor?: string
}

// ─── Text element ─────────────────────────────────────────────────────────────

/**
 * Typography properties for a text element.
 *
 * All numeric values use mm as the unit (consistent with position/artboard dims),
 * EXCEPT letterSpacing which is a unitless em ratio (e.g. 0.05 = 0.05em).
 *
 * Fields that are modelled but not yet emitted by the export script are marked
 * with [future]. Add them to the script when Illustrator makes them accessible.
 */
export interface TextStyle {
  fontFamily: string
  /** Font size in mm. */
  fontSize: number
  /** CSS font-weight numeric value: 100 | 200 | … | 900. */
  fontWeight?: number
  /** "normal" | "italic" | "oblique" */
  fontStyle?: 'normal' | 'italic' | 'oblique'
  /**
   * Letter spacing in em units (unitless ratio).
   * Maps directly to CSS `letter-spacing`.
   * Illustrator tracking (1/1000 em) converts as: tracking / 1000.
   * e.g. Illustrator tracking 50 → letterSpacing 0.05.
   */
  letterSpacing?: number
  /**
   * Line height as a unitless ratio of the font size.
   * e.g. 1.2 = 120% of font size.
   * Illustrator leading converts as: leading / fontSize.
   */
  lineHeight?: number
  /** Text colour as a CSS hex string — e.g. "#FC6363". */
  color: string
  /** Horizontal text alignment. */
  textAlign?: 'left' | 'center' | 'right'
  // [future] baseline?: number       — baseline shift in mm
  // [future] capitalization?: string — "normal" | "uppercase" | "lowercase"
}

export interface TextElement {
  id: string
  type: 'text'
  /** References Artboard.id — determines which artboard this element lives on. */
  artboardId: string
  /** Descriptive name, e.g. "baby_name", "subtitle". Used as editor label. */
  name: string
  /** When true, the customer can edit this element in the template editor. */
  editable: boolean
  /**
   * When true, this element is locked for end-users and cannot be moved,
   * resized or deleted by them.  Set by admins in the template builder.
   * Unlike the session-only lock toggle, this flag is persisted in the
   * design/template JSON.
   */
  isTemplateLocked?: boolean
  /** The displayed text content. */
  content: string
  /** mm from the left edge of the artboard. */
  x: number
  /** mm from the top edge of the artboard. */
  y: number
  /** Width of the text frame in mm. */
  width?: number
  /** Height of the text frame in mm. */
  height?: number
  /** Clockwise rotation in degrees. */
  rotation?: number
  style: TextStyle
}

// ─── Shape element ────────────────────────────────────────────────────────────

export interface ShapeStyle {
  /** Fill colour as hex, or "none". */
  fill?: string
  /**
   * Original CMYK fill values as [C, M, Y, K], each 0–100.
   * Stored alongside `fill` (hex) so the print-accurate colour is preserved.
   * When present, CMYK inputs in the editor update both this field and `fill`.
   * Emitted by the export script when the Illustrator fill is a CMYKColor.
   */
  fillCmyk?: [number, number, number, number]
  /** Stroke colour as hex, or "none". */
  stroke?: string
  /** Stroke width in mm. */
  strokeWidth?: number
  /** Opacity 0–1 (1 = fully opaque). */
  opacity?: number
}

export interface ShapeElement {
  id: string
  type: 'shape'
  artboardId: string
  name?: string
  editable?: boolean
  /** Persistently locked for end-users.  Set by admins in the template builder. */
  isTemplateLocked?: boolean
  /**
   * Identifies the shape type for rendering.
   * Supported: "rect", "ellipse"
   * Modelled (no path data yet): "star", "arc", "polygon", "path"
   */
  shapeType: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  style: ShapeStyle
}

// ─── Image element ────────────────────────────────────────────────────────────

export interface ImageElement {
  id: string
  type: 'image'
  artboardId: string
  name?: string
  editable?: boolean
  /** Persistently locked for end-users.  Set by admins in the template builder. */
  isTemplateLocked?: boolean
  /**
   * Web-accessible path (must start with "/" or "https://").
   * Local filesystem paths from Illustrator are exported as empty strings
   * and must be replaced with public URLs before saving.
   */
  src: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  /** Opacity 0–1 (default 1 = fully opaque). */
  opacity?: number
  /**
   * For SVG illustrations: tint the image to this hex colour using CSS filter.
   * When set on a .svg src, the editor applies a CSS filter approximation.
   * Undefined = no tinting (image renders at its natural colours).
   */
  tintColor?: string
}

// ─── Union type ───────────────────────────────────────────────────────────────

export type TemplateElement = TextElement | ShapeElement | ImageElement

// ─── Root object ─────────────────────────────────────────────────────────────

export interface TemplateDesign {
  /** Schema version. Increment when making breaking changes. Current: 1. */
  version: number
  /** Human-readable template name — e.g. "Geboortekaartje Ella". */
  name: string
  /**
   * Ordered list of artboards.
   * Convention: artboards[0] = front, artboards[1] = back.
   * Render one artboard at a time (identified by Artboard.id).
   */
  artboards: Artboard[]
  /**
   * All elements across all artboards.
   * Filter by artboardId to get elements for a specific artboard.
   */
  elements: TemplateElement[]
}

// ─── Type guards ──────────────────────────────────────────────────────────────

/**
 * Returns true when the parsed JSON is a valid TemplateDesign v1 object.
 * Checks structural invariants only — does not validate individual elements.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isTemplateDesign(json: unknown): json is TemplateDesign {
  if (typeof json !== 'object' || json === null || Array.isArray(json)) return false
  const d = json as Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const boards = d.artboards as any[]
  return (
    typeof d.version === 'number' &&
    Array.isArray(d.artboards) &&
    d.artboards.length > 0 &&
    typeof boards[0]?.id === 'string' &&
    boards[0]?.unit === 'mm' &&
    Array.isArray(d.elements)
  )
}

export function isTextElement(el: TemplateElement): el is TextElement {
  return el.type === 'text'
}

export function isShapeElement(el: TemplateElement): el is ShapeElement {
  return el.type === 'shape'
}

export function isImageElement(el: TemplateElement): el is ImageElement {
  return el.type === 'image'
}
