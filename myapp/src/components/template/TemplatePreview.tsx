'use client'

/**
 * TemplatePreview
 *
 * Renders a single artboard from a TemplateDesign (schema v1).
 * Supports: text, shape, image elements.
 *
 * Coordinate system:
 *   All positions (x, y, width, height, fontSize) are in mm.
 *   The inner canvas treats mm values as px at 1:1 scale, then
 *   CSS transform: scale() shrinks the whole canvas to fit maxWidth.
 *   This keeps all proportions correct without any manual unit conversion.
 *
 * Text positioning:
 *   x = left edge of the text frame (mm from artboard left)
 *   y = top edge of the text frame (mm from artboard top)
 *   lineHeight: 1 is the default — avoids browser half-leading shifting
 *   text downward compared to the design tool.
 *
 * Typography fidelity notes:
 *   • fontFamily: the Illustrator font name is passed directly. If the font
 *     is not loaded as a web font, the browser falls back to Arial.
 *     For exact fidelity, load the font via next/font or a <link> tag.
 *   • letterSpacing: Illustrator tracking / 1000 → CSS em value (e.g. 0.05em).
 *   • lineHeight: Illustrator leading / fontSize → CSS unitless ratio.
 *     Defaults to 1 (no browser half-leading) when not specified.
 *   • Rotation: supported per element via CSS transform.
 *   • Remaining gap: exact glyph metrics differ per font/OS renderer.
 *
 * Multi-artboard:
 *   Pass artboardId to render a specific artboard.
 *   Default is artboards[0] (front side).
 *   To add an artboard switcher, map over design.artboards and pass each id.
 */

import type {
  TemplateDesign,
  Artboard,
  TemplateElement,
  TextElement,
  ShapeElement,
  ImageElement,
} from '@/types/template'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  design:       TemplateDesign
  /** Constrain the rendered width to this many pixels (preserves aspect ratio). */
  maxWidth?:    number
  /** Which artboard to render. Defaults to artboards[0] (front). */
  artboardId?:  string
}

// ─── Element renderers ────────────────────────────────────────────────────────

function renderText(el: TextElement, key: number) {
  const s = el.style

  // letterSpacing: Illustrator tracking / 1000 → CSS em.
  const letterSpacing = s.letterSpacing != null
    ? `${s.letterSpacing}em`
    : undefined

  // lineHeight: explicit value from export, or 1 to prevent browser half-leading.
  // With lineHeight: 1 there is no CSS half-leading space above the first line,
  // which matches how Illustrator positions text from the frame's top edge.
  const lineHeight = s.lineHeight ?? 1

  return (
    <div
      key={key}
      style={{
        position:      'absolute',
        left:          el.x,
        top:           el.y,
        ...(el.width  != null ? { width:  el.width }          : {}),
        ...(el.height != null ? { height: el.height }         : {}),
        overflow:      'visible',
        ...(el.rotation ? {
          transform:       `rotate(${el.rotation}deg)`,
          transformOrigin: 'top left',
        } : {}),
        // ── Typography ────────────────────────────────────────────────────
        // fontFamily: Illustrator name first; browser falls back to Arial if
        // the font is not loaded. Load the font as a web font for exact fidelity.
        fontFamily:    `${s.fontFamily}, Arial, sans-serif`,
        fontSize:      s.fontSize,
        fontWeight:    s.fontWeight ?? 400,
        fontStyle:     s.fontStyle  ?? 'normal',
        color:         s.color,
        lineHeight,
        textAlign:     s.textAlign  ?? 'left',
        ...(letterSpacing ? { letterSpacing } : {}),
        whiteSpace:    'pre-wrap',
      }}
    >
      {el.content}
    </div>
  )
}

function renderShape(el: ShapeElement, key: number) {
  const s = el.style

  // Only "rect" and "ellipse" are rendered as styled divs.
  // Other shapeTypes (star, arc, polygon, path) fall back to a rect bounding box.
  const borderRadius = el.shapeType === 'ellipse' ? '50%' : undefined

  return (
    <div
      key={key}
      style={{
        position:        'absolute',
        left:            el.x,
        top:             el.y,
        width:           el.width,
        height:          el.height,
        ...(el.rotation ? {
          transform:       `rotate(${el.rotation}deg)`,
          transformOrigin: 'top left',
        } : {}),
        backgroundColor: s.fill   && s.fill   !== 'none' ? s.fill   : 'transparent',
        border:          s.stroke && s.stroke !== 'none'
          ? `${(s.strokeWidth ?? 0)}px solid ${s.stroke}`
          : 'none',
        opacity:         s.opacity ?? 1,
        ...(borderRadius ? { borderRadius } : {}),
        pointerEvents:   'none',
      }}
    />
  )
}

function renderImage(el: ImageElement, key: number) {
  // Only render browser-accessible src values.
  if (!el.src || (!el.src.startsWith('/') && !el.src.startsWith('http'))) return null

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={key}
      src={el.src}
      alt={el.name ?? ''}
      style={{
        position:        'absolute',
        left:            el.x,
        top:             el.y,
        width:           el.width,
        height:          el.height,
        ...(el.rotation ? {
          transform:       `rotate(${el.rotation}deg)`,
          transformOrigin: 'top left',
        } : {}),
        objectFit:       'contain',
      }}
    />
  )
}

function renderElement(el: TemplateElement, key: number): React.ReactNode {
  if (el.type === 'text')  return renderText(el, key)
  if (el.type === 'shape') return renderShape(el, key)
  if (el.type === 'image') return renderImage(el, key)
  return null
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TemplatePreview({ design, maxWidth, artboardId }: Props) {
  // ── Select artboard (first by default) ────────────────────────────────────
  const artboard: Artboard =
    (artboardId
      ? design.artboards.find((a) => a.id === artboardId)
      : null)
    ?? design.artboards[0]

  if (!artboard) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-gray-400 select-none">
        Geen artboard gevonden
      </div>
    )
  }

  // ── Scale ──────────────────────────────────────────────────────────────────
  // mm values are treated as px units in the 1:1 canvas.
  // The CSS transform then scales the entire canvas to fit maxWidth.
  // Always scale to fill maxWidth — works for both mm artboards (105mm → ×4.19)
  // and large-unit artboards (1000pt → ×0.44). When maxWidth is omitted, render 1:1.
  const scale         = maxWidth ? maxWidth / artboard.width : 1
  const displayWidth  = artboard.width  * scale
  const displayHeight = artboard.height * scale

  // ── Elements for this artboard ─────────────────────────────────────────────
  // Sort by type so shapes render first (behind), then images, then text on top.
  // CSS stacks later DOM siblings above earlier ones, so this order is intentional.
  // This also handles exports where textFrames appear before pathItems in the array.
  const TYPE_ORDER: Record<string, number> = { shape: 0, image: 1, text: 2 }
  const elements = design.elements
    .filter((el) => el.artboardId === artboard.id)
    .sort((a, b) => (TYPE_ORDER[a.type] ?? 1) - (TYPE_ORDER[b.type] ?? 1))

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        width:    displayWidth,
        height:   displayHeight,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Inner canvas at 1:1 mm scale, scaled proportionally via CSS transform.
          All child positions/sizes are in mm, used directly as px — the scale
          factor handles the conversion to display pixels without any manual math. */}
      <div
        style={{
          position:        'absolute',
          top:             0,
          left:            0,
          width:           artboard.width,
          height:          artboard.height,
          backgroundColor: artboard.backgroundColor ?? '#ffffff',
          transform:       `scale(${scale})`,
          transformOrigin: 'top left',
          overflow:        'visible',
        }}
      >
        {elements.map((el, i) => renderElement(el, i))}
      </div>
    </div>
  )
}
