'use client'

/**
 * TemplateCustomerEditor
 *
 * Customer-facing editor for TemplateDesign v1 templates.
 * Replaces DesignEditor when the template uses the new schema.
 *
 * Features:
 *   • Artboard tabs — voorkant / achterkant switcher
 *   • TemplatePreview canvas — renders shapes, background and text correctly
 *   • Editing sidebar — only editable text fields + CMYK background colour
 *   • Same save API as DesignEditor (POST /api/designs, PUT /api/designs/[id])
 *   • Same top bar (← Templates, Opslaan, Verder: gadgets →)
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import TemplatePreview from '@/components/template/TemplatePreview'
import type {
  TemplateDesign,
  TextElement,
  TextStyle,
  ShapeElement,
  ShapeStyle,
} from '@/types/template'

// ─── Types ────────────────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
type CMYK = [number, number, number, number]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  templateId:       string
  templateName:     string
  initialDesign:    TemplateDesign
  initialDesignId?: string | null
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

function cmykToHex(c: number, m: number, y: number, k: number): string {
  const clamp = (v: number) => Math.round(Math.max(0, Math.min(255, v)))
  const r = clamp(255 * (1 - c / 100) * (1 - k / 100))
  const g = clamp(255 * (1 - m / 100) * (1 - k / 100))
  const b = clamp(255 * (1 - y / 100) * (1 - k / 100))
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

function hexToCmyk(hex: string): CMYK {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const k = 1 - Math.max(r, g, b)
  if (k >= 1) return [0, 0, 0, 100]
  return [
    Math.round(((1 - r - k) / (1 - k)) * 100),
    Math.round(((1 - g - k) / (1 - k)) * 100),
    Math.round(((1 - b - k) / (1 - k)) * 100),
    Math.round(k * 100),
  ]
}

function getCmyk(style: ShapeStyle): CMYK {
  if (style.fillCmyk) return [...style.fillCmyk] as CMYK
  const hex = style.fill && style.fill !== 'none' ? style.fill : '#ffffff'
  return hexToCmyk(hex)
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm shadow-sm bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'

const numInputCls =
  'w-full px-2 py-2 border border-gray-200 rounded-lg text-sm shadow-sm text-center bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'

// ─── Component ────────────────────────────────────────────────────────────────

export default function TemplateCustomerEditor({
  templateId,
  templateName,
  initialDesign,
  initialDesignId = null,
}: Props) {
  const router = useRouter()

  // ── State ──────────────────────────────────────────────────────────────────
  const [design, setDesign] = useState<TemplateDesign>(() =>
    JSON.parse(JSON.stringify(initialDesign)),
  )
  const [activeArtboardId, setActiveArtboardId] = useState<string>(
    initialDesign.artboards[0]?.id ?? '',
  )
  const [saveStatus, setSaveStatus]   = useState<SaveStatus>('idle')
  const [saveError, setSaveError]     = useState<string | null>(null)
  const [designId, setDesignId]       = useState<string | null>(initialDesignId ?? null)

  // ── Derived: elements for active artboard ─────────────────────────────────
  const editableTexts = design.elements.filter(
    (el): el is TextElement =>
      el.type === 'text' &&
      el.editable === true &&
      el.artboardId === activeArtboardId,
  )

  const fillShapes = design.elements.filter(
    (el): el is ShapeElement =>
      el.type === 'shape' &&
      el.artboardId === activeArtboardId &&
      !!el.style.fill &&
      el.style.fill !== 'none',
  )

  const hasEditableContent = editableTexts.length > 0 || fillShapes.length > 0

  // ── Updaters ───────────────────────────────────────────────────────────────

  const updateTextElement = useCallback(
    (id: string, stylePatch: Partial<TextStyle>, content?: string) => {
      setDesign((prev) => ({
        ...prev,
        elements: prev.elements.map((el) => {
          if (el.id !== id || el.type !== 'text') return el
          const t = el as TextElement
          return {
            ...t,
            ...(content !== undefined ? { content } : {}),
            style: { ...t.style, ...stylePatch },
          }
        }),
      }))
    },
    [],
  )

  const updateShapeStyle = useCallback(
    (id: string, patch: Partial<ShapeStyle>) => {
      setDesign((prev) => ({
        ...prev,
        elements: prev.elements.map((el) => {
          if (el.id !== id || el.type !== 'shape') return el
          const s = el as ShapeElement
          return { ...s, style: { ...s.style, ...patch } }
        }),
      }))
    },
    [],
  )

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setSaveStatus('saving')
    setSaveError(null)
    try {
      if (!designId) {
        const res = await fetch('/api/designs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateId, designJson: design }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({})) as { error?: string }
          setSaveError(json.error ?? 'Kon niet opslaan.')
          setSaveStatus('error')
          setTimeout(() => setSaveStatus('idle'), 4000)
          return
        }
        const json = await res.json() as { designId: string }
        setDesignId(json.designId)
        router.replace(`/design/${templateId}?design=${json.designId}`, { scroll: false })
      } else {
        const res = await fetch(`/api/designs/${designId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ designJson: design }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({})) as { error?: string }
          setSaveError(json.error ?? 'Kon niet opslaan.')
          setSaveStatus('error')
          setTimeout(() => setSaveStatus('idle'), 4000)
          return
        }
      }
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch {
      setSaveError('Netwerkfout — probeer opnieuw.')
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 4000)
    }
  }, [design, designId, templateId, router])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-studio-beige overflow-hidden">

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between bg-white border-b border-studio-sand/40 px-4 h-12 shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <a
            href="/templates"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            ← Templates
          </a>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-800 truncate">{templateName}</span>
          {designId && (
            <>
              <span className="text-gray-300">/</span>
              <span className="text-xs font-mono text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                Design: {designId.slice(0, 8)}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={[
                'text-sm font-medium px-4 py-1.5 rounded-lg transition-all',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
                saveStatus === 'saving' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : '',
                saveStatus === 'saved'  ? 'bg-green-50 text-green-700 border border-green-200' : '',
                saveStatus === 'error'  ? 'bg-red-50 text-red-700 border border-red-200' : '',
                saveStatus === 'idle'   ? 'bg-white text-studio-black border border-studio-sand hover:bg-studio-beige' : '',
              ].join(' ')}
            >
              {saveStatus === 'saving' && 'Opslaan…'}
              {saveStatus === 'saved'  && '✓ Opgeslagen'}
              {saveStatus === 'error'  && 'Fout — opnieuw'}
              {saveStatus === 'idle'   && 'Opslaan'}
            </button>
            {saveStatus === 'error' && saveError && (
              <p className="text-xs text-red-600 max-w-xs text-right leading-tight">{saveError}</p>
            )}
          </div>

          {designId ? (
            <a
              href={`/design/${templateId}/gadgets?design=${designId}`}
              className="text-sm font-medium px-4 py-1.5 rounded-xl bg-studio-yellow text-studio-black
                         hover:brightness-95 transition duration-200 focus:outline-none
                         focus:ring-2 focus:ring-studio-yellow/50 focus:ring-offset-1 whitespace-nowrap"
            >
              Verder: gadgets →
            </a>
          ) : (
            <span
              title="Sla het ontwerp eerst op"
              className="text-sm font-medium px-4 py-1.5 rounded-xl bg-studio-sand/30 text-studio-black/40
                         cursor-not-allowed select-none whitespace-nowrap"
            >
              Verder: gadgets →
            </span>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Canvas area ── */}
        <main className="flex-1 overflow-auto flex flex-col items-center justify-start py-8 px-6 gap-4">

          {/* Artboard tabs — only shown when there are multiple artboards */}
          {design.artboards.length > 1 && (
            <div className="flex gap-1 bg-white border border-studio-sand/40 rounded-xl p-1 shadow-sm">
              {design.artboards.map((ab) => (
                <button
                  key={ab.id}
                  onClick={() => setActiveArtboardId(ab.id)}
                  className={[
                    'text-sm font-medium px-4 py-1.5 rounded-lg transition-all',
                    activeArtboardId === ab.id
                      ? 'bg-studio-yellow text-studio-black shadow-sm'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {ab.name ?? (ab.id === design.artboards[0].id ? 'Voorkant' : 'Achterkant')}
                </button>
              ))}
            </div>
          )}

          {/* Canvas */}
          <div
            className="w-full rounded-2xl overflow-hidden flex items-center justify-center p-8
                       border border-studio-sand/40 shadow-soft"
            style={{
              maxWidth: 760,
              background: 'repeating-conic-gradient(#e8e8e8 0% 25%, #f4f4f4 0% 50%) 0 0 / 20px 20px',
            }}
          >
            <TemplatePreview
              design={design}
              artboardId={activeArtboardId}
              maxWidth={560}
            />
          </div>

          {/* Canvas meta */}
          {(() => {
            const ab = design.artboards.find((a) => a.id === activeArtboardId)
            if (!ab) return null
            return (
              <div
                className="flex items-center justify-between w-full text-xs text-gray-400 font-mono"
                style={{ maxWidth: 760 }}
              >
                <span>{ab.width} × {ab.height} mm</span>
                <span>{Math.round(ab.width * 96 / 25.4)} × {Math.round(ab.height * 96 / 25.4)} px @ 96 dpi</span>
              </div>
            )
          })()}
        </main>

        {/* ── Editing sidebar ── */}
        <aside className="w-80 shrink-0 bg-white border-l border-studio-sand/40 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Aanpassen
            </span>
          </div>

          <div className="p-4 flex flex-col gap-4">

            {!hasEditableContent ? (
              <p className="text-sm text-gray-400 italic py-4 text-center">
                Geen bewerkbare elementen op deze pagina.
              </p>
            ) : (
              <>
                {/* ── Editable text elements ──────────────────────────── */}
                {editableTexts.map((el, i) => {
                  const label = el.name?.trim() || `Tekst ${i + 1}`
                  return (
                    <div
                      key={el.id}
                      className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3"
                    >
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        {label}
                      </p>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tekst</label>
                        <textarea
                          rows={2}
                          value={el.content}
                          onChange={(e) => updateTextElement(el.id, {}, e.target.value)}
                          spellCheck={false}
                          className={`${inputCls} resize-none`}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-gray-600">Kleur</label>
                        <input
                          type="color"
                          value={el.style.color ?? '#000000'}
                          onChange={(e) => updateTextElement(el.id, { color: e.target.value })}
                          className="h-8 w-8 rounded-lg border border-gray-300 cursor-pointer p-0.5 bg-white shrink-0"
                        />
                        <span className="text-xs font-mono text-gray-500 select-all">
                          {el.style.color ?? '#000000'}
                        </span>
                      </div>
                    </div>
                  )
                })}

                {/* ── Background / shape colours (CMYK) ───────────────── */}
                {fillShapes.length > 0 && (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Achtergrond
                    </p>

                    {fillShapes.map((shape, i) => {
                      const label      = shape.name?.trim() || `Vorm ${i + 1}`
                      const cmyk       = getCmyk(shape.style)
                      const [c, m, y, k] = cmyk
                      const hexVal     = shape.style.fill ?? cmykToHex(c, m, y, k)

                      function handleCmykChange(channel: 0 | 1 | 2 | 3, raw: string) {
                        const val = Math.round(Math.max(0, Math.min(100, parseFloat(raw) || 0)))
                        const next: CMYK = [c, m, y, k]
                        next[channel] = val
                        updateShapeStyle(shape.id, { fill: cmykToHex(...next), fillCmyk: next })
                      }

                      return (
                        <div key={shape.id} className="space-y-2">
                          {fillShapes.length > 1 && (
                            <p className="text-[10px] text-gray-400 font-mono">{label}</p>
                          )}

                          {/* Swatch + hex + colour picker */}
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-md border border-gray-300 shrink-0"
                              style={{ backgroundColor: hexVal }}
                            />
                            <span className="text-xs font-mono text-gray-500 select-all">
                              {hexVal.toUpperCase()}
                            </span>
                            <input
                              type="color"
                              value={hexVal}
                              onChange={(e) => {
                                const hex = e.target.value
                                updateShapeStyle(shape.id, { fill: hex, fillCmyk: hexToCmyk(hex) })
                              }}
                              title="Kies kleur (converteert naar CMYK)"
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
                                  className={numInputCls}
                                />
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-400">
                            Waarden 0–100 per kanaal.
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
