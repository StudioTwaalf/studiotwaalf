'use client'

/*
 * Test checklist (GadgetPersonalizeModal):
 *   [ ] Name field pre-fills from override.name, then global.name, then empty
 *   [ ] Typing a name that differs from global.name → "Terugzetten" link appears
 *   [ ] "Terugzetten" resets local name back to global.name
 *   [ ] Font dropdown changes font of the draggable label in live preview immediately
 *   [ ] Color swatch selection updates text color in live preview immediately
 *   [ ] White text in preview has text-shadow (readable on any background)
 *   [ ] Tekstgrootte slider → live preview font size changes immediately
 *   [ ] Slider shows numeric label (e.g. "28 px")
 *   [ ] Slider "↺" reset button → reverts fontSizePx to global default (or 28)
 *   [ ] Dragging label → onChange fired (RAF-throttled), label follows pointer
 *   [ ] Drag near centre X → vertical snap guide appears
 *   [ ] Drag near centre Y → horizontal snap guide appears
 *   [ ] Drag within threshold → snaps to exactly centre; guides remain visible
 *   [ ] Drag away from centre → guides disappear
 *   [ ] "⊕ Snap naar midden" button → pos snaps to {50,50}, both guides appear
 *   [ ] "↺ Reset positie" → textPos reverts to the position saved in override
 *   [ ] "Reset naar standaard" → onSave(null) called (override removed)
 *   [ ] Annuleer → onClose called, no state changes persisted
 *   [ ] Opslaan → onSave called with {name, font, color, textPos, fontSizePx}
 *   [ ] Clicking backdrop (outside modal) → onClose called
 *   [ ] Desktop: two-column layout (form 260px, preview fills rest, ~460px tall)
 *   [ ] Mobile: preview stacked on top (~340px tall), form below
 *   [ ] Dashed bounds indicator shown in preview (from previewConfig or full area)
 */

import { useState } from 'react'
import ProductThumb from '@/components/ProductThumb'
import DraggableTextOverlay from '@/components/personalization/DraggableTextOverlay'
import type { DragPos, DragBounds } from '@/components/personalization/DraggableTextOverlay'
import {
  type GadgetItem,
  type GadgetPersonalization,
  type GadgetFont,
  type GadgetColor,
  FONT_OPTIONS,
  COLOR_OPTIONS,
  DEFAULT_PERSONALIZATION,
  getNameTextStyle,
} from '@/lib/gadget-personalization'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default font size (px) when none is stored in personalization */
const DEFAULT_FONT_SIZE_PX = 28

const FONT_SIZE_MIN = 10
const FONT_SIZE_MAX = 64

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  gadget:   GadgetItem
  /** The current global (default) personalization */
  global:   GadgetPersonalization
  /** Existing override for this gadget, or null if none */
  override: GadgetPersonalization | null
  /** Called with merged personalization on save, or null to remove override */
  onSave:   (p: GadgetPersonalization | null) => void
  onClose:  () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derives the drag bounds from the gadget's previewConfig, or falls back to
 * a near-full-container area (5% inset on all sides) when no config is set.
 */
function getBoundsFromGadget(gadget: GadgetItem): DragBounds {
  if (gadget.previewConfig) {
    return gadget.previewConfig.text.box
  }
  return { xPct: 5, yPct: 5, wPct: 90, hPct: 90 }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GadgetPersonalizeModal({
  gadget,
  global,
  override,
  onSave,
  onClose,
}: Props) {
  // Initialise from override → global → hardcoded defaults
  const effective = override ?? global

  const [localName,       setLocalName]       = useState(effective.name ?? '')
  const [localFont,       setLocalFont]       = useState<GadgetFont>(
    effective.font  ?? DEFAULT_PERSONALIZATION.font  ?? 'inter',
  )
  const [localColor,      setLocalColor]      = useState<GadgetColor>(
    effective.color ?? DEFAULT_PERSONALIZATION.color ?? 'black',
  )
  const [localFontSizePx, setLocalFontSizePx] = useState<number>(
    effective.fontSizePx ?? DEFAULT_FONT_SIZE_PX,
  )

  // Saved drag position (what was already in the DB before this session)
  // "Reset positie" returns to this, not to {50,50}.
  const savedTextPos: DragPos = effective.textPos ?? { xPct: 50, yPct: 50 }

  const [localTextPos, setLocalTextPos] = useState<DragPos>(savedTextPos)

  // ── Derived values ─────────────────────────────────────────────────────────

  const previewP: GadgetPersonalization = {
    name:  localName.trim() || undefined,
    font:  localFont,
    color: localColor,
  }

  const displayName  = localName.trim() || global.name || null
  const nameIsCustom = localName.trim() !== '' && localName.trim() !== (global.name ?? '')

  const bounds = getBoundsFromGadget(gadget)

  // CSS values for DraggableTextOverlay derived from the shared style helper
  const nameTextStyle = getNameTextStyle(previewP)
  const cssFontFamily = nameTextStyle.fontFamily as string
  const cssColor      = nameTextStyle.color      as string
  const cssTextShadow = nameTextStyle.textShadow as string | undefined

  // Whether the font size differs from the global default (show reset button)
  const globalFontSizePx  = global.fontSizePx ?? DEFAULT_FONT_SIZE_PX
  const fontSizeIsCustom  = localFontSizePx !== globalFontSizePx

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSave() {
    onSave({
      name:       localName.trim() || undefined,
      font:       localFont,
      color:      localColor,
      textPos:    localTextPos,
      fontSizePx: localFontSizePx,
      // position (old strip field) intentionally omitted — textPos replaces it
    })
  }

  /** Revert drag position to what was saved before this modal session */
  function handleResetPos() {
    setLocalTextPos(savedTextPos)
  }

  /** Snap both axes to the exact centre of the bounds */
  function handleSnapToCenter() {
    setLocalTextPos({ xPct: 50, yPct: 50 })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center
                 bg-black/50 px-4 pt-8 pb-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Personaliseer{' '}
            <span className="text-indigo-600">{gadget.title}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluit"
            className="p-1 -mr-1 rounded text-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body: two-column on md+, stacked on mobile ── */}
        {/*
          Grid: form (260px fixed) | preview (fills rest)
          On mobile: single column; preview comes first via order classes.
        */}
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-x-6 gap-y-4 px-6 py-5">

          {/* ── Form column ── */}
          {/* order-last on mobile so the large preview appears first */}
          <div className="order-last md:order-first space-y-5">

            {/* Naam */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Naam op gadget
              </label>
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder={global.name || 'Bijv. Louise'}
                maxLength={30}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                           focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              {nameIsCustom && (
                <button
                  type="button"
                  onClick={() => setLocalName(global.name ?? '')}
                  className="mt-1.5 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
                >
                  ↩ Terugzetten naar &ldquo;{global.name || 'standaard'}&rdquo;
                </button>
              )}
            </div>

            {/* Lettertype */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Lettertype
              </label>
              <select
                value={localFont}
                onChange={(e) => setLocalFont(e.target.value as GadgetFont)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                           focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}
                          style={{ fontFamily: f.fontFamily }}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Kleur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kleur
              </label>
              <div className="flex gap-3 items-center">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    aria-label={c.label}
                    aria-pressed={localColor === c.value}
                    onClick={() => setLocalColor(c.value)}
                    className={[
                      'w-8 h-8 rounded-full border-2 transition-all shrink-0',
                      c.swatch,
                      localColor === c.value
                        ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110'
                        : 'hover:scale-105',
                    ].join(' ')}
                  />
                ))}
                <span className="text-xs text-gray-400 ml-1">
                  {COLOR_OPTIONS.find(c => c.value === localColor)?.label}
                </span>
              </div>
            </div>

            {/* Tekstgrootte */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Tekstgrootte
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs tabular-nums text-gray-600 w-10 text-right">
                    {localFontSizePx} px
                  </span>
                  {fontSizeIsCustom && (
                    <button
                      type="button"
                      title="Reset naar standaard"
                      onClick={() => setLocalFontSizePx(globalFontSizePx)}
                      className="text-[11px] text-gray-400 hover:text-indigo-500 transition-colors leading-none"
                    >
                      ↺
                    </button>
                  )}
                </div>
              </div>
              <input
                type="range"
                min={FONT_SIZE_MIN}
                max={FONT_SIZE_MAX}
                value={localFontSizePx}
                onChange={(e) => setLocalFontSizePx(Number(e.target.value))}
                className="w-full h-1.5 rounded-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-300 mt-0.5 select-none">
                <span>{FONT_SIZE_MIN}</span>
                <span>{FONT_SIZE_MAX}</span>
              </div>
            </div>

            {/* Positie buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSnapToCenter}
                className="flex-1 rounded-md border border-indigo-200 bg-indigo-50
                           px-3 py-1.5 text-xs font-medium text-indigo-700
                           hover:bg-indigo-100 transition-colors"
              >
                ⊕ Snap naar midden
              </button>
              <button
                type="button"
                onClick={handleResetPos}
                className="rounded-md border border-gray-200 bg-white
                           px-3 py-1.5 text-xs font-medium text-gray-500
                           hover:bg-gray-50 transition-colors"
              >
                ↺ Reset
              </button>
            </div>

          </div>

          {/* ── Preview column ── */}
          {/* order-first on mobile so it appears above the form */}
          <div className="order-first md:order-last flex flex-col gap-2">

            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Voorbeeld — sleep de naam
            </p>

            {/*
              Preview box:
                Mobile:  340px tall
                Desktop: 460px tall
              overflow-hidden so the text cannot escape the image area.
            */}
            <div
              className="relative w-full h-[340px] md:h-[460px]
                         rounded-xl overflow-hidden border border-gray-200 shadow-sm
                         bg-gradient-to-br from-indigo-50 to-purple-50 select-none"
            >
              {/* Product image / emoji */}
              <ProductThumb
                value={gadget.emoji}
                alt={gadget.title}
                className="h-full w-full text-6xl sm:text-8xl select-none"
              />

              {/* Draggable text overlay — covers full preview */}
              <DraggableTextOverlay
                text={displayName}
                fontFamily={cssFontFamily}
                color={cssColor}
                textShadow={cssTextShadow}
                fontSize={localFontSizePx}
                pos={localTextPos}
                bounds={bounds}
                snapThresholdPct={2}
                onChange={setLocalTextPos}
                onCommit={setLocalTextPos}
              />
            </div>

            {/* Hint */}
            <p className="text-[10px] text-gray-400 leading-snug">
              Sleep de naam. Dicht bij het midden klikt hij automatisch vast.
            </p>

          </div>

        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 pb-5 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => onSave(null)}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Reset naar standaard
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium
                         text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuleer
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white
                         hover:bg-indigo-700 transition-colors"
            >
              Opslaan
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
