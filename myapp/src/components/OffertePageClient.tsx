'use client'

/*
 * Test checklist (OffertePageClient):
 *   [ ] Gadget with personalization.name → badge + "Naam: …" row show name
 *   [ ] Gadget with personalization.font/color → badge text uses correct font + color
 *   [ ] Gadget with only personalizedText (v1 save) → name still shown (fallback chain)
 *   [ ] Gadget with neither field + isPersonalizable → amber "Nog geen naam ingevuld"
 *   [ ] Gadget with neither field + !isPersonalizable → nothing (no amber warning)
 *   [ ] Empty gadgets list → "nog geen gadgets" message
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import ProgressSteps from '@/components/ProgressSteps'
import ProductThumb from '@/components/ProductThumb'
import { getNameTextStyle } from '@/lib/gadget-personalization'
import type { SelectedGadget } from '@/lib/gadget-personalization'
import type { PreviewConfig } from '@/lib/personalization/previewConfig'
import { trackEvent } from '@/lib/analytics'
import type { BaseParams } from '@/lib/analytics'

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuoteMeta {
  expectedDate?: string
  notes?: string
}

interface Props {
  templateId:  string
  designId:    string
  templateName: string
  designName:  string | null
  gadgets:     SelectedGadget[]
  quoteMeta:   QuoteMeta | null
  /** Journey type derived from the template category — used for funnel events. */
  journeyType: BaseParams['journey_type']
}

const STEPS = ['Ontwerp', 'Gadgets', 'Jouw concept', 'Offerte']
const CONTACT_HREF = 'mailto:hello@studiotwaalf.be?subject=Afspraak%20gadgets%20Studio%20Twaalf'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  return `€\u202f${(cents / 100).toFixed(2).replace('.', ',')}`
}

async function apiErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const text = await res.text()
    const json = JSON.parse(text) as { error?: string; detail?: string }
    const base   = json.error ?? fallback
    const detail = json.detail ? ` (${json.detail})` : ''
    return `${base}${detail}`
  } catch {
    return fallback
  }
}

// ─── Mini gadget preview ──────────────────────────────────────────────────────

function buildMiniBoxStyle(
  config:   PreviewConfig,
  position: 'top' | 'middle' | 'bottom' | undefined,
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

/**
 * Builds the inline style for a center-point (textPos) overlay at mini scale.
 * Mirrors the logic in GadgetGrid.tsx `buildTextPosStyle`.
 */
function buildMiniTextPosStyle(
  textPos:       { xPct: number; yPct: number },
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

/**
 * Scales fontSizePx down to fit the 56-px-tall mini thumbnail.
 * Factor 0.30 maps the default 28 px → 8.4 px, matching the previous text-[8px].
 * Clamped to [7, 13] so names remain legible.
 */
function scaleMiniFont(fontSizePx?: number): number {
  return Math.max(7, Math.min(13, (fontSizePx ?? 28) * 0.30))
}

function GadgetMiniPreview({ gadget }: { gadget: SelectedGadget }) {
  // Effective personalization is already merged server-side; fall back to legacy field
  const p         = gadget.personalization ?? {}
  const naam      = p.name ?? gadget.personalizedText ?? null
  const textPos   = p.textPos
  const miniFontSize = scaleMiniFont(p.fontSizePx)

  const textStyle = naam
    ? ({
        ...(getNameTextStyle(p) as CSSProperties),
        fontSize: miniFontSize,
      })
    : undefined

  // Overlay priority: textPos > bounding-box (previewConfig) > legacy badge
  const useTextPos     = !!textPos
  const useBoundingBox = !useTextPos && !!gadget.previewConfig

  // overflow-hidden when using absolute overlays; visible for legacy badge
  const overflow = (useTextPos || useBoundingBox) ? 'overflow-hidden' : 'overflow-visible'

  return (
    <div className={`relative w-14 h-14 shrink-0 ${overflow}`}>
      <ProductThumb
        value={gadget.emoji}
        alt={gadget.name}
        className="h-full w-full text-2xl select-none rounded-lg
                   bg-gradient-to-br from-indigo-50 to-purple-50 border border-gray-200"
      />

      {naam && useTextPos && (
        // Center-point overlay — mirrors GadgetGrid buildTextPosStyle at mini scale
        <div style={buildMiniTextPosStyle(textPos, gadget.previewConfig)}>
          <span
            style={{ ...textStyle, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            className="font-semibold leading-tight"
          >
            {naam}
          </span>
        </div>
      )}

      {naam && useBoundingBox && (
        // Bounding-box overlay — mirrors GadgetCard logic at mini scale
        <div style={buildMiniBoxStyle(gadget.previewConfig!, p.position)}>
          <span
            style={{ ...textStyle, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            className="font-semibold leading-tight"
          >
            {naam}
          </span>
        </div>
      )}

      {naam && !useTextPos && !useBoundingBox && (
        // Legacy: floating badge below the thumbnail
        <span
          style={textStyle}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10
                     bg-indigo-600 text-[9px] font-medium
                     px-1.5 py-0.5 rounded-full whitespace-nowrap max-w-[80px] truncate"
        >
          {naam}
        </span>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OffertePageClient({
  templateId,
  designId,
  templateName,
  designName,
  gadgets,
  quoteMeta,
  journeyType,
}: Props) {
  const [expectedDate, setExpectedDate] = useState(quoteMeta?.expectedDate ?? '')
  const [notes, setNotes] = useState(quoteMeta?.notes ?? '')
  const [metaSaving, setMetaSaving] = useState(false)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [metaSaved, setMetaSaved] = useState(false)
  const [showBestellenModal, setShowBestellenModal] = useState(false)

  const totalCents = gadgets.reduce((sum, g) => sum + (g.priceCents ?? 0) * (g.quantity ?? 1), 0)
  const [downloading,          setDownloading]          = useState(false)
  const [downloadError,        setDownloadError]        = useState<string | null>(null)
  const [downloadingGadgets,   setDownloadingGadgets]   = useState(false)
  const [gadgetsDownloadError, setGadgetsDownloadError] = useState<string | null>(null)

  // ── Offer request state ────────────────────────────────────────────────────
  const [offerLoading,      setOfferLoading]      = useState(false)
  const [offerError,        setOfferError]        = useState<string | null>(null)
  const [offerSuccessId,    setOfferSuccessId]    = useState<string | null>(null)

  // ── Analytics: quote_request_started — fires once on page mount ───────────
  // Distinct from start_quote (which fires on the concept page BEFORE navigation).
  // This confirms the user actually arrived on the offerte form — the gap between
  // start_quote and quote_request_started reveals drop-off between clicking the
  // CTA and the page successfully loading.
  const quoteStartedFiredRef = useRef(false)
  useEffect(() => {
    if (quoteStartedFiredRef.current) return
    quoteStartedFiredRef.current = true
    trackEvent({
      event:             'quote_request_started',
      session_design_id: designId,
      template_id:       templateId,
      journey_type:      journeyType,
      has_gadgets:       gadgets.length > 0,
    })
  }, [designId, templateId, journeyType, gadgets.length])

  // ── Save quote meta ────────────────────────────────────────────────────────

  const saveMeta = useCallback(async () => {
    setMetaSaving(true)
    setMetaError(null)
    setMetaSaved(false)
    try {
      const res = await fetch(`/api/designs/${designId}/quote-meta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedDate: expectedDate || undefined,
          notes: notes || undefined,
        }),
      })
      if (!res.ok) {
        setMetaError(await apiErrorMessage(res, 'Kon gegevens niet opslaan.'))
        return
      }
      setMetaSaved(true)
      setTimeout(() => setMetaSaved(false), 3000)
    } catch {
      setMetaError('Netwerkfout. Probeer opnieuw.')
    } finally {
      setMetaSaving(false)
    }
  }, [designId, expectedDate, notes])

  // ── PDF downloads ──────────────────────────────────────────────────────────

  /**
   * Downloads a PDF from an authenticated API endpoint.
   * Uses fetch() so the session cookie is sent automatically and popup
   * blockers can never interfere (unlike window.open()).
   */
  async function fetchPdf(url: string, filename: string): Promise<void> {
    const res = await fetch(url)
    if (!res.ok) {
      let msg = `Download mislukt (HTTP ${res.status}).`
      try {
        const body = await res.json() as { error?: string }
        if (body.error) msg = body.error
      } catch { /* ignore parse errors */ }
      throw new Error(msg)
    }
    const blob = await res.blob()
    const href = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = href
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(href)
  }

  const handleDownload = useCallback(async () => {
    setDownloading(true)
    setDownloadError(null)
    try {
      await fetchPdf(
        `/api/designs/${designId}/quote-pdf`,
        `offerte-${designId.slice(0, 8)}.pdf`,
      )
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download mislukt.')
    } finally {
      setDownloading(false)
    }
  }, [designId])

  const handleGadgetsDownload = useCallback(async () => {
    setDownloadingGadgets(true)
    setGadgetsDownloadError(null)
    try {
      await fetchPdf(
        `/api/designs/${designId}/gadgets-pdf`,
        `gadgets-preview-${designId.slice(0, 8)}.pdf`,
      )
    } catch (err) {
      setGadgetsDownloadError(err instanceof Error ? err.message : 'Download mislukt.')
    } finally {
      setDownloadingGadgets(false)
    }
  }, [designId])

  // ── Submit offer request ───────────────────────────────────────────────────

  const handleOfferRequest = useCallback(async () => {
    setOfferLoading(true)
    setOfferError(null)
    setOfferSuccessId(null)
    const payload = {
      templateId,
      designId,
      expectedDueDate: expectedDate || undefined,
      notes:           notes        || undefined,
    }
    console.log('[offer-request] sending payload:', payload)
    try {
      const res = await fetch('/api/offer-requests', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      if (!res.ok) {
        const errMsg = await apiErrorMessage(res, 'Aanvraag mislukt. Probeer opnieuw.')
        console.error('[offer-request] server error:', res.status, errMsg)
        setOfferError(errMsg)
        return
      }
      const data = await res.json() as { id: string }
      setOfferSuccessId(data.id)
      trackEvent({
        event:                'submit_quote',
        flow_step:            'quote',
        session_design_id:    designId,
        template_id:          templateId,
        journey_type:         journeyType,
        concept_item_count:   gadgets.length,
        quote_value_estimate: totalCents > 0 ? totalCents / 100 : undefined,
      })
    } catch (err) {
      console.error('[offer-request] network error:', err)
      setOfferError('Netwerkfout. Controleer je verbinding en probeer opnieuw.')
    } finally {
      setOfferLoading(false)
    }
  }, [designId, expectedDate, notes])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-studio-beige">

      {/* ── Topbar ── */}
      <header className="flex items-center justify-between bg-white border-b border-studio-sand/40
                         px-4 h-12 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0 text-sm">
          <a href="/templates"
             className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
            ← Templates
          </a>
          <span className="text-gray-300">/</span>
          <a href={`/design/${templateId}?design=${designId}`}
             className="text-gray-400 hover:text-gray-600 transition-colors truncate max-w-[120px]">
            {templateName}
          </a>
          <span className="text-gray-300">/</span>
          <a href={`/design/${templateId}/gadgets?design=${designId}`}
             className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
            Gadgets
          </a>
          <span className="text-gray-300">/</span>
          <a href={`/design/${templateId}/concept?design=${designId}`}
             className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
            Concept
          </a>
          <span className="text-gray-300">/</span>
          <span className="font-medium text-gray-800 shrink-0">Offerte</span>
        </div>

        <div className="hidden sm:block">
          <ProgressSteps steps={STEPS} currentIndex={3} />
        </div>

        <span className="hidden md:inline-block text-xs font-mono text-gray-400 bg-gray-50
                         border border-gray-200 px-2 py-0.5 rounded ml-3 shrink-0">
          {designId.slice(0, 8)}
        </span>
      </header>

      {/* ── Content ── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Mobile progress */}
        <div className="sm:hidden">
          <ProgressSteps steps={STEPS} currentIndex={3} />
        </div>

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jouw offerte</h1>
          <p className="text-sm text-gray-500 mt-1">
            Een overzicht van je keuzes. Je bent nergens toe verplicht.
          </p>
        </div>

        {/* ── Summary card ── */}
        <section className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Samenvatting
            </h2>
            <dl className="space-y-1.5 text-sm">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-gray-500">Template</dt>
                <dd className="font-medium text-gray-900">{templateName}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-gray-500">Ontwerp</dt>
                <dd className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{designName ?? 'Zonder naam'}</span>
                  <span className="font-mono text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    {designId.slice(0, 8)}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ── Gadgets list ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Geselecteerde gadgets
          </h2>

          {gadgets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-studio-sand/40 shadow-soft px-5 py-8 text-center">
              <p className="text-sm text-gray-500">
                Je hebt nog geen gadgets gekozen — je kan dit overslaan.
              </p>
              <a
                href={`/design/${templateId}/concept?design=${designId}`}
                className="mt-3 inline-block text-sm text-indigo-600 hover:underline"
              >
                ← Terug naar concept
              </a>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-studio-sand/40 shadow-soft overflow-hidden">
              <div className="divide-y divide-gray-100">
                {gadgets.map((g, i) => {
                  const naam      = g.personalization?.name ?? g.personalizedText ?? null
                  const qty       = g.quantity ?? 1
                  const unitCents = g.priceCents ?? null
                  const lineCents = unitCents != null ? unitCents * qty : null
                  return (
                    <div key={i} className="flex items-center gap-4 px-5 py-4">
                      <GadgetMiniPreview gadget={g} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{g.name}</p>
                        {naam
                          ? <p className="text-xs text-gray-500 mt-0.5">Naam: {naam}</p>
                          : g.isPersonalizable
                            ? <p className="text-xs text-amber-600 mt-0.5">Nog geen naam ingevuld</p>
                            : null
                        }
                        {qty > 1 && unitCents != null && (
                          <p className="text-xs text-gray-400 mt-0.5 tabular-nums">
                            {qty}&thinsp;×&thinsp;{formatPrice(unitCents)}
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-700 shrink-0 tabular-nums">
                        {lineCents != null ? formatPrice(lineCents) : '—'}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Indicative total row */}
              <div className="flex items-center justify-between px-5 py-3 bg-studio-beige border-t border-studio-sand/40">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Indicatief totaal</p>
                  <p className="text-xs text-gray-400 mt-0.5">Bestellen is niet verplicht.</p>
                </div>
                <p className="text-lg font-bold text-gray-900 tabular-nums">
                  {formatPrice(totalCents)}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ── Extra questions form ── */}
        <section className="bg-white rounded-2xl border border-studio-sand/40 shadow-soft px-5 py-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Aanvullende gegevens
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="expectedDate"
                     className="block text-sm font-medium text-gray-700 mb-1">
                Wanneer verwacht je het kindje?{' '}
                <span className="text-gray-400 font-normal">(optioneel)</span>
              </label>
              <input
                id="expectedDate"
                type="date"
                value={expectedDate}
                onChange={e => setExpectedDate(e.target.value)}
                className="block w-full sm:w-52 rounded-xl border border-studio-sand px-3 py-2 text-sm
                           focus:border-studio-yellow focus:ring-2 focus:ring-studio-yellow/30 outline-none"
              />
            </div>

            <div>
              <label htmlFor="notes"
                     className="block text-sm font-medium text-gray-700 mb-1">
                Nog zaken waar je aan denkt?{' '}
                <span className="text-gray-400 font-normal">(optioneel)</span>
              </label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Bijv. kleurvoorkeur, aantallen, speciale wensen…"
                className="block w-full rounded-xl border border-studio-sand px-3 py-2 text-sm
                           focus:border-studio-yellow focus:ring-2 focus:ring-studio-yellow/30 outline-none resize-none"
              />
            </div>

            {metaError && (
              <p className="text-sm text-red-600">{metaError}</p>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={saveMeta}
                disabled={metaSaving}
                className="rounded-xl bg-studio-black px-4 py-2 text-sm font-medium text-white
                           hover:bg-studio-black/85 transition duration-200
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {metaSaving ? 'Opslaan…' : 'Gegevens opslaan'}
              </button>
              {metaSaved && (
                <span className="text-sm text-green-600">✓ Opgeslagen</span>
              )}
            </div>
          </div>
        </section>

        {/* ── Offer-request success banner ── */}
        {offerSuccessId && (
          <section
            role="status"
            aria-live="polite"
            className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 flex items-start gap-3"
          >
            <span className="text-xl leading-none mt-0.5" aria-hidden="true">✅</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-green-800">Offerte aanvraag ontvangen!</p>
              <p className="text-sm text-green-700 mt-0.5">
                We nemen contact met je op zodra we je aanvraag bekeken hebben.
              </p>
              <p className="mt-1.5 font-mono text-[11px] text-green-600 bg-green-100 px-2 py-0.5 rounded inline-block">
                Ref.&thinsp;{offerSuccessId.slice(0, 12)}
              </p>
            </div>
            <button
              onClick={() => setOfferSuccessId(null)}
              aria-label="Sluit melding"
              className="ml-auto shrink-0 text-green-500 hover:text-green-700 transition-colors text-lg leading-none"
            >
              ×
            </button>
          </section>
        )}

        {/* ── CTAs ── */}
        <section className="border-t border-studio-sand/40 pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">

            {/* Primary: submit offer request */}
            <div className="flex flex-col gap-1">
              <button
                onClick={handleOfferRequest}
                disabled={offerLoading || !!offerSuccessId}
                className="flex-1 sm:flex-none rounded-xl bg-studio-yellow px-6 py-2.5
                           text-sm font-medium text-studio-black hover:brightness-95
                           transition duration-200 text-center
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {offerLoading
                  ? 'Bezig…'
                  : offerSuccessId
                    ? '✓ Aanvraag verzonden'
                    : 'Offerte aanvragen'}
              </button>
              {offerError && (
                <p className="text-xs text-red-600">{offerError}</p>
              )}
            </div>

            {/* Secondary: download offerte PDF */}
            <div className="flex flex-col gap-1">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 sm:flex-none rounded-xl border border-studio-sand
                           bg-white px-6 py-2.5
                           text-sm font-medium text-studio-black hover:bg-studio-beige
                           transition duration-200 text-center
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {downloading ? 'Bezig…' : '↓ Offerte downloaden (PDF)'}
              </button>
              {downloadError && (
                <p className="text-xs text-red-600">{downloadError}</p>
              )}
            </div>

            {/* Gadgets preview PDF */}
            {gadgets.length > 0 && (
              <div className="flex flex-col gap-1">
                <button
                  onClick={handleGadgetsDownload}
                  disabled={downloadingGadgets}
                  className="flex-1 sm:flex-none rounded-xl border border-studio-sand
                             bg-white px-6 py-2.5 text-sm font-medium text-studio-black
                             hover:bg-studio-beige transition duration-200 text-center
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {downloadingGadgets ? 'Bezig…' : '↓ Download gadgets (PDF)'}
                </button>
                {gadgetsDownloadError && (
                  <p className="text-xs text-red-600">{gadgetsDownloadError}</p>
                )}
              </div>
            )}

            {/* Secondary: appointment */}
            <a
              href={CONTACT_HREF}
              className="flex-1 sm:flex-none rounded-xl border border-studio-sand bg-white px-6 py-2.5
                         text-sm font-medium text-studio-black hover:bg-studio-beige
                         transition duration-200 text-center"
            >
              Maak een afspraak
            </a>

            {/* Tertiary: order — disabled, coming soon */}
            <button
              onClick={() => setShowBestellenModal(true)}
              className="flex-1 sm:flex-none rounded-xl border border-studio-sand/40 bg-studio-beige/50 px-6 py-2.5
                         text-sm font-medium text-studio-black/40 hover:bg-studio-beige
                         transition duration-200 text-center"
            >
              Direct bestellen{' '}
              <span className="ml-1.5 inline-block rounded-full bg-amber-100 text-amber-700
                               text-[10px] font-semibold px-2 py-0.5 align-middle">
                Binnenkort
              </span>
            </button>
          </div>

          <Link
            href={`/design/${templateId}/concept?design=${designId}`}
            className="inline-block text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Terug naar concept
          </Link>
        </section>

      </main>

      {/* ── "Direct bestellen" modal ── */}
      {showBestellenModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowBestellenModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-3xl mb-3">🚀</p>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Binnenkort beschikbaar</h2>
            <p className="text-sm text-gray-500 mb-5">
              Online bestellen is nog niet mogelijk. Download je offerte of
              maak een afspraak — dan helpen we je persoonlijk verder.
            </p>
            <button
              onClick={() => setShowBestellenModal(false)}
              className="rounded-xl bg-studio-yellow px-5 py-2 text-sm font-medium text-studio-black
                         hover:brightness-95 transition duration-200"
            >
              Begrepen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
