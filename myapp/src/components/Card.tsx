import data from '../../public/images/templates/geboorte_ella.json'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Bounds {
  left: number
  top: number     // Illustrator doc space: Y-axis goes up → values ≤ 0 below artboard origin
  right: number
  bottom: number
  width: number
  height: number
}

interface Artboard {
  index: number
  name: string
  rect: Bounds
}

interface TextStyle {
  fontFamily?: string
  fontStyle?: string
  fontSize?: number
  fillColor?: string
}

interface TextFrame {
  name: string
  contents: string
  kind: string
  bounds: Bounds
  textStyle?: TextStyle
  layer: string
}

interface PlacedItem {
  name?: string
  file?: string
  bounds: Bounds
  layer?: string
}

/**
 * A single anchor point in Illustrator path data.
 * anchor / leftDirection / rightDirection are [x, y] in Illustrator coordinates.
 * Not present in this export yet — typed here so level-1 rendering can be
 * connected later without changing the PathItem interface.
 */
interface PathPoint {
  anchor: [number, number]
  leftDirection?: [number, number]
  rightDirection?: [number, number]
  pointType?: string  // e.g. "PointType.SMOOTH" | "PointType.CORNER"
}

interface PathItem {
  name?: string
  closed?: boolean
  stroked?: boolean
  filled?: boolean
  fillColor?: string    // hex string, e.g. "#FC6363" — not exported in this version yet
  strokeColor?: string  // hex string
  strokeWidth?: number
  pathPoints?: PathPoint[]  // level 1: real vector data (absent in this export)
  bounds: Bounds
  layer?: string
}

interface TemplateData {
  document?: { name: string; colorSpace: string }
  artboards: Artboard[]
  textFrames: TextFrame[]
  placedItems: PlacedItem[]
  pathItems: PathItem[]
}

// ── Coordinate helpers ────────────────────────────────────────────────────────

/**
 * Convert an Illustrator Y value to an SVG/CSS Y value within the artboard.
 *
 * Illustrator: Y-axis goes UP.
 *   artboard.rect.top = 0  (top edge of the artboard in document space)
 *   Values go negative downward, e.g. an item 400 px down → illusY = −400.
 *
 * SVG / CSS: Y-axis goes DOWN from the container top.
 *
 * Formula:  outputY = artboard.rect.top − illusY
 *   e.g.   0 − (−400) = 400  ✓
 *
 * The SVG overlay uses viewBox="0 0 width height", so this formula keeps
 * everything consistent between the div-based layers and the SVG layer.
 */
function toY(artboardTop: number, illusY: number): number {
  return artboardTop - illusY
}

// ── Path helpers ──────────────────────────────────────────────────────────────

/**
 * Level 1 — Convert Illustrator PathPoints → SVG `d` attribute string.
 * Uses cubic Béziers (C command) via left/rightDirection handles.
 * Returns '' if the point array is empty.
 */
function pathPointsToD(
  points: PathPoint[],
  artboardTop: number,
  closed: boolean,
): string {
  if (points.length === 0) return ''

  const p = points.map((pt) => ({
    x:  pt.anchor[0],
    y:  toY(artboardTop, pt.anchor[1]),
    lx: pt.leftDirection  ? pt.leftDirection[0]                     : pt.anchor[0],
    ly: pt.leftDirection  ? toY(artboardTop, pt.leftDirection[1])   : toY(artboardTop, pt.anchor[1]),
    rx: pt.rightDirection ? pt.rightDirection[0]                    : pt.anchor[0],
    ry: pt.rightDirection ? toY(artboardTop, pt.rightDirection[1])  : toY(artboardTop, pt.anchor[1]),
  }))

  let d = `M ${p[0].x} ${p[0].y}`
  for (let i = 1; i < p.length; i++) {
    d += ` C ${p[i-1].rx} ${p[i-1].ry} ${p[i].lx} ${p[i].ly} ${p[i].x} ${p[i].y}`
  }
  if (closed && p.length > 1) {
    d += ` C ${p[p.length-1].rx} ${p[p.length-1].ry} ${p[0].lx} ${p[0].ly} ${p[0].x} ${p[0].y} Z`
  }
  return d
}

/**
 * Render a single pathItem as an SVG element.
 *
 * Level 1 — pathPoints present  → <path d="...">
 * Level 2 — only bounds present → <rect> fallback
 * Level 3 — unusable data       → null (silent skip)
 */
function renderPathItem(
  item: PathItem,
  artboardTop: number,
  key: string,
): React.ReactElement | null {
  const fill   = item.filled  ? (item.fillColor   ?? 'none')            : 'none'
  const stroke = item.stroked ? (item.strokeColor ?? 'rgba(0,0,0,0.2)') : 'none'
  const sw     = item.stroked ? (item.strokeWidth ?? 1)                 : 0

  // Level 1: real path data
  if (item.pathPoints && item.pathPoints.length > 0) {
    const d = pathPointsToD(item.pathPoints, artboardTop, item.closed ?? false)
    if (!d) return null
    return <path key={key} d={d} fill={fill} stroke={stroke} strokeWidth={sw} />
  }

  // Level 2: bounds-based rect fallback
  const x = item.bounds.left
  const y = toY(artboardTop, item.bounds.top)
  if (!isFinite(x) || !isFinite(y)) return null  // level 3

  return (
    <rect
      key={key}
      x={x}
      y={y}
      width={item.bounds.width}
      height={item.bounds.height}
      fill={fill}
      stroke={stroke}
      strokeWidth={sw}
    />
  )
}

// ── Other helpers ─────────────────────────────────────────────────────────────

/** Returns true if the item's bounds cover (nearly) the full artboard. */
function isBackground(item: PathItem, w: number, h: number): boolean {
  const T = 0.02
  return (
    Math.abs(item.bounds.width  - w) / w < T &&
    Math.abs(item.bounds.height - h) / h < T
  )
}

/** Only accept paths a browser can load — reject local filesystem paths. */
function isBrowserSrc(src?: string): src is string {
  if (!src) return false
  return src.startsWith('/') || src.startsWith('http://') || src.startsWith('https://')
}

// ── Component ─────────────────────────────────────────────────────────────────

const template = data as unknown as TemplateData

/**
 * Layer order (bottom → top), matching Illustrator layer stack:
 *   1. wrapper div background colour  (achtergrond)
 *   2. SVG overlay — pathItems shapes (afbeelding / shapes)
 *   3. placedItems — <img> tags       (afbeelding / rasters)
 *   4. textFrames — <div> tags        (tekst — always on top)
 */
export default function Card() {
  const artboard = template.artboards[0]
  const { width, height, top: artboardTop } = artboard.rect

  const bgPath  = template.pathItems.find((p) => p.filled && isBackground(p, width, height))
  const bgColor = bgPath?.fillColor ?? 'white'

  const shapeItems = template.pathItems.filter((p) => !isBackground(p, width, height))

  return (
    <div style={{ position: 'relative', width, height, background: bgColor, overflow: 'hidden' }}>

      {/* ── Layer 1: SVG shapes (pathItems, non-background) ─────────────── */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: 'absolute', left: 0, top: 0, width, height, pointerEvents: 'none' }}
      >
        {shapeItems.map((item, i) =>
          renderPathItem(item, artboardTop, `shape-${i}`),
        )}
      </svg>

      {/* ── Layer 2: placedItems ─────────────────────────────────────────── */}
      {template.placedItems.map((item, i) => {
        if (!isBrowserSrc(item.file)) return null
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`placed-${i}`}
            src={item.file}
            alt=""
            style={{
              position: 'absolute',
              left: item.bounds.left,
              top: toY(artboardTop, item.bounds.top),
              width: item.bounds.width,
              height: item.bounds.height,
              objectFit: 'contain',
            }}
          />
        )
      })}

      {/* ── Layer 3: textFrames (always on top) ──────────────────────────── */}
      {template.textFrames.map((t, i) => {
        const bold = t.textStyle?.fontStyle?.includes('Bold') ?? false
        return (
          <div
            key={`text-${i}`}
            style={{
              position: 'absolute',
              left: t.bounds.left,
              top: toY(artboardTop, t.bounds.top),
              color: t.textStyle?.fillColor ?? '#000',
              fontSize: t.textStyle?.fontSize ?? 16,
              fontFamily: t.textStyle?.fontFamily ?? 'sans-serif',
              fontWeight: bold ? 'bold' : 'normal',
              whiteSpace: 'pre-wrap',
              lineHeight: 1,
            }}
          >
            {t.contents}
          </div>
        )
      })}

    </div>
  )
}
