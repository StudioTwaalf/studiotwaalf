/**
 * Editor constants shared across CanvasEditor components.
 */

/** Handle size in visual (display) pixels — stays constant regardless of zoom. */
export const HANDLE_SIZE = 8

/** Gap between the element bounding box and the rotation handle (visual px). */
export const ROTATION_HANDLE_GAP = 20

/** Selection outline stroke width (visual px). */
export const SELECTION_STROKE = 1.5

/** Max history states kept for undo/redo. */
export const MAX_HISTORY = 60

/** Snap threshold in natural canvas units (≈ mm). */
export const SNAP_THRESHOLD = 1.5

/** Print-safe margin in mm — elements within this zone touch the bleed edge. */
export const MARGIN_MM = 3

/** Zoom snap steps available in the zoom dropdown. */
export const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3]

export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 4

/** Available font families in the editor. */
export const EDITOR_FONTS = [
  { label: 'Manrope',           value: 'Manrope',             variable: 'var(--font-sans)' },
  { label: 'Fraunces',          value: 'Fraunces',            variable: 'var(--font-serif)' },
  { label: 'Playfair Display',  value: 'Playfair Display',    variable: 'var(--font-playfair)' },
  { label: 'Montserrat',        value: 'Montserrat',          variable: 'var(--font-montserrat)' },
  { label: 'Libre Baskerville', value: 'Libre Baskerville',   variable: 'var(--font-libre-baskerville)' },
  { label: 'DM Serif Display',  value: 'DM Serif Display',    variable: 'var(--font-dm-serif)' },
  { label: 'Arial',             value: 'Arial',               variable: 'Arial, sans-serif' },
  { label: 'Georgia',           value: 'Georgia',             variable: 'Georgia, serif' },
  { label: 'Courier New',       value: 'Courier New',         variable: "'Courier New', monospace" },
] as const

export type EditorFontValue = (typeof EDITOR_FONTS)[number]['value']

/** Default properties for a newly created text element. */
export const DEFAULT_TEXT_STYLE = {
  fontFamily:    'Manrope',
  fontSize:      5,         // mm
  fontWeight:    400,
  color:         '#111111',
  letterSpacing: 0,
  lineHeight:    1.2,
  textAlign:     'left' as const,
}
