'use client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PreviewConfig {
  shape?: 'circle' | 'rectangle' | 'custom'
  /** diameter in mm — used when shape === 'circle' */
  diameterMm?: number
  /** width in mm — used when shape === 'rectangle' | 'custom' */
  widthMm?: number
  /** height in mm */
  heightMm?: number
  /** text anchor position as percentage of the preview area (0–100) */
  textPosition?: { x: number; y: number }
  /** how to anchor the text ('center' | 'left' | 'right') */
  textAnchor?: 'center' | 'left' | 'right'
}

export interface GadgetPreviewProps {
  /** Gadget type enum value (STICKER, LABEL, …) */
  type: string
  /** Parsed previewConfigJson, or null/undefined if not set */
  previewConfig: PreviewConfig | null | undefined
  /** Personalisation — the baby name to overlay */
  name: string
  /** Optional: font-family for the overlay text */
  font?: string
  /** Optional: text colour for the overlay */
  color?: string
}

// ─── Shape colour palette ─────────────────────────────────────────────────────

const TYPE_BG: Record<string, string> = {
  STICKER:       '#e0e7ff', // indigo-100
  LABEL:         '#fef9c3', // yellow-100
  KAARTJE:       '#dcfce7', // green-100
  SLEUTELHANGER: '#fce7f3', // pink-100
  MAGNEET:       '#dbeafe', // blue-100
  ANDERE:        '#f3f4f6', // gray-100
}

const TYPE_BORDER: Record<string, string> = {
  STICKER:       '#a5b4fc', // indigo-300
  LABEL:         '#fde047', // yellow-300
  KAARTJE:       '#86efac', // green-300
  SLEUTELHANGER: '#f9a8d4', // pink-300
  MAGNEET:       '#93c5fd', // blue-300
  ANDERE:        '#d1d5db', // gray-300
}

const TYPE_TEXT: Record<string, string> = {
  STICKER:       '#3730a3', // indigo-800
  LABEL:         '#713f12', // yellow-900
  KAARTJE:       '#14532d', // green-900
  SLEUTELHANGER: '#831843', // pink-900
  MAGNEET:       '#1e3a5f', // blue-900
  ANDERE:        '#374151', // gray-700
}

// ─── Preview dimensions (px) — fixed display size regardless of real mm ───────

const PREVIEW_W = 160
const PREVIEW_H = 160

// ─── SVG shapes ───────────────────────────────────────────────────────────────

function ShapeCircle({ bg, border }: { bg: string; border: string }) {
  const r = (PREVIEW_W / 2) - 4
  return (
    <circle
      cx={PREVIEW_W / 2}
      cy={PREVIEW_H / 2}
      r={r}
      fill={bg}
      stroke={border}
      strokeWidth={2}
    />
  )
}

function ShapeRectangle({ bg, border }: { bg: string; border: string }) {
  return (
    <rect
      x={8}
      y={8}
      width={PREVIEW_W - 16}
      height={PREVIEW_H - 16}
      rx={6}
      fill={bg}
      stroke={border}
      strokeWidth={2}
    />
  )
}

/** Stylised key-fob silhouette */
function ShapeSleutelhanger({ bg, border }: { bg: string; border: string }) {
  const cx = PREVIEW_W / 2
  // Oval body
  const bodyX = 12, bodyY = 30, bodyW = PREVIEW_W - 24, bodyH = PREVIEW_H - 50
  // Hole at top
  const holeR = 10, holeCy = 22
  return (
    <>
      <ellipse cx={cx} cy={holeCy} rx={holeR} ry={holeR} fill="none" stroke={border} strokeWidth={3} />
      <rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} rx={bodyW / 2} fill={bg} stroke={border} strokeWidth={2} />
    </>
  )
}

function renderShape(type: string, bg: string, border: string) {
  switch (type) {
    case 'STICKER':
    case 'MAGNEET':
      return <ShapeCircle bg={bg} border={border} />
    case 'SLEUTELHANGER':
      return <ShapeSleutelhanger bg={bg} border={border} />
    case 'LABEL':
    case 'KAARTJE':
    case 'ANDERE':
    default:
      return <ShapeRectangle bg={bg} border={border} />
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GadgetPreview({
  type,
  previewConfig,
  name,
  font = 'inherit',
  color,
}: GadgetPreviewProps) {
  const bg     = TYPE_BG[type]     ?? '#f3f4f6'
  const border = TYPE_BORDER[type] ?? '#d1d5db'
  const fgDefault = TYPE_TEXT[type] ?? '#374151'
  const fg     = color ?? fgDefault

  // Text position from config, defaulting to centre
  const tx = previewConfig?.textPosition?.x ?? 50  // % of width
  const ty = previewConfig?.textPosition?.y ?? 50  // % of height
  const anchor = previewConfig?.textAnchor ?? 'center'

  const svgAnchor = anchor === 'left' ? 'start' : anchor === 'right' ? 'end' : 'middle'
  const textX = (tx / 100) * PREVIEW_W
  const textY = (ty / 100) * PREVIEW_H

  const displayName = name.trim() || '…'
  const isPlaceholder = !name.trim()

  return (
    <div className="select-none">
      {/* Label */}
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        Voorbeeld
      </p>

      {/* SVG preview */}
      <svg
        width={PREVIEW_W}
        height={PREVIEW_H}
        viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`}
        aria-label={`Voorbeeld van ${type.toLowerCase()}: ${displayName}`}
        className="rounded overflow-hidden"
        style={{ display: 'block' }}
      >
        {/* Shape */}
        {renderShape(type, bg, border)}

        {/* Overlay text */}
        <text
          x={textX}
          y={textY}
          textAnchor={svgAnchor}
          dominantBaseline="middle"
          fontSize={isPlaceholder ? 13 : 16}
          fontFamily={font}
          fontWeight={isPlaceholder ? 400 : 700}
          fill={isPlaceholder ? `${fg}55` : fg}
          style={{ fontStyle: isPlaceholder ? 'italic' : 'normal' }}
        >
          {displayName}
        </text>
      </svg>
    </div>
  )
}
