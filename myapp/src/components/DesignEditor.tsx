'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import SvgCanvas from '@/components/SvgCanvas'
import {
  mmToPx,
  newId,
  FONT_FAMILIES,
  type DesignJson,
  type TextElement,
} from '@/lib/design-utils'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/** Attempt to pull `{ error: string }` out of an error response body. */
async function apiErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const json = await res.json() as { error?: string }
    return json.error ?? fallback
  } catch {
    return fallback
  }
}

interface Props {
  templateId: string
  templateName: string
  widthMm: number
  heightMm: number
  initialDesignJson: DesignJson | null
  /** If a saved Design was loaded, its id is passed here. */
  initialDesignId?: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeDefaultTextElement(): TextElement {
  return {
    id: newId(),
    type: 'text',
    x: 20,
    y: 20,
    text: 'New text',
    fontFamily: 'Inter',
    fontSize: 24,
    color: '#1a1a1a',
    fontWeight: 400,
    letterSpacing: 0,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function DesignEditor({
  templateId,
  templateName,
  widthMm,
  heightMm,
  initialDesignJson,
  initialDesignId = null,
}: Props) {
  const router = useRouter()

  // ── State ──────────────────────────────────────────────────────────────────
  const [design, setDesign] = useState<DesignJson>(() => {
    const elements = (initialDesignJson?.elements ?? []).map((el) =>
      el.id ? el : { ...el, id: newId() }
    )
    return {
      background: '#ffffff',
      ...initialDesignJson,
      elements,
    }
  })

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  // Tracks the persisted Design row id (null = not yet saved to Design table)
  const [designId, setDesignId] = useState<string | null>(initialDesignId)

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedEl = (design.elements ?? []).find(
    (el) => el.id === selectedId
  ) as TextElement | undefined

  // ── Element helpers ────────────────────────────────────────────────────────
  const updateElement = useCallback(
    (id: string, patch: Partial<TextElement>) => {
      setDesign((prev) => ({
        ...prev,
        elements: (prev.elements ?? []).map((el) =>
          el.id === id ? { ...el, ...patch } : el
        ),
      }))
    },
    []
  )

  const addText = useCallback(() => {
    const el = makeDefaultTextElement()
    setDesign((prev) => ({
      ...prev,
      elements: [...(prev.elements ?? []), el],
    }))
    setSelectedId(el.id)
  }, [])

  const duplicateSelected = useCallback(() => {
    if (!selectedEl) return
    const newEl: TextElement = {
      ...selectedEl,
      id: newId(),
      x: selectedEl.x + 5,
      y: selectedEl.y + 5,
    }
    setDesign((prev) => ({
      ...prev,
      elements: [...(prev.elements ?? []), newEl],
    }))
    setSelectedId(newEl.id)
  }, [selectedEl])

  const deleteSelected = useCallback(() => {
    if (!selectedId) return
    setDesign((prev) => ({
      ...prev,
      elements: (prev.elements ?? []).filter((el) => el.id !== selectedId),
    }))
    setSelectedId(null)
  }, [selectedId])

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaveStatus('saving')
    setSaveError(null)
    try {
      if (!designId) {
        // ── First save: CREATE a new Design row ──
        const res = await fetch('/api/designs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateId, designJson: design }),
        })
        if (!res.ok) {
          const msg = await apiErrorMessage(res, 'Could not save design.')
          setSaveError(msg)
          setSaveStatus('error')
          setTimeout(() => setSaveStatus('idle'), 4000)
          return
        }
        const json = await res.json() as { designId: string }
        setDesignId(json.designId)
        // Update URL with ?design=<id> without triggering a full navigation
        router.replace(
          `/design/${templateId}?design=${json.designId}`,
          { scroll: false }
        )
      } else {
        // ── Subsequent saves: UPDATE the existing Design row ──
        const res = await fetch(`/api/designs/${designId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ designJson: design }),
        })
        if (!res.ok) {
          const msg = await apiErrorMessage(res, 'Could not update design.')
          setSaveError(msg)
          setSaveStatus('error')
          setTimeout(() => setSaveStatus('idle'), 4000)
          return
        }
      }
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch {
      setSaveError('Network error — please try again.')
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 4000)
    }
  }, [design, designId, templateId, router])

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
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

          {/* Design ID debug badge */}
          {designId && (
            <>
              <span className="text-gray-300">/</span>
              <span className="text-xs font-mono text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                Design: {designId.slice(0, 8)}
              </span>
            </>
          )}
        </div>

        {/* Save button + "Verder: gadgets" link */}
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
              {saveStatus === 'saving' && 'Saving…'}
              {saveStatus === 'saved'  && '✓ Opgeslagen'}
              {saveStatus === 'error'  && 'Fout — opnieuw'}
              {saveStatus === 'idle'   && 'Opslaan'}
            </button>
            {saveStatus === 'error' && saveError && (
              <p className="text-xs text-red-600 max-w-xs text-right leading-tight">
                {saveError}
              </p>
            )}
          </div>

          {/* Step 2: navigate to gadgets page — only enabled once design is saved */}
          {designId ? (
            <a
              href={`/design/${templateId}/gadgets?design=${designId}`}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-xl bg-studio-yellow text-studio-black
                         hover:brightness-95 transition duration-200 focus:outline-none focus:ring-2
                         focus:ring-studio-yellow/50 focus:ring-offset-1 whitespace-nowrap"
            >
              Verder naar gadgets
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          ) : (
            <span
              title="Sla het ontwerp eerst op"
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-xl bg-studio-sand/30 text-studio-black/40
                         cursor-not-allowed select-none whitespace-nowrap"
            >
              Verder naar gadgets
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.4">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Canvas area ── */}
        <main className="flex-1 overflow-auto flex flex-col items-center justify-start py-10 px-6 gap-3">
          <div
            className="w-full rounded-2xl overflow-hidden flex items-center justify-center p-8 border border-studio-sand/40 shadow-soft"
            style={{
              maxWidth: 760,
              background: 'repeating-conic-gradient(#e8e8e8 0% 25%, #f4f4f4 0% 50%) 0 0 / 20px 20px',
            }}
          >
            <SvgCanvas
              widthMm={widthMm}
              heightMm={heightMm}
              designJson={design}
              selectedId={selectedId}
              onSelect={setSelectedId}
              maxDisplayWidth={680}
            />
          </div>
          {/* Canvas meta */}
          <div
            className="flex items-center justify-between w-full text-xs text-gray-400 font-mono"
            style={{ maxWidth: 760 }}
          >
            <span>{widthMm} × {heightMm} mm</span>
            <span>
              {Math.round(mmToPx(widthMm))} × {Math.round(mmToPx(heightMm))} px @ 96 dpi
            </span>
          </div>
        </main>

        {/* ── Properties panel ── */}
        <aside className="w-72 shrink-0 bg-white border-l border-studio-sand/40 flex flex-col overflow-y-auto">
          {selectedEl ? (
            <TextPanel
              el={selectedEl}
              onChange={(patch) => updateElement(selectedEl.id, patch)}
              onDuplicate={duplicateSelected}
              onDelete={deleteSelected}
            />
          ) : (
            <EmptyPanel onAddText={addText} />
          )}
        </aside>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function EmptyPanel({ onAddText }: { onAddText: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700">No element selected</p>
        <p className="text-xs text-gray-400 mt-1">Click a text element on the canvas to edit it.</p>
      </div>
      <button
        onClick={onAddText}
        className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium
                   px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add text
      </button>
    </div>
  )
}

function TextPanel({
  el,
  onChange,
  onDuplicate,
  onDelete,
}: {
  el: TextElement
  onChange: (patch: Partial<TextElement>) => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Text</span>
        <span className="text-xs font-mono text-gray-400">{el.id}</span>
      </div>

      <div className="p-4 flex flex-col gap-4">

        {/* Text content */}
        <Field label="Text">
          <textarea
            rows={3}
            value={el.text}
            onChange={(e) => onChange({ text: e.target.value })}
            className={inputCls + ' resize-none font-normal'}
          />
        </Field>

        {/* Font family */}
        <Field label="Font family">
          <select
            value={el.fontFamily}
            onChange={(e) => onChange({ fontFamily: e.target.value })}
            className={inputCls}
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </Field>

        {/* Font size + weight row */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Size (px)">
            <input
              type="number"
              min={6}
              max={400}
              step={1}
              value={el.fontSize}
              onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
              className={inputCls}
            />
          </Field>
          <Field label="Weight">
            <select
              value={el.fontWeight ?? 400}
              onChange={(e) => onChange({ fontWeight: Number(e.target.value) })}
              className={inputCls}
            >
              {[300, 400, 500, 600, 700, 800].map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Letter spacing */}
        <Field label="Letter spacing (px)">
          <input
            type="number"
            min={-10}
            max={50}
            step={0.5}
            value={el.letterSpacing ?? 0}
            onChange={(e) => onChange({ letterSpacing: Number(e.target.value) })}
            className={inputCls}
          />
        </Field>

        {/* Color */}
        <Field label="Color">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={el.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
            />
            <input
              type="text"
              value={el.color}
              maxLength={7}
              onChange={(e) => {
                const v = e.target.value
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange({ color: v })
              }}
              className={inputCls + ' font-mono flex-1'}
            />
          </div>
        </Field>

        {/* Position */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="X (mm)">
            <input
              type="number"
              step={0.5}
              value={el.x}
              onChange={(e) => onChange({ x: Number(e.target.value) })}
              className={inputCls}
            />
          </Field>
          <Field label="Y (mm)">
            <input
              type="number"
              step={0.5}
              value={el.y}
              onChange={(e) => onChange({ y: Number(e.target.value) })}
              className={inputCls}
            />
          </Field>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onDuplicate}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium
                       border border-gray-200 text-gray-600 py-2 rounded-lg hover:bg-gray-50
                       transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Duplicate
          </button>
          <button
            onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium
                       border border-red-200 text-red-500 py-2 rounded-lg hover:bg-red-50
                       transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Micro helpers
// ─────────────────────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  )
}
