'use client'

/*
 * Test checklist (GadgetsPageClient):
 *   [ ] Global name input pre-fills from initialGlobal.name; live-updates card overlays
 *   [ ] "Personaliseren" on a card opens modal for that gadget
 *   [ ] Modal save stores override in overrides state; card shows "Gepersonaliseerd" badge
 *   [ ] Modal "Reset naar standaard" removes override entry; card reverts to global
 *   [ ] Modal close (Annuleer / backdrop) discards local changes
 *   [ ] "Toevoegen" shows spinner while API call in progress; card shows inline error on failure
 *   [ ] On successful "Toevoegen": card switches to "✓ Geselecteerd" and qty control appears
 *   [ ] On successful "Verwijderen": card reverts to "Toevoegen", qty control disappears
 *   [ ] Restoring saved design: initialSelected + initialGlobal + initialOverrides pre-fill state
 *   [ ] Saving with 0 gadgets selected still works (empty items array)
 *   [ ] Quantity OK: saves and shows "✓ opgeslagen" briefly; disabled + hint when invalid
 *   [ ] Quantity OK failure: shows inline error on card
 *   [ ] normalizedQuantities response updates savedQuantities map
 *   [ ] "Bekijk mijn offerte" button does final save; shows error on failure; navigates on success
 *   [ ] Existing designs without quantity default to getDefaultQuantity
 *   [ ] Category tabs filter the gadget grid; "Alles" shows everything grouped by category
 *   [ ] "Geselecteerd" section appears above grid when ≥1 gadget selected
 *   [ ] Mini card remove button calls handleToggle; quantity OK calls handleSaveQuantity
 *   [ ] Category bar is sticky below the topbar when scrolling
 *   [ ] MockupComposition appears in right panel when templateDesign is available
 *   [ ] Selecting a gadget updates the live MockupComposition preview
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProgressSteps from '@/components/ProgressSteps'
import FilterPillBar from '@/components/filters/FilterPillBar'
import GadgetGrid from '@/components/GadgetGrid'
import type { ToggleResult, SaveQtyResult } from '@/components/GadgetGrid'
import GadgetPersonalizeModal from '@/components/GadgetPersonalizeModal'
import MockupComposition from '@/components/concept/MockupComposition'
import ProductThumb from '@/components/ProductThumb'
import QuantityControl from '@/components/QuantityControl'
import type {
  GadgetItem,
  SelectedGadget,
  GadgetPersonalization,
} from '@/lib/gadget-personalization'
import type { TemplateDesign } from '@/types/template'
import {
  getDefaultQuantity,
  defaultQuantityConfig,
  isValidQuantity,
} from '@/lib/quantity-config'
import { trackEvent } from '@/lib/analytics'
import type { BaseParams } from '@/lib/analytics'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  templateId:        string
  designId:          string
  templateName:      string
  templateDesign:    TemplateDesign | null
  gadgets:           GadgetItem[]
  initialSelected?:  Record<string, SelectedGadget>
  initialGlobal?:    GadgetPersonalization
  initialOverrides?: Record<string, GadgetPersonalization>
  /** Paper ID forwarded from the editor (via ?paper= URL param). */
  paperParam?:       string | null
  /** Journey type derived from the template category — used for funnel events. */
  journeyType:       BaseParams['journey_type']
}

const STEPS = ['Ontwerp', 'Gadgets', 'Concept', 'Offerte']

/** Build initial quantities map from initialSelected (saved) + gadget defaults. */
function buildInitialQuantities(
  gadgets:         GadgetItem[],
  initialSelected: Record<string, SelectedGadget>,
): Record<string, number> {
  const result: Record<string, number> = {}
  for (const g of gadgets) {
    if (g.id in initialSelected) {
      const savedQty = initialSelected[g.id]?.quantity
      result[g.id] = savedQty ?? getDefaultQuantity(g.quantityConfig ?? defaultQuantityConfig())
    }
  }
  return result
}

// ─── SelectedMiniCard ────────────────────────────────────────────────────────
// Compact card shown in the "Geselecteerd" summary section.
// Handles its own local qty state; delegates save/remove up via callbacks.

function SelectedMiniCard({
  gadget,
  savedQty,
  onRemove,
  onSaveQty,
}: {
  gadget:    GadgetItem
  savedQty:  number
  onRemove:  () => Promise<ToggleResult>
  onSaveQty: (qty: number) => Promise<SaveQtyResult>
}) {
  const [localQty,  setLocalQty]  = useState(savedQty)
  const [removing,  setRemoving]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [saveOk,    setSaveOk]    = useState(false)

  // Keep local qty in sync when parent normalises the value
  useEffect(() => { setLocalQty(savedQty) }, [savedQty])

  const config  = gadget.quantityConfig ?? defaultQuantityConfig()
  const isDirty = localQty !== savedQty
  const isValid = isValidQuantity(localQty, config)

  const handleRemove = async () => {
    setRemoving(true)
    await onRemove()
    // component will unmount on success; no need to reset state
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveOk(false)
    const result = await onSaveQty(localQty)
    setSaving(false)
    if (result.ok) {
      if (result.normalizedQty !== undefined) setLocalQty(result.normalizedQty)
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 1500)
    }
  }

  return (
    <div className="flex items-center gap-2.5 bg-[#FAFAF7] rounded-xl border border-[#E0D5C5]/60 px-3 py-2.5 shadow-sm">
      {/* Thumbnail */}
      <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-white border border-[#E0D5C5]/40">
        <ProductThumb
          value={gadget.emoji}
          alt={gadget.title}
          className="w-full h-full text-xl"
        />
      </div>

      {/* Name + quantity */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#2C2416] truncate leading-tight mb-1.5">
          {gadget.title}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <QuantityControl value={localQty} config={config} onChange={setLocalQty} />
          {isDirty && isValid && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-[10px] font-semibold text-[#2C2416] bg-[#E7C46A] rounded-lg
                         px-2 py-0.5 hover:brightness-95 transition disabled:opacity-50"
            >
              {saving ? '…' : 'OK'}
            </button>
          )}
          {saveOk && !isDirty && (
            <span className="text-[10px] text-green-600 font-medium">✓</span>
          )}
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={handleRemove}
        disabled={removing}
        title="Verwijderen"
        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg
                   text-[#C4B8A0] hover:text-red-400 hover:bg-red-50
                   transition disabled:opacity-40"
      >
        {removing
          ? <span className="text-xs">…</span>
          : <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8"
                    strokeLinecap="round" fill="none"/>
            </svg>
        }
      </button>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GadgetsPageClient({
  templateId,
  designId,
  templateName,
  templateDesign,
  gadgets,
  initialSelected,
  initialGlobal,
  initialOverrides,
  paperParam,
  journeyType,
}: Props) {
  const router = useRouter()

  // ── State ───────────────────────────────────────────────────────────────────
  const [selected,        setSelected]       = useState<Record<string, SelectedGadget>>(initialSelected ?? {})
  const [savedQuantities, setSavedQuantities] = useState<Record<string, number>>(
    () => buildInitialQuantities(gadgets, initialSelected ?? {}),
  )
  const [global,         setGlobal]          = useState<GadgetPersonalization>(initialGlobal ?? {})
  const [overrides,      setOverrides]       = useState<Record<string, GadgetPersonalization>>(initialOverrides ?? {})
  const [modalGadgetId,  setModalGadgetId]   = useState<string | null>(null)
  const [saving,         setSaving]          = useState(false)
  const [saveError,      setSaveError]       = useState<string | null>(null)
  const [activeCategory, setActiveCategory]  = useState<string>('Alles')

  // ── Refs — always hold latest state so async callbacks see fresh values ──────
  const selectedRef        = useRef(selected)
  const savedQuantitiesRef = useRef(savedQuantities)
  const globalRef          = useRef(global)
  const overridesRef       = useRef(overrides)
  selectedRef.current        = selected
  savedQuantitiesRef.current = savedQuantities
  globalRef.current          = global
  overridesRef.current       = overrides

  // ── Derived data ─────────────────────────────────────────────────────────────

  /** Fast lookup: product id → GadgetItem. */
  const gadgetMap = useMemo(
    () => new Map(gadgets.map((g) => [g.id, g])),
    [gadgets],
  )

  /**
   * Unique category names in server sort order (first-seen wins).
   * Always starts with "Alles"; appends real category names after.
   */
  const categories = useMemo(() => {
    const seen = new Set<string>()
    for (const g of gadgets) {
      if (g.category) seen.add(g.category)
    }
    return ['Alles', ...Array.from(seen)]
  }, [gadgets])

  /**
   * When "Alles" is active: map of category → gadgets (insertion order preserved).
   * When a specific category is active: null (use filteredGadgets instead).
   */
  const groupedGadgets = useMemo((): Map<string, GadgetItem[]> | null => {
    if (activeCategory !== 'Alles') return null
    const groups = new Map<string, GadgetItem[]>()
    for (const g of gadgets) {
      const cat = g.category ?? 'Overig'
      const arr = groups.get(cat)
      if (arr) arr.push(g)
      else groups.set(cat, [g])
    }
    return groups
  }, [gadgets, activeCategory])

  /** Gadgets shown in single-category view. */
  const filteredGadgets = useMemo(
    () => activeCategory === 'Alles'
      ? gadgets
      : gadgets.filter((g) => g.category === activeCategory),
    [gadgets, activeCategory],
  )

  /** Selected list with fresh dimensions + quantities — fed to MockupComposition. */
  const selectedList = useMemo((): SelectedGadget[] =>
    Object.values(selected).map((s) => ({
      ...s,
      quantity:   savedQuantities[s.id] ?? s.quantity ?? 1,
      dimensions: gadgetMap.get(s.id)?.dimensions,
    })),
    [selected, savedQuantities, gadgetMap],
  )

  const selectedCount  = Object.keys(selected).length
  const conceptPageUrl = `/design/${templateId}/concept?design=${designId}${paperParam ? `&paper=${paperParam}` : ''}`

  // ── Core save ───────────────────────────────────────────────────────────────
  const saveAll = useCallback(async (
    sel:  Record<string, SelectedGadget>,
    qtys: Record<string, number>,
  ): Promise<{ ok: boolean; error?: string; normalizedQuantities?: Record<string, number> }> => {
    const items: SelectedGadget[] = Object.values(sel).map((g) => ({
      ...g,
      quantity: qtys[g.id] ?? 1,
    }))
    try {
      const res = await fetch('/api/design/gadgets', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          designId,
          items,
          global:    globalRef.current,
          overrides: overridesRef.current,
        }),
      })
      if (!res.ok) {
        let errMsg = 'Opslaan mislukt.'
        try {
          const body = await res.json() as { error?: string }
          errMsg = body.error ?? errMsg
        } catch { /* ignore */ }
        return { ok: false, error: errMsg }
      }
      const data = await res.json() as { ok: boolean; normalizedQuantities?: Record<string, number> }
      return { ok: true, normalizedQuantities: data.normalizedQuantities }
    } catch {
      return { ok: false, error: 'Netwerkfout. Probeer opnieuw.' }
    }
  }, [designId])

  // ── Toggle gadget ───────────────────────────────────────────────────────────
  const handleToggle = useCallback(async (gadget: GadgetItem, variantId?: string): Promise<ToggleResult> => {
    const isRemoving = gadget.id in selectedRef.current

    let nextSelected:   Record<string, SelectedGadget>
    let nextQuantities: Record<string, number>

    if (isRemoving) {
      const { [gadget.id]: _r, ...restSel } = selectedRef.current
      nextSelected = restSel
      const { [gadget.id]: _q, ...restQtys } = savedQuantitiesRef.current
      nextQuantities = restQtys
    } else {
      const defaultQty = getDefaultQuantity(gadget.quantityConfig ?? defaultQuantityConfig())
      // Resolve active variant (if any)
      const variant = variantId
        ? gadget.variants?.find((v) => v.id === variantId)
        : gadget.variants?.find((v) => v.isDefault) ?? gadget.variants?.[0]
      // Resolve emoji: variant mockup > product mockup > product emoji
      const emoji = variant?.mockupImageUrl ?? gadget.mockupImageUrl ?? gadget.emoji
      // Resolve dimensions: variant dims override product dims
      const dims = gadget.dimensions
      const dimensions = variant
        ? {
            widthMm:      variant.widthMm      ?? dims?.widthMm      ?? 0,
            heightMm:     variant.heightMm     ?? dims?.heightMm     ?? 0,
            depthMm:      variant.depthMm      ?? dims?.depthMm,
            mockupScale:  variant.mockupScale  ?? dims?.mockupScale,
            visualPadding: variant.visualPadding ?? dims?.visualPadding,
          }
        : dims
      // Resolve price: variant > parent
      const priceCents = variant?.priceCents ?? gadget.fromPriceCents
      nextSelected = {
        ...selectedRef.current,
        [gadget.id]: {
          id:               gadget.id,
          name:             gadget.title,
          isPersonalizable: gadget.personalizable,
          priceCents,
          emoji,
          dimensions,
          ...(variant ? { variantId: variant.id, variantLabel: variant.name ?? undefined } : {}),
        },
      }
      nextQuantities = { ...savedQuantitiesRef.current, [gadget.id]: defaultQty }
    }

    const result = await saveAll(nextSelected, nextQuantities)

    if (result.ok) {
      setSelected(nextSelected)
      setSavedQuantities(result.normalizedQuantities
        ? { ...nextQuantities, ...result.normalizedQuantities }
        : nextQuantities,
      )
      if (isRemoving) {
        trackEvent({
          event:             'remove_gadget',
          flow_step:         'gadgets',
          session_design_id: designId,
          template_id:       templateId,
          journey_type:      journeyType,
          gadget_id:         gadget.id,
        })
      } else {
        trackEvent({
          event:             'add_gadget',
          flow_step:         'gadgets',
          session_design_id: designId,
          template_id:       templateId,
          journey_type:      journeyType,
          gadget_id:         gadget.id,
          gadget_category:   gadget.category ?? 'overig',
        })
      }
    }

    return result
  }, [saveAll, designId, templateId, journeyType])

  // ── Save quantity ───────────────────────────────────────────────────────────
  const handleSaveQuantity = useCallback(async (
    gadgetId: string,
    qty:      number,
  ): Promise<SaveQtyResult> => {
    const nextQuantities = { ...savedQuantitiesRef.current, [gadgetId]: qty }
    const result = await saveAll(selectedRef.current, nextQuantities)

    if (result.ok) {
      setSavedQuantities(result.normalizedQuantities
        ? { ...nextQuantities, ...result.normalizedQuantities }
        : nextQuantities,
      )
      return { ok: true, normalizedQty: result.normalizedQuantities?.[gadgetId] }
    }

    return { ok: false, error: result.error }
  }, [saveAll])

  // ── Variant change (post-selection) ────────────────────────────────────────
  const handleVariantChange = useCallback(async (gadgetId: string, variantId: string) => {
    const gadget  = gadgets.find((g) => g.id === gadgetId)
    const variant = gadget?.variants?.find((v) => v.id === variantId)
    if (!gadget || !variant) return

    const emoji = variant.mockupImageUrl ?? gadget.mockupImageUrl ?? gadget.emoji
    const dims  = gadget.dimensions
    const dimensions = {
      widthMm:       variant.widthMm      ?? dims?.widthMm      ?? 0,
      heightMm:      variant.heightMm     ?? dims?.heightMm     ?? 0,
      depthMm:       variant.depthMm      ?? dims?.depthMm,
      mockupScale:   variant.mockupScale  ?? dims?.mockupScale,
      visualPadding: variant.visualPadding ?? dims?.visualPadding,
    }
    const priceCents = variant.priceCents ?? gadget.fromPriceCents

    const nextSelected = {
      ...selectedRef.current,
      [gadgetId]: {
        ...selectedRef.current[gadgetId],
        emoji,
        dimensions,
        priceCents,
        variantId:    variant.id,
        variantLabel: variant.name ?? undefined,
      },
    }

    await saveAll(nextSelected, savedQuantitiesRef.current)
    setSelected(nextSelected)
  }, [gadgets, saveAll])

  // ── Modal ───────────────────────────────────────────────────────────────────
  const handlePersonalize = useCallback((gadget: GadgetItem) => {
    setModalGadgetId(gadget.id)
  }, [])

  const handleModalSave = useCallback(
    (personalization: GadgetPersonalization | null) => {
      if (!modalGadgetId) return
      setOverrides((prev) => {
        if (personalization === null) {
          const next = { ...prev }
          delete next[modalGadgetId]
          return next
        }
        return { ...prev, [modalGadgetId]: personalization }
      })
      setModalGadgetId(null)
    },
    [modalGadgetId],
  )

  // ── Final navigate ──────────────────────────────────────────────────────────
  const handleContinue = useCallback(async () => {
    setSaving(true)
    setSaveError(null)
    const result = await saveAll(selectedRef.current, savedQuantitiesRef.current)
    setSaving(false)
    if (!result.ok) {
      setSaveError(result.error ?? 'Kon gadgets niet opslaan.')
      return
    }
    // GA4: gadgets step completed — user moves on to the concept preview
    trackEvent({
      event:             'diy_step_completed',
      step:              'gadgets',
      flow_step:         'gadgets',
      session_design_id: designId,
      template_id:       templateId,
      journey_type:      journeyType,
    })
    router.push(conceptPageUrl)
  }, [saveAll, conceptPageUrl, router, designId, templateId, journeyType])

  const modalGadget = gadgets.find((g) => g.id === modalGadgetId) ?? null

  // ── Shared GadgetGrid props ─────────────────────────────────────────────────
  const gridProps = {
    selected,
    savedQuantities,
    onToggle:        handleToggle,
    onPersonalize:   handlePersonalize,
    onSaveQuantity:  handleSaveQuantity,
    onVariantChange: handleVariantChange,
    global,
    overrides,
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F0E8]">

      {/* ── Topbar ── */}
      <header className="flex items-center justify-between bg-white border-b border-[#E0D5C5]/60
                         px-4 h-12 shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <a href="/templates"
             className="text-sm text-[#B5A48A] hover:text-[#2C2416] transition-colors shrink-0">
            ← Templates
          </a>
          <span className="text-[#E0D5C5]">/</span>
          <a href={`/design/${templateId}?design=${designId}`}
             className="text-sm text-[#B5A48A] hover:text-[#2C2416] transition-colors truncate max-w-[140px]">
            {templateName}
          </a>
          <span className="text-[#E0D5C5]">/</span>
          <span className="text-sm font-medium text-[#2C2416]">Gadgets</span>
        </div>

        <div className="hidden sm:block">
          <ProgressSteps steps={STEPS} currentIndex={1} />
        </div>

        <span className="hidden md:inline-block text-xs font-mono text-[#C4B8A0] bg-[#F5F0E8]
                         border border-[#E0D5C5] px-2 py-0.5 rounded ml-3 shrink-0">
          {designId.slice(0, 8)}
        </span>
      </header>

      {/* ── Mobile progress ── */}
      <div className="sm:hidden px-4 pt-3 pb-0">
        <ProgressSteps steps={STEPS} currentIndex={1} />
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-3rem)]">

        {/* ══ LEFT COLUMN ═════════════════════════════════════════════════════ */}
        <div className="flex-1 min-w-0">

          {/* ─ Page header + name input ─ */}
          <div className="px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-5">
            <h1 className="text-xl font-bold text-[#2C2416]">
              Gadgets &amp; geboortesnoep
            </h1>
            <p className="text-sm text-[#7A6A52] mt-1">
              Optioneel — kies wat je wil toevoegen en personaliseer met de babynaam.
            </p>

            {/* Global name input */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1 sm:max-w-xs">
                <label htmlFor="gadget-name"
                       className="block text-[11px] font-semibold text-[#7A6A52] uppercase tracking-wide mb-1.5">
                  Naam op gadgets
                  <span className="ml-1.5 font-normal normal-case text-[#C4B8A0]">(optioneel)</span>
                </label>
                <input
                  id="gadget-name"
                  type="text"
                  value={global.name ?? ''}
                  onChange={(e) => setGlobal((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Bijv. Louise"
                  maxLength={30}
                  className="block w-full rounded-xl border border-[#E0D5C5] bg-white px-3 py-2 text-sm
                             text-[#2C2416] placeholder-[#C4B8A0]
                             focus:border-[#E7C46A] focus:ring-2 focus:ring-[#E7C46A]/30 outline-none"
                />
              </div>
              <p className="text-xs text-[#C4B8A0] pb-0.5 hidden sm:block">
                Standaard voor alle gadgets — aanpasbaar per product.
              </p>
            </div>
          </div>

          {/* ─ Sticky category filter bar ─ */}
          <div className="sticky top-12 z-10 bg-[#F5F0E8]/95 backdrop-blur-sm
                          border-b border-[#E0D5C5]/60 px-4 sm:px-6 lg:px-8 py-2.5">
            <FilterPillBar
              options={categories.filter((c) => c !== 'Alles').map((c) => ({ value: c, label: c }))}
              value={activeCategory === 'Alles' ? '' : activeCategory}
              onChange={(v) => setActiveCategory(v || 'Alles')}
              allLabel="Alles"
            />
          </div>

          {/* ─ Content area ─ */}
          <div className="px-4 sm:px-6 lg:px-8 py-5">

            {/* ── Selected gadgets summary ── */}
            {selectedCount > 0 && (
              <section className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-[11px] font-semibold text-[#7A6A52] uppercase tracking-wider shrink-0">
                    Geselecteerd ({selectedCount})
                  </h2>
                  <div className="flex-1 h-px bg-[#E0D5C5]/60" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {Object.values(selected).map((s) => {
                    const g = gadgetMap.get(s.id)
                    if (!g) return null
                    return (
                      <SelectedMiniCard
                        key={s.id}
                        gadget={g}
                        savedQty={savedQuantities[s.id] ?? 1}
                        onRemove={() => handleToggle(g)}
                        onSaveQty={(qty) => handleSaveQuantity(s.id, qty)}
                      />
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── Mobile mockup preview (when gadgets selected + template available) ── */}
            {selectedCount > 0 && templateDesign && (
              <div className="lg:hidden mb-6 rounded-2xl overflow-hidden shadow-sm
                              border border-[#E0D5C5]/60">
                <div className="bg-white px-4 pt-3 pb-1">
                  <p className="text-[10px] font-semibold text-[#C4B8A0] uppercase tracking-wide">
                    Jouw concept
                  </p>
                </div>
                <MockupComposition
                  templateDesign={templateDesign}
                  gadgets={selectedList}
                  paperId={paperParam ?? null}
                />
              </div>
            )}

            {/* ── Final-save error ── */}
            {saveError && (
              <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                <p className="font-medium">{saveError}</p>
                <p className="mt-1 text-red-600">
                  Je kan toch{' '}
                  <a href={conceptPageUrl} className="underline hover:text-red-800 font-medium">
                    verdergaan naar het concept
                  </a>
                  , maar je gadgetkeuze wordt mogelijk niet bewaard.
                </p>
              </div>
            )}

            {/* ── Gadget grid — grouped ("Alles") or filtered (specific category) ── */}
            {groupedGadgets !== null ? (
              // ── Alles: one section per category ──────────────────────────────
              Array.from(groupedGadgets.entries()).map(([cat, items]) => (
                <section key={cat} className="mb-8">
                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xs font-semibold text-[#7A6A52] uppercase tracking-wider shrink-0">
                      {cat}
                    </h2>
                    <div className="flex-1 h-px bg-[#E0D5C5]/60" />
                    <span className="text-[11px] text-[#C4B8A0] shrink-0 tabular-nums">
                      {items.length}
                    </span>
                  </div>
                  <GadgetGrid gadgets={items} {...gridProps} />
                </section>
              ))
            ) : (
              // ── Single category view ──────────────────────────────────────────
              <GadgetGrid gadgets={filteredGadgets} {...gridProps} />
            )}

          </div>

          {/* ─ Mobile bottom nav ─ */}
          <div className="lg:hidden px-4 sm:px-6 pb-8 pt-2">
            <div className="flex items-center justify-between gap-4 border-t border-[#E0D5C5]/60 pt-6">
              <Link
                href={`/design/${templateId}?design=${designId}`}
                className="rounded-xl border border-[#E0D5C5] bg-white px-4 py-2.5 text-sm
                           font-medium text-[#2C2416] hover:bg-[#F5F0E8] transition"
              >
                ← Ontwerp
              </Link>
              <button
                onClick={handleContinue}
                disabled={saving}
                className="rounded-xl bg-[#E7C46A] px-6 py-2.5 text-sm font-semibold text-[#2C2416]
                           hover:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? 'Opslaan…' : 'Bekijk jouw concept →'}
              </button>
            </div>
          </div>

        </div>

        {/* ══ RIGHT COLUMN — sticky concept panel (desktop only) ══════════════ */}
        <aside className="hidden lg:flex flex-col w-[340px] xl:w-[380px] shrink-0
                          border-l border-[#E0D5C5]/60 bg-white
                          sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto">

          <div className="flex-1 p-6 flex flex-col gap-5">

            {/* Live preview */}
            <div>
              <p className="text-[10px] font-semibold text-[#C4B8A0] uppercase tracking-wide mb-3">
                Live preview
              </p>
              {templateDesign ? (
                <div className="rounded-2xl overflow-hidden">
                  <MockupComposition
                    templateDesign={templateDesign}
                    gadgets={selectedList}
                    paperId={paperParam ?? null}
                  />
                </div>
              ) : (
                <div className="rounded-2xl bg-[#F5F0E8] border border-[#E0D5C5]/60 aspect-[4/3]
                               flex items-center justify-center">
                  <p className="text-xs text-[#C4B8A0] text-center px-4">
                    Preview niet beschikbaar
                  </p>
                </div>
              )}
            </div>

            {/* Concept summary */}
            <div>
              <p className="text-[10px] font-semibold text-[#C4B8A0] uppercase tracking-wide mb-2">
                Jouw selectie
              </p>
              {selectedCount === 0 ? (
                <p className="text-sm text-[#C4B8A0] italic">Nog niets gekozen.</p>
              ) : (
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2.5 text-sm text-[#2C2416]">
                    <span className="text-base leading-none">🃏</span>
                    <span className="font-medium truncate">{templateName}</span>
                  </li>
                  {Object.values(selected).map((s) => {
                    const qty    = savedQuantities[s.id] ?? 1
                    const gadget = gadgetMap.get(s.id)
                    const isEmoji = gadget?.emoji &&
                      !gadget.emoji.startsWith('/') &&
                      !gadget.emoji.startsWith('http')
                    return (
                      <li key={s.id} className="flex items-center gap-2.5 text-sm text-[#2C2416]">
                        <span className="text-base leading-none shrink-0">
                          {isEmoji ? gadget!.emoji : '📦'}
                        </span>
                        <span className="truncate flex-1">{s.name}</span>
                        {qty > 1 && (
                          <span className="shrink-0 text-xs text-[#B5A48A] font-medium tabular-nums">
                            ×{qty}
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

          </div>

          {/* CTA pinned to bottom */}
          <div className="p-5 border-t border-[#E0D5C5]/60 space-y-3">
            <button
              onClick={handleContinue}
              disabled={saving}
              className="w-full rounded-xl bg-[#E7C46A] px-4 py-3 text-sm font-semibold text-[#2C2416]
                         hover:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                            stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Opslaan…
                </>
              ) : (
                'Bekijk jouw concept →'
              )}
            </button>
            <Link
              href={`/design/${templateId}?design=${designId}`}
              className="block w-full text-center rounded-xl border border-[#E0D5C5] bg-white
                         px-4 py-2.5 text-sm font-medium text-[#7A6A52]
                         hover:bg-[#F5F0E8] hover:text-[#2C2416] transition"
            >
              ← Terug naar ontwerp
            </Link>
            <p className="text-center text-xs text-[#C4B8A0]">
              Vrijblijvend — je kan altijd aanpassen.
            </p>
          </div>

        </aside>

      </div>

      {/* ── Personalise modal ── */}
      {modalGadget && (
        <GadgetPersonalizeModal
          gadget={modalGadget}
          global={global}
          override={overrides[modalGadget.id] ?? null}
          onSave={handleModalSave}
          onClose={() => setModalGadgetId(null)}
        />
      )}

    </div>
  )
}
