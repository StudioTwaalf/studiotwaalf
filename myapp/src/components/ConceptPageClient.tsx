'use client'

/**
 * ConceptPageClient — Premium "Jouw concept" preview page.
 *
 * Positioned between Gadgets and Offerte in the flow:
 *   Templates → Design editor → Gadgets → Jouw concept → Offerte
 *
 * Shows a high-end editorial preview of the completed card + gadget choices
 * before the user proceeds to request a quote.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import ProgressSteps from '@/components/ProgressSteps'
import MockupComposition from '@/components/concept/MockupComposition'
import type { TemplateDesign } from '@/types/template'
import type { SelectedGadget } from '@/lib/gadget-personalization'
import { PAPERS } from '@/data/papers'
import { trackEvent } from '@/lib/analytics'
import type { BaseParams } from '@/lib/analytics'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  templateId:     string
  designId:       string
  templateName:   string
  designName:     string | null
  templateDesign: TemplateDesign | null
  gadgets:        SelectedGadget[]
  paperId:        string | null
  /** Journey type derived from the template category — used for funnel events. */
  journeyType:    BaseParams['journey_type']
}

const STEPS = ['Ontwerp', 'Gadgets', 'Jouw concept', 'Offerte']

// ─── Paper details badge ──────────────────────────────────────────────────────

function PaperBadge({ paperId }: { paperId: string | null }) {
  if (!paperId) return null
  const paper = PAPERS.find((p) => p.id === paperId)
  if (!paper) return null

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
      style={{
        background:    'rgba(231,196,106,0.12)',
        border:        '1px solid rgba(231,196,106,0.35)',
        color:         '#6B4E1A',
      }}
    >
      <span
        className="w-3 h-3 rounded-full shrink-0 ring-1 ring-black/10"
        style={{ backgroundColor: paper.tone }}
      />
      {paper.name}
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-semibold tracking-[0.12em] uppercase mb-3"
      style={{ color: '#C4B8A0' }}
    >
      {children}
    </p>
  )
}

// ─── Choice row ───────────────────────────────────────────────────────────────

function ChoiceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: '#EDE6D8' }}>
      <span className="text-xs" style={{ color: '#9A8E7D' }}>{label}</span>
      <span className="text-xs font-medium" style={{ color: '#2C2416' }}>{value}</span>
    </div>
  )
}

// ─── Artboard tab ─────────────────────────────────────────────────────────────

function ArtboardTab({
  label,
  active,
  onClick,
}: {
  label:   string
  active:  boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
      style={{
        background: active ? '#E7C46A' : 'rgba(0,0,0,0.04)',
        color:      active ? '#2C2416' : '#9A8E7D',
        border:     'none',
        cursor:     'pointer',
      }}
    >
      {label}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ConceptPageClient({
  templateId,
  designId,
  templateName,
  designName,
  templateDesign,
  gadgets,
  paperId,
  journeyType,
}: Props) {
  const [activeArtboard, setActiveArtboard] = useState(
    templateDesign?.artboards[0]?.id ?? null,
  )

  const selectedPaper = paperId ? PAPERS.find((p) => p.id === paperId) ?? null : null
  const artboards     = templateDesign?.artboards ?? []
  const hasMultiside  = artboards.length > 1

  const offerteUrl  = `/design/${templateId}/offerte?design=${designId}`
  const editorUrl   = `/design/${templateId}?design=${designId}`
  const gadgetsUrl  = `/design/${templateId}/gadgets?design=${designId}${paperId ? `&paper=${paperId}` : ''}`

  const selectedGadgetNames = gadgets.map((g) => {
    const qty = (g.quantity ?? 1) > 1 ? ` ×${g.quantity}` : ''
    return `${g.name}${qty}`
  })

  // ── Analytics ───────────────────────────────────────────────────────────────

  // Fire view_concept exactly once when the required concept data is available.
  // The ref guard prevents double-firing in React 18 Strict Mode (effects run
  // twice in dev) and protects against any future dep-change re-runs.
  const hasTrackedView = useRef(false)
  useEffect(() => {
    if (hasTrackedView.current) return
    if (!designId || !templateId) return   // data not ready — wait
    hasTrackedView.current = true
    trackEvent({
      event:              'view_concept',
      flow_step:          'concept',
      session_design_id:  designId,
      template_id:        templateId,
      journey_type:       journeyType,
      concept_item_count: gadgets.length,
    })
  }, [designId, templateId, journeyType, gadgets.length])

  const handleStartQuote = useCallback(() => {
    // Signals intent to proceed — fires before the navigation
    trackEvent({
      event:              'start_quote',
      flow_step:          'concept',
      session_design_id:  designId,
      template_id:        templateId,
      journey_type:       journeyType,
      concept_item_count: gadgets.length,
      has_gadgets:        gadgets.length > 0,
    })
    // Step-completion signal: concept preview reviewed, moving to quote form
    trackEvent({
      event:             'diy_step_completed',
      step:              'preview',
      flow_step:         'concept',
      session_design_id: designId,
      template_id:       templateId,
      journey_type:      journeyType,
    })
  }, [designId, templateId, journeyType, gadgets.length])

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF7' }}>

      {/* ── Top navigation bar ── */}
      <header
        className="flex items-center justify-between px-4 h-12 shrink-0 sticky top-0 z-20 border-b"
        style={{ background: 'rgba(250,250,247,0.92)', backdropFilter: 'blur(12px)', borderColor: '#EDE6D8' }}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          <a
            href="/templates"
            className="text-xs transition-colors shrink-0"
            style={{ color: '#B0A898' }}
            onMouseOver={(e) => { (e.target as HTMLElement).style.color = '#2C2416' }}
            onMouseOut={(e)  => { (e.target as HTMLElement).style.color = '#B0A898' }}
          >
            Templates
          </a>
          <span style={{ color: '#D4C9B8' }}>›</span>
          <a
            href={editorUrl}
            className="text-xs truncate max-w-[130px] transition-colors"
            style={{ color: '#B0A898' }}
            onMouseOver={(e) => { (e.target as HTMLElement).style.color = '#2C2416' }}
            onMouseOut={(e)  => { (e.target as HTMLElement).style.color = '#B0A898' }}
          >
            {templateName}
          </a>
          <span style={{ color: '#D4C9B8' }}>›</span>
          <span className="text-xs font-semibold" style={{ color: '#2C2416' }}>Jouw concept</span>
        </div>

        {/* Progress steps */}
        <div className="hidden sm:block">
          <ProgressSteps steps={STEPS} currentIndex={2} />
        </div>

        {/* Design ID chip */}
        <span
          className="hidden md:inline-block text-[10px] font-mono px-2 py-0.5 rounded ml-3 shrink-0"
          style={{ background: '#F0EAE0', color: '#B0A898', border: '1px solid #E5DDD0' }}
        >
          {designId.slice(0, 8)}
        </span>
      </header>

      {/* ── Mobile progress ── */}
      <div className="sm:hidden px-4 pt-4 pb-0">
        <ProgressSteps steps={STEPS} currentIndex={2} />
      </div>

      {/* ── Page layout ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">

        {/* ── Hero heading ── */}
        <div className="mb-10 lg:mb-14">
          <p
            className="text-[11px] font-semibold tracking-[0.15em] uppercase mb-2"
            style={{ color: '#B0A898' }}
          >
            Studio Twaalf
          </p>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight"
            style={{ color: '#2C2416', fontFamily: "'Fraunces', Georgia, serif" }}
          >
            {designName ?? 'Jouw concept'}
          </h1>
          <p className="mt-3 text-base max-w-lg" style={{ color: '#7A6A5A' }}>
            Bekijk je ontwerp zoals het er écht uit gaat zien — op luxe drukwerk, met de door jou gekozen opties.
          </p>
        </div>

        {/* ── Two-column layout: card + details ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 lg:gap-16 items-start">

          {/* ── LEFT: Card preview ── */}
          <div>
            {/* Artboard tabs (if multi-side) */}
            {hasMultiside && (
              <div className="flex gap-2 mb-6">
                {artboards.map((a) => (
                  <ArtboardTab
                    key={a.id}
                    label={a.name ?? a.id}
                    active={activeArtboard === a.id}
                    onClick={() => setActiveArtboard(a.id)}
                  />
                ))}
              </div>
            )}

            {/* Card mockup stage — flat-lay composition */}
            {templateDesign ? (
              <MockupComposition
                templateDesign={templateDesign}
                gadgets={gadgets}
                paperId={paperId}
                artboardId={activeArtboard ?? undefined}
              />
            ) : (
              <div
                className="rounded-3xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(145deg, #F4EFE6 0%, #EDE5D5 50%, #E8DFC8 100%)',
                  minHeight:  360,
                }}
              >
                <div
                  className="flex items-center justify-center rounded-xl text-xs"
                  style={{
                    width: 320, height: 240,
                    background: '#F5F0E8',
                    color: '#B0A898',
                    border: '1px solid #E5DDD0',
                  }}
                >
                  Geen voorbeeldweergave beschikbaar
                </div>
              </div>
            )}

            {/* Paper description (below card) */}
            {selectedPaper && (
              <div
                className="mt-6 rounded-2xl px-5 py-4 flex gap-4 items-start"
                style={{
                  background: 'rgba(231,196,106,0.06)',
                  border:     '1px solid rgba(231,196,106,0.25)',
                }}
              >
                {/* Paper tone swatch */}
                <div
                  className="w-12 h-12 rounded-xl shrink-0 ring-1 ring-black/10 mt-0.5"
                  style={{ backgroundColor: selectedPaper.tone }}
                />
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: '#2C2416' }}>
                    {selectedPaper.name}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: '#7A6A5A' }}>
                    {selectedPaper.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedPaper.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: '#F0EAE0', color: '#9A8E7D' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Choices summary + CTAs ── */}
          <div className="space-y-8">

            {/* Design info */}
            <div
              className="rounded-2xl p-5"
              style={{ background: '#FFFFFF', border: '1px solid #EDE6D8' }}
            >
              <SectionLabel>Jouw ontwerp</SectionLabel>
              <ChoiceRow
                label="Ontwerp"
                value={designName ?? templateName}
              />
              {selectedPaper && (
                <ChoiceRow
                  label="Papiersoort"
                  value={`${selectedPaper.name} — ${selectedPaper.weight} g/m²`}
                />
              )}
              {!selectedPaper && (
                <ChoiceRow
                  label="Papiersoort"
                  value="Nog niet gekozen"
                />
              )}
            </div>

            {/* Gadgets */}
            {gadgets.length > 0 && (
              <div
                className="rounded-2xl p-5"
                style={{ background: '#FFFFFF', border: '1px solid #EDE6D8' }}
              >
                <SectionLabel>Gadgets &amp; snoep</SectionLabel>
                {gadgets.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center gap-3 py-2.5 border-b last:border-b-0"
                    style={{ borderColor: '#EDE6D8' }}
                  >
                    {g.emoji && (
                      <span
                        className="text-lg w-8 h-8 flex items-center justify-center rounded-lg shrink-0"
                        style={{ background: '#F4EFE6' }}
                        aria-hidden
                      >
                        {g.emoji.startsWith('/') || g.emoji.startsWith('http')
                          ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={g.emoji} alt="" className="w-5 h-5 object-contain" />
                          )
                          : g.emoji
                        }
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: '#2C2416' }}>
                        {g.name}
                      </p>
                      {g.personalization?.name && (
                        <p className="text-[10px] mt-0.5" style={{ color: '#9A8E7D' }}>
                          {g.personalization.name}
                        </p>
                      )}
                    </div>
                    {(g.quantity ?? 1) > 1 && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0"
                        style={{ background: '#F0EAE0', color: '#7A6A5A' }}
                      >
                        ×{g.quantity}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {gadgets.length === 0 && (
              <div className="rounded-2xl p-5 bg-white border border-[#EDE6D8]">
                <SectionLabel>Gadgets &amp; snoep</SectionLabel>
                <p className="text-xs text-[#B0A898]">
                  Geen gadgets geselecteerd.
                </p>
              </div>
            )}

            {/* CTAs */}
            <div className="space-y-3 pt-2">
              {/* Primary CTA */}
              <a
                href={offerteUrl}
                onClick={handleStartQuote}
                className="flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 text-sm font-semibold
                           bg-[#E7C46A] text-[#2C2416] shadow-[0_2px_12px_rgba(231,196,106,0.35)]
                           hover:brightness-95 transition-all
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7C46A]/60 focus-visible:ring-offset-2"
              >
                Verder naar offerte
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>

              {/* Paper selection reminder if no paper chosen */}
              {!selectedPaper && (
                <a
                  href={editorUrl}
                  className="flex items-center justify-center gap-2 w-full rounded-2xl py-3 text-xs font-medium
                             bg-[#E7C46A]/[0.08] border border-dashed border-[#E7C46A]/50 text-[#8A6E30]
                             hover:bg-[#E7C46A]/15 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4M12 16h.01"/>
                  </svg>
                  Nog geen papier gekozen — klik hier om terug te gaan
                </a>
              )}

              {/* Back links */}
              <div className="flex gap-2">
                <Link
                  href={editorUrl}
                  className="flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-medium
                             bg-white border border-[#E0D5C5] text-[#7A6A52]
                             hover:bg-[#F5F0E8] hover:text-[#2C2416] transition-colors text-center
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7C46A]/60 focus-visible:ring-offset-1"
                >
                  ← Ontwerp aanpassen
                </Link>
                <Link
                  href={gadgetsUrl}
                  className="flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-medium
                             bg-white border border-[#E0D5C5] text-[#7A6A52]
                             hover:bg-[#F5F0E8] hover:text-[#2C2416] transition-colors text-center
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7C46A]/60 focus-visible:ring-offset-1"
                >
                  ← Gadgets aanpassen
                </Link>
              </div>
            </div>

            {/* Paper badge summary */}
            {selectedPaper && (
              <div className="pt-1">
                <PaperBadge paperId={paperId} />
              </div>
            )}

          </div>
        </div>

        {/* ── Bottom summary bar (mobile) ── */}
        <div className="lg:hidden mt-10 rounded-2xl p-5 bg-white border border-[#EDE6D8]">
          <SectionLabel>Samenvatting</SectionLabel>
          <ChoiceRow label="Ontwerp"     value={designName ?? templateName} />
          {selectedPaper && (
            <ChoiceRow label="Papier"    value={`${selectedPaper.name} — ${selectedPaper.weight} g/m²`} />
          )}
          {selectedGadgetNames.length > 0 && (
            <ChoiceRow label="Gadgets"   value={selectedGadgetNames.join(', ')} />
          )}
        </div>

        {/* ── Bottom CTA (mobile sticky) ── */}
        <div className="lg:hidden mt-6 flex items-center justify-between gap-4 p-4 rounded-2xl
                        bg-white border border-[#EDE6D8] shadow-[0_4px_24px_rgba(44,36,22,0.06)]">
          <Link
            href={editorUrl}
            className="text-xs font-medium text-[#9A8E7D] hover:text-[#2C2416] transition-colors"
          >
            ← Terug
          </Link>
          <a
            href={offerteUrl}
            onClick={handleStartQuote}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold
                       bg-[#E7C46A] text-[#2C2416] hover:brightness-95 transition-all
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7C46A]/60 focus-visible:ring-offset-2"
          >
            Verder naar offerte
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>

      </main>
    </div>
  )
}
