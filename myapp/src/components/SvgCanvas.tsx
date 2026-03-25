'use client'

import { mmToPx, isTextElement, type DesignJson } from '@/lib/design-utils'

interface Props {
  widthMm: number
  heightMm: number
  designJson: DesignJson | null
  /** Currently selected element id */
  selectedId?: string | null
  /** Called when user clicks an element (passes id) or clicks background (passes null) */
  onSelect?: (id: string | null) => void
  /** Max display width in px — canvas scales down to fit */
  maxDisplayWidth?: number
}

export default function SvgCanvas({
  widthMm,
  heightMm,
  designJson,
  selectedId,
  onSelect,
  maxDisplayWidth = 800,
}: Props) {
  const naturalW = mmToPx(widthMm)
  const naturalH = mmToPx(heightMm)
  const background = designJson?.background ?? '#ffffff'

  // ── Pre-partition elements so we can show a skipped-count badge ──────────
  // isTextElement now validates every required field, so anything that passes
  // is guaranteed safe to render. Unknown / incomplete elements are counted.
  const allElements = designJson?.elements ?? []
  const renderableElements = allElements.filter(isTextElement)
  const skippedCount = allElements.length - renderableElements.length

  return (
    <div className="flex flex-col items-center w-full gap-1.5">
      <div
        className="rounded-sm w-full"
        style={{
          maxWidth: maxDisplayWidth,
          filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.12)) drop-shadow(0 1px 4px rgba(0,0,0,0.08))',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${naturalW} ${naturalH}`}
          style={{ display: 'block', width: '100%', height: 'auto', cursor: 'default' }}
          aria-label={`Design canvas — ${widthMm} × ${heightMm} mm`}
          onClick={() => onSelect?.(null)}
        >
          {/* Background */}
          <rect x={0} y={0} width={naturalW} height={naturalH} fill={background} />

          {/* Elements — only fully-valid text elements reach here */}
          {renderableElements.map((el) => {
            const x = mmToPx(el.x)
            const y = mmToPx(el.y)
            // Safe fallbacks as a second defensive layer
            const fs          = el.fontSize    || 16
            const text        = el.text        ?? ''
            const color       = el.color       || '#000000'
            const fontFamily  = el.fontFamily  || 'sans-serif'
            const isSelected  = el.id === selectedId

            // Approximate bounding box (heuristic — SVG has no getBBox during SSR)
            const approxW = text.length * fs * 0.6
            const approxH = fs * 1.2
            const pad = 4

            return (
              <g
                key={el.id}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect?.(el.id)
                }}
              >
                {/* Selection outline */}
                {isSelected && (
                  <rect
                    x={x - pad}
                    y={y - pad}
                    width={approxW + pad * 2}
                    height={approxH + pad * 2}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    rx={2}
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* Invisible hit-area */}
                <rect
                  x={x - pad}
                  y={y - pad}
                  width={approxW + pad * 2}
                  height={approxH + pad * 2}
                  fill="transparent"
                />

                <text
                  x={x}
                  y={y}
                  fontSize={fs}
                  fill={color}
                  fontFamily={fontFamily}
                  fontWeight={el.fontWeight ?? 400}
                  letterSpacing={el.letterSpacing ?? 0}
                  dominantBaseline="hanging"
                  style={{ userSelect: 'none' }}
                >
                  {text}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Skipped-elements notice — only shown when relevant */}
      {skippedCount > 0 && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
          {skippedCount} element{skippedCount > 1 ? 'en' : ''} overgeslagen
          (onbekend type of ontbrekende velden)
        </p>
      )}
    </div>
  )
}
