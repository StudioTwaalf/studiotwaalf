'use client'

/**
 * DraggableTextOverlay — interactive text-position picker for the gadget
 * personalization modal.
 *
 * Covers the entire preview container (position: absolute, inset-0).
 * Displays:
 *   • A dashed bounding-box indicator showing the allowed drag area.
 *   • Centre-snap guide lines (dashed indigo) when the label is within
 *     `snapThresholdPct` of the bounds centre.
 *   • A draggable text label positioned at the centre point `pos`.
 *
 * Interaction:
 *   • Pointer down anywhere → moves label to that point (clamped to bounds).
 *   • Drag → RAF-throttled live updates via `onChange`.
 *   • Pointer up → `onCommit` with final position.
 *   • Uses `setPointerCapture` so the drag stays captured even if the
 *     pointer leaves the element.
 *
 * Snap-to-centre:
 *   When the computed position is within `snapThresholdPct` (default 2%) of
 *   the centre of the bounds (xPct=50 or yPct=50), the value is clamped to
 *   exactly 50.  The guide lines become visible whenever the label is within
 *   this threshold — including after clicking "Snap naar midden".
 *
 * Coordinates:
 *   `pos.xPct` / `pos.yPct` are 0–100 **relative to the bounds rectangle**
 *   (not the full container).  The absolute position rendered in CSS is:
 *     absX = bounds.xPct + (pos.xPct / 100) * bounds.wPct
 *     absY = bounds.yPct + (pos.yPct / 100) * bounds.hPct
 *
 * Test checklist:
 *   [ ] Pointer down → label moves to clicked position
 *   [ ] Drag outside bounds → position clamped to [0, 100]
 *   [ ] onChange called during drag (RAF-throttled)
 *   [ ] onCommit called once on pointer up
 *   [ ] disabled=true → no interaction, cursor: default
 *   [ ] text=null → placeholder "Sleep naam hier…" in gray
 *   [ ] text present → styled text with fontFamily + color + fontSize
 *   [ ] Dashed bounds rectangle always visible
 *   [ ] Drag near centre X → vertical guide line appears
 *   [ ] Drag near centre Y → horizontal guide line appears
 *   [ ] Drag away from centre → guides disappear
 *   [ ] Snaps to exactly 50 when within snapThresholdPct
 *   [ ] pos={50,50} → both guides show even when not dragging
 */

import { useRef, useState } from 'react'
import type { CSSProperties } from 'react'

// ─── Exported types ────────────────────────────────────────────────────────────

export interface DragPos {
  xPct: number   // 0–100 relative to bounds
  yPct: number   // 0–100 relative to bounds
}

export interface DragBounds {
  xPct:  number   // left edge as % of container
  yPct:  number   // top edge as % of container
  wPct:  number   // width as % of container
  hPct:  number   // height as % of container
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  /** Text to display; null → placeholder */
  text:              string | null
  /** CSS font-family for the displayed name */
  fontFamily:        string
  /** CSS color string for the name text */
  color:             string
  /** Optional CSS text-shadow (e.g. for white text on light background) */
  textShadow?:       string
  /** Font size in CSS pixels for the name label */
  fontSize:          number
  /** Current drag position (0–100 relative to bounds) */
  pos:               DragPos
  /** Allowed drag area (% of container). Shown as dashed indicator. */
  bounds:            DragBounds
  /**
   * Snap-to-centre threshold in percent-of-bounds (default 2).
   * When the computed position is within this distance from 50 on either axis,
   * the position snaps to exactly 50 and a guide line is shown.
   */
  snapThresholdPct?: number
  /** Suppress all interaction */
  disabled?:         boolean
  /** Called during drag; RAF-throttled */
  onChange:          (pos: DragPos) => void
  /** Called once on pointer up with final position */
  onCommit:          (pos: DragPos) => void
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const GUIDE_COLOR = 'rgba(99,102,241,0.72)'

// ─── Component ─────────────────────────────────────────────────────────────────

export default function DraggableTextOverlay({
  text,
  fontFamily,
  color,
  textShadow,
  fontSize,
  pos,
  bounds,
  snapThresholdPct = 2,
  disabled = false,
  onChange,
  onCommit,
}: Props) {
  const wrapperRef  = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const rafIdRef    = useRef<number | null>(null)
  const pendingRef  = useRef<DragPos | null>(null)

  const [active, setActive] = useState(false)

  // ── Snap helper ────────────────────────────────────────────────────────────
  // Applied independently per axis: if within threshold of 50, snap to 50.

  function applySnap(raw: number): number {
    return Math.abs(raw - 50) <= snapThresholdPct ? 50 : raw
  }

  // ── Coordinate conversion ──────────────────────────────────────────────────

  function ptrToPos(clientX: number, clientY: number): DragPos {
    const el = wrapperRef.current
    if (!el) return pos

    const rect = el.getBoundingClientRect()
    // Position as % of the full container (0–100)
    const relX = ((clientX - rect.left)  / rect.width)  * 100
    const relY = ((clientY - rect.top)   / rect.height) * 100
    // Map to bounds-relative % (0–100), clamped, then snap
    const rawX = Math.min(100, Math.max(0,
      (relX - bounds.xPct) / (bounds.wPct || 1) * 100))
    const rawY = Math.min(100, Math.max(0,
      (relY - bounds.yPct) / (bounds.hPct || 1) * 100))
    return { xPct: applySnap(rawX), yPct: applySnap(rawY) }
  }

  // ── Pointer handlers ───────────────────────────────────────────────────────

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return
    e.preventDefault()
    // Capture so pointermove/pointerup always reach this element
    e.currentTarget.setPointerCapture(e.pointerId)
    draggingRef.current = true
    setActive(true)
    onChange(ptrToPos(e.clientX, e.clientY))
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current || disabled) return
    e.preventDefault()
    pendingRef.current = ptrToPos(e.clientX, e.clientY)
    // RAF-throttle so we don't fire more often than the display refresh rate
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        if (pendingRef.current) onChange(pendingRef.current)
        rafIdRef.current = null
      })
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return
    draggingRef.current = false
    setActive(false)
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    onCommit(ptrToPos(e.clientX, e.clientY))
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  // Absolute centre of the label as % of the full container
  const absXPct = bounds.xPct + (pos.xPct / 100) * bounds.wPct
  const absYPct = bounds.yPct + (pos.yPct / 100) * bounds.hPct

  const isPlaceholder = !text
  const displayText   = text ?? 'Sleep naam hier…'

  // Guide lines: shown whenever the position is within the snap threshold of
  // the bounds centre (xPct=50 or yPct=50), whether or not actively dragging.
  const isSnappingX = Math.abs(pos.xPct - 50) <= snapThresholdPct
  const isSnappingY = Math.abs(pos.yPct - 50) <= snapThresholdPct

  // ── Styles ─────────────────────────────────────────────────────────────────

  const wrapperStyle: CSSProperties = {
    position:    'absolute',
    inset:       0,
    cursor:      disabled ? 'default' : active ? 'grabbing' : 'crosshair',
    touchAction: 'none',
    userSelect:  'none',
  }

  const boundsStyle: CSSProperties = {
    position:      'absolute',
    left:          `${bounds.xPct}%`,
    top:           `${bounds.yPct}%`,
    width:         `${bounds.wPct}%`,
    height:        `${bounds.hPct}%`,
    border:        '1.5px dashed rgba(99,102,241,0.38)',
    borderRadius:  4,
    pointerEvents: 'none',
    boxSizing:     'border-box',
  }

  // Vertical guide: spans full bounds height, at horizontal centre of bounds
  const guideXStyle: CSSProperties = {
    position:      'absolute',
    left:          `${bounds.xPct + bounds.wPct / 2}%`,
    top:           `${bounds.yPct}%`,
    width:         0,
    height:        `${bounds.hPct}%`,
    borderLeft:    `1.5px dashed ${GUIDE_COLOR}`,
    pointerEvents: 'none',
  }

  // Horizontal guide: spans full bounds width, at vertical centre of bounds
  const guideYStyle: CSSProperties = {
    position:      'absolute',
    left:          `${bounds.xPct}%`,
    top:           `${bounds.yPct + bounds.hPct / 2}%`,
    width:         `${bounds.wPct}%`,
    height:        0,
    borderTop:     `1.5px dashed ${GUIDE_COLOR}`,
    pointerEvents: 'none',
  }

  const labelWrapStyle: CSSProperties = {
    position:      'absolute',
    left:          `${absXPct}%`,
    top:           `${absYPct}%`,
    transform:     'translate(-50%, -50%)',
    pointerEvents: 'none',
    padding:       '2px 6px',
    borderRadius:  3,
    // Highlight ring while dragging
    ...(active ? { outline: '2px solid rgba(99,102,241,0.6)', outlineOffset: 2 } : {}),
  }

  const labelTextStyle: CSSProperties = {
    fontFamily,
    fontSize,
    fontWeight: 700,
    color:      isPlaceholder ? 'rgba(156,163,175,0.85)' : color,
    textShadow: isPlaceholder ? undefined : textShadow,
    whiteSpace: 'nowrap',
    lineHeight:  1.2,
    display:    'block',
  }

  return (
    <div
      ref={wrapperRef}
      style={wrapperStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Dashed bounds indicator */}
      <div style={boundsStyle} />

      {/* Snap guide lines (visible when within snap threshold of centre) */}
      {isSnappingX && <div style={guideXStyle} />}
      {isSnappingY && <div style={guideYStyle} />}

      {/* Draggable label (pointer-events none; the wrapper handles all events) */}
      <div style={labelWrapStyle}>
        <span style={labelTextStyle}>
          {displayText}
        </span>
      </div>
    </div>
  )
}
