'use client'

/**
 * TemplateEditor
 *
 * Live editor for a TemplateDesign (schema v1).
 *
 * Sections:
 *   1. Text layers   — elements where `editable === true` and `type === "text"`
 *   2. Background    — shape elements with a fill colour (background / decorations)
 *
 * Layout: controls panel (left) + live TemplatePreview (right).
 *
 * CMYK colour support:
 *   Shape fills can be edited in CMYK (0–100 per channel).
 *   The hex value is derived on every change and stored in `style.fill`.
 *   The raw CMYK tuple is stored in `style.fillCmyk` for print-accurate output.
 *   When `fillCmyk` is already present (set by the export script), those values
 *   are shown as the starting point; otherwise CMYK is approximated from the hex.
 */

import { useState } from 'react'
import TemplatePreview from './TemplatePreview'
import type {
  TemplateDesign,
  TextElement,
  TextStyle,
  ShapeElement,
  ShapeStyle,
} from '@/types/template'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialDesign: TemplateDesign
  /** Called with the updated design on every change. */
  onChange?: (design: TemplateDesign) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_FONTS = [
  'Manrope',
  'Fraunces',
  'Arial',
  'Georgia',
  'Times New Roman',
  'Verdana',
  'Trebuchet MS',
  'Courier New',
  'sans-serif',
  'serif',
] as const

function fontOptions(current: string | undefined): string[] {
  if (current && !(BASE_FONTS as readonly string[]).includes(current)) {
    return [current, ...BASE_FONTS]
  }
  return [...BASE_FONTS]
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

type CMYK = [number, number, number, number]

/** Convert CMYK (0–100 each) to a CSS hex string. */
function cmykToHex(c: number, m: number, y: number, k: number): string {
  const clamp = (v: number) => Math.round(Math.max(0, Math.min(255, v)))
  const r = clamp(255 * (1 - c / 100) * (1 - k / 100))
  const g = clamp(255 * (1 - m / 100) * (1 - k / 100))
  const b = clamp(255 * (1 - y / 100) * (1 - k / 100))
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

/** Approximate RGB hex → CMYK (0–100 each). Exact round-trip is not possible. */
function hexToCmyk(hex: string): CMYK {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const k = 1 - Math.max(r, g, b)
  if (k >= 1) return [0, 0, 0, 100]
  const c = ((1 - r - k) / (1 - k)) * 100
  const m = ((1 - g - k) / (1 - k)) * 100
  const y = ((1 - b - k) / (1 - k)) * 100
  return [Math.round(c), Math.round(m), Math.round(y), Math.round(k * 100)]
}

/** Read CMYK from a ShapeStyle: prefer stored fillCmyk, else derive from hex. */
function getCmyk(style: ShapeStyle): CMYK {
  if (style.fillCmyk) return [...style.fillCmyk] as CMYK
  const hex = style.fill && style.fill !== 'none' ? style.fill : '#ffffff'
  return hexToCmyk(hex)
}

// ─── Shared input class ───────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'

const numberInputCls =
  'w-full px-2 py-2 border border-gray-300 rounded-lg text-sm shadow-sm text-center ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'

// ─── Component ────────────────────────────────────────────────────────────────

export default function TemplateEditor({ initialDesign, onChange }: Props) {
  // Deep-clone on mount so we never mutate the prop.
  const [design, setDesign] = useState<TemplateDesign>(() =>
    JSON.parse(JSON.stringify(initialDesign)),
  )

  // Editable text elements.
  const editableTexts: TextElement[] = design.elements.filter(
    (el): el is TextElement => el.type === 'text' && el.editable === true,
  )

  // Shape elements with a fill colour — shown in the background section.
  // Scoped to artboard_0 (the front/first side), matching what TemplatePreview renders.
  // Covers background rectangles and any other filled decorative shapes on that artboard.
  const firstArtboardId = design.artboards[0]?.id
  const fillShapes: ShapeElement[] = design.elements.filter(
    (el): el is ShapeElement =>
      el.type === 'shape' &&
      el.artboardId === firstArtboardId &&
      !!el.style.fill &&
      el.style.fill !== 'none',
  )

  // ── Immutable updaters ─────────────────────────────────────────────────────

  function updateTextElement(
    id:         string,
    stylePatch: Partial<TextStyle>,
    content?:   string,
  ) {
    const nextElements = design.elements.map((el) => {
      if (el.id !== id || el.type !== 'text') return el
      const textEl = el as TextElement
      return {
        ...textEl,
        ...(content !== undefined ? { content } : {}),
        style: { ...textEl.style, ...stylePatch },
      }
    })
    commit(nextElements)
  }

  function updateShapeStyle(id: string, patch: Partial<ShapeStyle>) {
    const nextElements = design.elements.map((el) => {
      if (el.id !== id || el.type !== 'shape') return el
      const shape = el as ShapeElement
      return { ...shape, style: { ...shape.style, ...patch } }
    })
    commit(nextElements)
  }

  function commit(nextElements: typeof design.elements) {
    const nextDesign: TemplateDesign = { ...design, elements: nextElements }
    setDesign(nextDesign)
    onChange?.(nextDesign)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const hasContent = editableTexts.length > 0 || fillShapes.length > 0

  if (!hasContent) {
    return (
      <p className="text-sm text-gray-400 italic py-4">
        Geen bewerkbare lagen gevonden.
        Controleer of de laag &ldquo;tekst_editable&rdquo; bestaat en teksten
        bevat met <code>editable: true</code>.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

      {/* ── Left: controls ──────────────────────────────────────────────────── */}
      <div className="space-y-4">

        {/* ── Text layers ──────────────────────────────────────────────── */}
        {editableTexts.map((el, i) => {
          const label        = el.name?.trim() || `Tekst ${i + 1}`
          const currentFont  = el.style.fontFamily ?? ''
          const currentColor = el.style.color      ?? '#000000'

          return (
            <div
              key={el.id}
              className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3"
            >
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                {label}
              </p>

              {/* Text content */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Tekst
                </label>
                <textarea
                  rows={2}
                  value={el.content}
                  onChange={(e) => updateTextElement(el.id, {}, e.target.value)}
                  spellCheck={false}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Font family + colour */}
              <div className="flex gap-3 items-end">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Lettertype
                  </label>
                  <select
                    value={currentFont}
                    onChange={(e) =>
                      updateTextElement(el.id, { fontFamily: e.target.value })
                    }
                    className={inputCls}
                  >
                    {fontOptions(currentFont).map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div className="shrink-0">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Kleur
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentColor}
                      onChange={(e) =>
                        updateTextElement(el.id, { color: e.target.value })
                      }
                      className="h-[38px] w-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <span className="text-xs font-mono text-gray-500 select-all">
                      {currentColor}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* ── Background / shape colour (CMYK) ─────────────────────────── */}
        {fillShapes.length > 0 && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Achtergrond
            </p>

            {fillShapes.map((shape, i) => {
              const label   = shape.name?.trim() || `Vorm ${i + 1}`
              const cmyk    = getCmyk(shape.style)
              const [c, m, y, k] = cmyk
              const hexVal  = shape.style.fill ?? cmykToHex(c, m, y, k)

              function handleCmykChange(channel: 0 | 1 | 2 | 3, raw: string) {
                const val     = Math.round(Math.max(0, Math.min(100, parseFloat(raw) || 0)))
                const next: CMYK = [c, m, y, k]
                next[channel] = val
                updateShapeStyle(shape.id, {
                  fill:     cmykToHex(...next),
                  fillCmyk: next,
                })
              }

              return (
                <div key={shape.id} className="space-y-2">
                  {/* Show label only when there are multiple shapes */}
                  {fillShapes.length > 1 && (
                    <p className="text-[10px] text-gray-400 font-mono">{label}</p>
                  )}

                  {/* Colour swatch row */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-md border border-gray-300 shrink-0"
                      style={{ backgroundColor: hexVal }}
                    />
                    <span className="text-xs font-mono text-gray-500 select-all">
                      {hexVal.toUpperCase()}
                    </span>
                    {/* Hex picker as secondary input */}
                    <input
                      type="color"
                      value={hexVal}
                      onChange={(e) => {
                        const hex  = e.target.value
                        const next = hexToCmyk(hex)
                        updateShapeStyle(shape.id, { fill: hex, fillCmyk: next })
                      }}
                      title="Kies kleur via kleurenkiezer (converteert naar CMYK)"
                      className="h-7 w-7 rounded border border-gray-300 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                  </div>

                  {/* CMYK inputs */}
                  <div className="grid grid-cols-4 gap-2">
                    {(['C', 'M', 'Y', 'K'] as const).map((ch, idx) => (
                      <div key={ch} className="space-y-1">
                        <label className="block text-[10px] font-semibold text-center text-gray-500 uppercase">
                          {ch}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={cmyk[idx]}
                          onChange={(e) => handleCmykChange(idx as 0 | 1 | 2 | 3, e.target.value)}
                          className={numberInputCls}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Waarden 0–100 per kanaal. Wordt omgezet naar RGB voor de preview.
                  </p>
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* ── Right: live preview ────────────────────────────────────────────── */}
      <div className="lg:sticky lg:top-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex justify-center items-center min-h-[220px]">
          <TemplatePreview design={design} maxWidth={400} />
        </div>
      </div>

    </div>
  )
}
