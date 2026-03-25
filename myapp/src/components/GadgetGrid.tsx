'use client'

/*
 * Test checklist (GadgetGrid):
 *   [ ] effectivePersonalization.name set → overlay shows name with correct font/color
 *   [ ] previewConfig present → bounding-box overlay respects xPct/yPct/wPct/hPct
 *   [ ] previewConfig absent  → legacy frosted-glass strip, position driven by personalization
 *   [ ] Chip enabled  → frosted-glass background visible
 *   [ ] Chip disabled → plain text overlay, no background
 *   [ ] White text: text-shadow makes it readable on light gradient background
 *   [ ] No name → overlay shows "Vul naam in" in grey
 *   [ ] isOverride true → Personaliseren button shows "Gepersonaliseerd" state
 *   [ ] isOverride false + personalizable → default Personaliseren button shown
 *   [ ] !personalizable → Personaliseren button hidden in all states
 *   [ ] Unselected card: calm layout — image, title, description (2 lines), price, Toevoegen
 *   [ ] Selected card: yellow border + status header + qty control + personalize + remove
 *   [ ] Image URL in emoji field → <img> via ProductThumb
 *   [ ] Emoji → emoji via ProductThumb; missing → 📦 fallback
 *   [ ] "Toevoegen" shows spinner while API call in progress; error shown inline on failure
 *   [ ] "In jouw concept" status appears in header immediately after successful add
 *   [ ] Quantity control: +/- updates localQty; OK button appears when isDirty
 *   [ ] OK button disabled + hint shown when localQty is invalid per config rules
 *   [ ] OK saves and shows "✓ Opgeslagen" for 1.5 s; isDirty resets to false
 *   [ ] OK failure shows inline error below quantity control
 *   [ ] Server-normalized qty reflected in card after successful save
 *   [ ] "Verwijder uit concept" calls handleToggle; toggling state shows "Bezig…"
 */

import { useState, useEffect, type CSSProperties } from 'react'
import ProductThumb from '@/components/ProductThumb'
import {
  getEffectivePersonalization,
  isOverrideActive,
  getNameTextStyle,
  getOverlayPositionClasses,
} from '@/lib/gadget-personalization'
import type { PreviewConfig } from '@/lib/personalization/previewConfig'
import QuantityControl from '@/components/QuantityControl'
import {
  defaultQuantityConfig,
  isValidQuantity,
  getQuantityHint,
} from '@/lib/quantity-config'

// Re-export shared types so existing imports from '@/components/GadgetGrid' keep working.
export type {
  GadgetItem,
  SelectedGadget,
  GadgetPersonalization,
  GadgetFont,
  GadgetColor,
  GadgetPosition,
  GadgetsPayload,
} from '@/lib/gadget-personalization'

import type {
  GadgetItem,
  GadgetVariantOption,
  SelectedGadget,
  GadgetPersonalization,
} from '@/lib/gadget-personalization'

// ─── Result types ─────────────────────────────────────────────────────────────

export interface ToggleResult   { ok: boolean; error?: string }
export interface SaveQtyResult  { ok: boolean; error?: string; normalizedQty?: number }

// ─── Grid props ───────────────────────────────────────────────────────────────

interface Props {
  gadgets:          GadgetItem[]
  selected:         Record<string, SelectedGadget>
  savedQuantities:  Record<string, number>
  /** Async: waits for API; returns ok/error so card can show feedback. */
  onToggle:         (gadget: GadgetItem, variantId?: string) => Promise<ToggleResult>
  onPersonalize:    (gadget: GadgetItem) => void
  /** Called when user confirms a quantity change via the OK button. */
  onSaveQuantity:   (gadgetId: string, qty: number) => Promise<SaveQtyResult>
  /** Called when user changes variant on an already-selected gadget. */
  onVariantChange:  (gadgetId: string, variantId: string) => Promise<void>
  global:           GadgetPersonalization
  overrides:        Record<string, GadgetPersonalization>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFromPrice(cents: number): string {
  return `Vanaf\u00a0€\u202f${Math.floor(cents / 100)}`
}

function scaleCardFontSize(fontSizePx?: number): number {
  return Math.max(10, Math.min(18, (fontSizePx ?? 28) * 0.40))
}

function buildBoxOverlayStyle(
  config:   PreviewConfig,
  position: GadgetPersonalization['position'],
): CSSProperties {
  const { box, align, verticalAlign: cfgVAlign, chip } = config.text
  const vAlign = position ?? cfgVAlign
  return {
    position:       'absolute',
    left:           `${box.xPct}%`,
    top:            `${box.yPct}%`,
    width:          `${box.wPct}%`,
    height:         `${box.hPct}%`,
    display:        'flex',
    flexDirection:  'column',
    alignItems:     align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
    justifyContent: vAlign === 'top' ? 'flex-start' : vAlign === 'bottom' ? 'flex-end' : 'center',
    overflow:       'hidden',
    ...(chip?.enabled ? {
      backgroundColor:      `rgba(255,255,255,${chip.opacity})`,
      backdropFilter:       'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      borderRadius:         `${chip.radius}px`,
      padding:              `${chip.paddingPct}%`,
    } : {}),
  }
}

function buildTextPosStyle(
  textPos:       NonNullable<GadgetPersonalization['textPos']>,
  previewConfig: PreviewConfig | undefined,
): CSSProperties {
  const bnd  = previewConfig?.text.box ?? { xPct: 0, yPct: 0, wPct: 100, hPct: 100 }
  const chip = previewConfig?.text.chip
  const absXPct = bnd.xPct + (textPos.xPct / 100) * bnd.wPct
  const absYPct = bnd.yPct + (textPos.yPct / 100) * bnd.hPct
  return {
    position:  'absolute',
    left:      `${absXPct}%`,
    top:       `${absYPct}%`,
    transform: 'translate(-50%, -50%)',
    maxWidth:  `${Math.min(bnd.wPct * 0.9, 90)}%`,
    ...(chip?.enabled ? {
      backgroundColor:      `rgba(255,255,255,${chip.opacity})`,
      backdropFilter:       'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      borderRadius:         `${chip.radius}px`,
      padding:              `${chip.paddingPct}%`,
    } : {}),
  }
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function defaultVariantId(variants?: GadgetVariantOption[]): string | undefined {
  if (!variants || variants.length === 0) return undefined
  return (variants.find((v) => v.isDefault) ?? variants[0]).id
}

function GadgetCard({
  gadget,
  selected,
  savedVariantId,
  savedQuantity,
  onToggle,
  onPersonalize,
  onSaveQuantity,
  onVariantChange,
  effectivePersonalization,
  isOverride,
}: {
  gadget:                   GadgetItem
  selected:                 boolean
  savedVariantId?:          string
  savedQuantity:            number
  onToggle:                 (variantId?: string) => Promise<ToggleResult>
  onPersonalize:            () => void
  onSaveQuantity:           (qty: number) => Promise<SaveQtyResult>
  onVariantChange:          (variantId: string) => Promise<void>
  effectivePersonalization: GadgetPersonalization
  isOverride:               boolean
}) {
  // ── Local state (all existing logic preserved) ──────────────────────────────
  const [localQty,       setLocalQty]       = useState(savedQuantity)
  const [toggling,       setToggling]       = useState(false)
  const [toggleError,    setToggleError]    = useState<string | null>(null)
  const [qtySaving,      setQtySaving]      = useState(false)
  const [qtyError,       setQtyError]       = useState<string | null>(null)
  const [qtySuccess,     setQtySuccess]     = useState(false)
  const [successQty,     setSuccessQty]     = useState<number | null>(null)
  // ── Variant state ────────────────────────────────────────────────────────────
  const [activeVariantId, setActiveVariantId] = useState<string | undefined>(
    () => savedVariantId ?? defaultVariantId(gadget.variants)
  )

  // Keep variant in sync when savedVariantId changes (e.g. after save)
  useEffect(() => {
    if (savedVariantId) setActiveVariantId(savedVariantId)
  }, [savedVariantId])

  const activeVariant = gadget.variants?.find((v) => v.id === activeVariantId)
  const hasVariants   = gadget.variants && gadget.variants.length > 0
  const useSwatches   = hasVariants && gadget.variants!.some((v) => v.color)

  // Resolved thumbnail — variant > product > emoji
  const thumbValue = activeVariant?.thumbnailImageUrl
    ?? gadget.thumbnailImageUrl
    ?? gadget.emoji

  // Effective price — variant may override
  const displayPriceCents = activeVariant?.priceCents ?? gadget.fromPriceCents

  useEffect(() => { setLocalQty(savedQuantity) }, [savedQuantity])

  const config   = gadget.quantityConfig ?? defaultQuantityConfig()
  const isDirty  = selected && localQty !== savedQuantity
  const qtyValid = isValidQuantity(localQty, config)
  const qtyHint  = getQuantityHint(localQty, config)

  const handleToggle = async () => {
    setToggling(true)
    setToggleError(null)
    const result = await onToggle(activeVariantId)
    setToggling(false)
    if (!result.ok) {
      setToggleError(result.error ?? 'Kon niet opslaan. Probeer opnieuw.')
    } else {
      setQtyError(null)
    }
  }

  const handleVariantChange = async (variantId: string) => {
    setActiveVariantId(variantId)
    if (selected) {
      await onVariantChange(variantId)
    }
  }

  const handleQtyOK = async () => {
    setQtySaving(true)
    setQtyError(null)
    setQtySuccess(false)
    const result = await onSaveQuantity(localQty)
    setQtySaving(false)
    if (result.ok) {
      const finalQty = result.normalizedQty ?? localQty
      if (result.normalizedQty !== undefined) setLocalQty(finalQty)
      setSuccessQty(finalQty)
      setQtySuccess(true)
      setTimeout(() => { setQtySuccess(false); setSuccessQty(null) }, 1500)
    } else {
      setQtyError(result.error ?? 'Kon niet opslaan. Probeer opnieuw.')
    }
  }

  // ── Name overlay helpers (all unchanged) ────────────────────────────────────
  const effectiveName    = effectivePersonalization.name ?? ''
  const cardFontSize     = scaleCardFontSize(effectivePersonalization.fontSizePx)
  const textStyle        = {
    ...(getNameTextStyle(effectivePersonalization) as CSSProperties),
    fontSize: cardFontSize,
  }
  const textPos          = effectivePersonalization.textPos
  const useTextPos       = !!textPos
  const useBoundingBox   = !useTextPos && !!gadget.previewConfig
  const textPosStyle: CSSProperties | undefined = useTextPos
    ? buildTextPosStyle(textPos, gadget.previewConfig)
    : undefined
  const boxStyle: CSSProperties = useBoundingBox
    ? buildBoxOverlayStyle(gadget.previewConfig!, effectivePersonalization.position)
    : {}
  const legacyPositionCls = (useTextPos || useBoundingBox)
    ? ''
    : getOverlayPositionClasses(effectivePersonalization)

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className={[
        'flex flex-col rounded-2xl overflow-hidden border transition-all duration-200',
        selected
          ? 'border-[#E7C46A] shadow-sm ring-1 ring-[#E7C46A]/25'
          : 'border-[#E0D5C5]/70 bg-white hover:border-[#D4C9A8] hover:shadow-sm',
      ].join(' ')}
    >

      {/* ── Selected status header ── */}
      {selected && (
        <div className="flex items-center gap-1.5 px-3.5 py-1.5
                        bg-[#FBF5E0] border-b border-[#E7C46A]/40">
          {/* Checkmark */}
          <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 shrink-0">
            <circle cx="6" cy="6" r="5.5" fill="#B08040" />
            <path d="M3.5 6l1.8 1.8L8.5 4.5" stroke="#FBF5E0" strokeWidth="1.4"
                  strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[11px] font-semibold text-[#8C6D1A] leading-none">
            In jouw concept
          </span>
        </div>
      )}

      {/* ── Product image with name overlay ── */}
      <div className="relative h-28 w-full overflow-hidden">
        <ProductThumb
          value={thumbValue}
          alt={gadget.title}
          className={[
            'h-full w-full text-4xl select-none',
            selected
              ? 'bg-gradient-to-br from-[#FBF5E0] to-[#F0E6C0]'
              : 'bg-gradient-to-br from-[#F5F0E8] to-[#EDE3CC]',
          ].join(' ')}
        />

        {/* Name overlay — textPos > bounding-box > legacy strip (all logic unchanged) */}
        {useTextPos ? (
          <div style={textPosStyle}>
            {effectiveName ? (
              <p style={{ ...textStyle, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                 className="font-semibold leading-tight">
                {effectiveName}
              </p>
            ) : (
              <p className="text-[10px] text-gray-400 leading-tight truncate">Vul naam in</p>
            )}
          </div>
        ) : useBoundingBox ? (
          <div style={boxStyle}>
            {effectiveName ? (
              <p style={{ ...textStyle, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                 className="font-semibold leading-tight">
                {effectiveName}
              </p>
            ) : (
              <p className="text-[10px] text-gray-400 leading-tight truncate">Vul naam in</p>
            )}
          </div>
        ) : (
          <div className={`absolute ${legacyPositionCls} px-2 py-1 bg-white/80 backdrop-blur-sm`}>
            {effectiveName ? (
              <p style={textStyle} className="font-semibold truncate leading-tight">{effectiveName}</p>
            ) : (
              <p className="text-[10px] text-gray-400 truncate leading-tight">Vul naam in</p>
            )}
          </div>
        )}
      </div>

      {/* ── Card body ── */}
      <div
        className={[
          'flex flex-col flex-1 px-3.5 py-3',
          selected ? 'bg-[#FDFAF3]' : 'bg-white',
        ].join(' ')}
      >

        {/* Title */}
        <p className="text-sm font-semibold text-[#2C2416] leading-tight mb-1.5">
          {gadget.title}
        </p>

        {/* Description — always limited to 2 lines */}
        <p className="text-xs text-[#7A6A52] leading-snug line-clamp-2 mb-2.5">
          {gadget.description}
        </p>

        {/* ── Variant picker ── (only when variants exist) */}
        {hasVariants && (
          <div className="mb-2.5">
            {useSwatches ? (
              /* Color swatches */
              <div className="flex flex-wrap gap-1.5">
                {gadget.variants!.map((v) => (
                  <button
                    key={v.id}
                    title={v.name}
                    onClick={() => handleVariantChange(v.id)}
                    className={[
                      'w-5 h-5 rounded-full border-2 transition-all duration-150 shrink-0',
                      activeVariantId === v.id
                        ? 'border-[#B08040] scale-110 shadow-sm'
                        : 'border-transparent hover:border-[#D4C9A8]',
                    ].join(' ')}
                    style={{ backgroundColor: v.color ?? '#ccc' }}
                  />
                ))}
              </div>
            ) : (
              /* Dropdown for non-color variants */
              <select
                value={activeVariantId ?? ''}
                onChange={(e) => handleVariantChange(e.target.value)}
                className="w-full text-xs px-2 py-1 border border-[#E0D5C5] rounded-lg bg-white
                           text-[#2C2416] focus:outline-none focus:ring-1 focus:ring-[#E7C46A]"
              >
                {gadget.variants!.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}{v.sizeLabel ? ` — ${v.sizeLabel}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Stock badge */}
        {gadget.stockQuantity !== undefined && gadget.stockQuantity !== null && (
          <span className={[
            'inline-flex items-center gap-1 self-start px-1.5 py-0.5 rounded-full text-[10px] font-medium mb-2',
            gadget.stockQuantity > 0
              ? 'bg-green-50 text-green-700'
              : 'bg-amber-50 text-amber-700',
          ].join(' ')}>
            <span className={[
              'w-1.5 h-1.5 rounded-full',
              gadget.stockQuantity > 0 ? 'bg-green-500' : 'bg-amber-500',
            ].join(' ')} />
            {gadget.stockQuantity > 0 ? 'Op voorraad' : 'Op bestelling'}
          </span>
        )}

        {/* ════ UNSELECTED STATE ════════════════════════════════════════════════ */}
        {!selected && (
          <div className="flex items-center gap-2 mt-auto">
            {displayPriceCents !== undefined && (
              <p className="text-xs text-[#B5A48A] shrink-0">
                {formatFromPrice(displayPriceCents)}
              </p>
            )}
            <button
              onClick={handleToggle}
              disabled={toggling}
              className="ml-auto rounded-xl bg-[#E7C46A] px-3.5 py-1.5 text-xs font-semibold
                         text-[#2C2416] hover:brightness-95 transition duration-200
                         disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
            >
              {toggling ? '…' : 'Toevoegen'}
            </button>
          </div>
        )}

        {/* Toggle error — unselected */}
        {!selected && toggleError && (
          <p className="text-[11px] text-red-600 leading-snug mt-1.5">{toggleError}</p>
        )}

        {/* ════ SELECTED STATE ══════════════════════════════════════════════════ */}
        {selected && (
          <>
            {/* Price */}
            {displayPriceCents !== undefined && (
              <p className="text-xs text-[#B5A48A] mb-2.5">
                {formatFromPrice(displayPriceCents)}
              </p>
            )}

            {/* Quantity control */}
            <div className="space-y-1.5 mb-3">
              <QuantityControl
                value={localQty}
                config={config}
                onChange={(qty) => {
                  setLocalQty(qty)
                  setQtyError(null)
                  setQtySuccess(false)
                }}
              />

              {/* Validation hint */}
              {!qtyValid && qtyHint && (
                <p className="text-[11px] text-amber-600 leading-snug">{qtyHint}</p>
              )}

              {/* OK button — only when dirty */}
              {isDirty && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleQtyOK}
                    disabled={qtySaving || !qtyValid}
                    className={[
                      'rounded-lg px-2.5 py-0.5 text-xs font-semibold transition duration-200',
                      qtySaving || !qtyValid
                        ? 'bg-[#E0D5C5] text-[#B5A48A] cursor-not-allowed'
                        : 'bg-[#E7C46A] text-[#2C2416] hover:brightness-95',
                    ].join(' ')}
                  >
                    {qtySaving ? 'Opslaan…' : 'OK'}
                  </button>
                  {qtyError && (
                    <span className="text-[11px] text-red-600 leading-snug">{qtyError}</span>
                  )}
                </div>
              )}

              {/* Success flash */}
              {qtySuccess && !isDirty && (
                <p className="text-[11px] text-green-600 leading-snug">
                  ✓ {successQty !== null ? `${successQty}×` : ''} opgeslagen
                </p>
              )}

              {/* Non-dirty error */}
              {qtyError && !isDirty && (
                <p className="text-[11px] text-red-600 leading-snug">{qtyError}</p>
              )}
            </div>

            {/* Personalize — only when product is personalizable */}
            {gadget.personalizable && (
              <button
                onClick={onPersonalize}
                className={[
                  'w-full rounded-xl px-3 py-1.5 text-xs font-medium transition duration-200',
                  'border mb-2',
                  isOverride
                    ? 'border-[#E7C46A]/60 bg-[#E7C46A]/15 text-[#8C6D1A] hover:bg-[#E7C46A]/25'
                    : 'border-[#E0D5C5] bg-white text-[#2C2416] hover:bg-[#F5F0E8]',
                ].join(' ')}
              >
                {isOverride ? '✏ Gepersonaliseerd' : 'Personaliseren'}
              </button>
            )}

            {/* Remove from concept */}
            <button
              onClick={handleToggle}
              disabled={toggling}
              className="text-xs text-[#C4B8A0] hover:text-red-400 transition duration-200
                         text-left leading-snug disabled:opacity-40 mt-auto"
            >
              {toggling ? 'Bezig…' : '× Verwijder uit concept'}
            </button>

            {/* Toggle error — selected */}
            {toggleError && (
              <p className="text-[11px] text-red-600 leading-snug mt-1">{toggleError}</p>
            )}
          </>
        )}

      </div>
    </div>
  )
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

export default function GadgetGrid({
  gadgets,
  selected,
  savedQuantities,
  onToggle,
  onPersonalize,
  onSaveQuantity,
  onVariantChange,
  global,
  overrides,
}: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {gadgets.map((g) => (
        <GadgetCard
          key={g.id}
          gadget={g}
          selected={g.id in selected}
          savedVariantId={selected[g.id]?.variantId}
          savedQuantity={savedQuantities[g.id] ?? 1}
          onToggle={(variantId) => onToggle(g, variantId)}
          onPersonalize={() => onPersonalize(g)}
          onSaveQuantity={(qty) => onSaveQuantity(g.id, qty)}
          onVariantChange={(variantId) => onVariantChange(g.id, variantId)}
          effectivePersonalization={getEffectivePersonalization(g.id, global, overrides)}
          isOverride={isOverrideActive(g.id, overrides)}
        />
      ))}
    </div>
  )
}
