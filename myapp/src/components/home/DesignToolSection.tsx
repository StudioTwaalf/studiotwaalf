'use client'

import { useState } from 'react'
import Link from 'next/link'

const STEPS = [
  {
    number: '01',
    title: 'Kies een ontwerp',
    description: 'Start met een zorgvuldig ontworpen template als basis',
    color: '#FFCED3',
  },
  {
    number: '02',
    title: 'Personaliseer jouw kaart',
    description: 'Pas tekst, kleuren en lettertypes eenvoudig aan',
    color: '#E8DCBB',
  },
  {
    number: '03',
    title: 'Voeg bijpassende details toe',
    description: 'Combineer met doopsuiker en gepersonaliseerde cadeaus',
    color: '#A8BFA3',
  },
  {
    number: '04',
    title: 'Bekijk jouw concept en vraag offerte aan',
    description: 'Zie meteen hoe alles samenkomt en ontvang een voorstel op maat',
    color: '#E7C46A',
  },
]

export default function DesignToolSection() {
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const step = activeStep ?? 1   // default to step 2 (edit state) when nothing hovered

  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ── Left: content ─────────────────────────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-4">
              Design tool
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-studio-black leading-tight text-balance mb-5">
              Ontwerp jouw geboortekaartje en stel je volledige concept samen
            </h2>
            <p className="text-[#7A6A52] text-base leading-relaxed mb-10 max-w-md">
              Ontwerp eenvoudig jouw geboortekaartje en combineer het met doopsuiker en
              gepersonaliseerde details tot één mooi geheel. Alles is meteen zichtbaar
              in jouw concept.
            </p>

            {/* Steps */}
            <ol className="space-y-2 mb-10">
              {STEPS.map((s, i) => {
                const isActive = activeStep === i
                return (
                  <li
                    key={s.number}
                    onMouseEnter={() => setActiveStep(i)}
                    onMouseLeave={() => setActiveStep(null)}
                    className={[
                      'flex items-center gap-4 rounded-xl px-4 py-3 cursor-default transition-all duration-200',
                      isActive ? 'bg-[#F7F3EA] shadow-soft' : 'hover:bg-[#FAF8F4]',
                    ].join(' ')}
                  >
                    {/* Number badge */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-[#2C2416] transition-transform duration-200"
                      style={{
                        background: s.color,
                        transform: isActive ? 'scale(1.08)' : 'scale(1)',
                      }}
                    >
                      {s.number}
                    </div>

                    {/* Text */}
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold leading-snug transition-colors duration-150 ${isActive ? 'text-studio-black' : 'text-[#3A2E22]'}`}>
                        {s.title}
                      </p>
                      <p className={`text-xs leading-relaxed mt-0.5 transition-all duration-200 overflow-hidden ${isActive ? 'text-[#8A7A6A] max-h-10 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {s.description}
                      </p>
                    </div>

                    {/* Active indicator */}
                    {isActive && (
                      <div className="ml-auto w-1 h-6 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    )}
                  </li>
                )
              })}
            </ol>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 bg-studio-yellow text-[#2C2416] text-sm font-semibold px-6 py-3 rounded-xl hover:brightness-95 transition-all"
              >
                Start met ontwerpen
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/realisaties"
                className="inline-flex items-center gap-2 border border-[#D4C9B4] text-[#7A6A52] text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#EDE7D9] transition-colors"
              >
                Bekijk realisaties
              </Link>
            </div>
          </div>

          {/* ── Right: editor mockup ───────────────────────────────────── */}
          <div className="relative lg:scale-105 lg:origin-left">
            <EditorMockup activeStep={step} />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Editor mockup with per-step states ──────────────────────────────────────

function EditorMockup({ activeStep }: { activeStep: number }) {
  return (
    <div
      className="relative bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 28px 80px rgba(44,36,22,0.15)', aspectRatio: '4/3' }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#F0EBE0]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FFCED3]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#E8DCBB]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#A8BFA3]" />
        <div className="flex-1" />
        <div className="bg-[#F5F0E8] rounded-lg px-3 py-1">
          <span className="text-[10px] text-[#B5A48A] font-medium">Studio Twaalf Editor</span>
        </div>
        <div className="flex-1" />
      </div>

      {/* Editor body */}
      <div className="flex h-[calc(100%-44px)]">

        {/* Left sidebar */}
        <div className="w-14 border-r border-[#F0EBE0] flex flex-col items-center gap-3 py-4">
          {['T', '★', '↑', 'Aa', '▤', '☰'].map((icon, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-medium transition-all duration-300"
              style={{
                background: i === (activeStep === 0 ? 4 : activeStep === 1 ? 0 : activeStep === 2 ? 1 : 2) ? '#2C2416' : '#F5F0E8',
                color:      i === (activeStep === 0 ? 4 : activeStep === 1 ? 0 : activeStep === 2 ? 1 : 2) ? '#fff' : '#B5A48A',
              }}
            >
              {icon}
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative flex items-center justify-center bg-[#F5F0E8] overflow-hidden">

          {/* Step 0 – Template selection grid */}
          <div className={`absolute inset-0 flex items-center justify-center p-4 transition-all duration-400 ${activeStep === 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <div className="grid grid-cols-3 gap-2 w-full max-w-[220px]">
              {[
                { bg: '#FFCED3', label: 'Roze' },
                { bg: '#A8BFA3', label: 'Sage', ring: true },
                { bg: '#E8DCBB', label: 'Zand' },
                { bg: '#E7C46A', label: 'Goud' },
                { bg: '#EDE0D4', label: 'Blush' },
                { bg: '#F5F0E8', label: 'Wit' },
              ].map((t, i) => (
                <div
                  key={i}
                  className="rounded-lg aspect-[3/4] flex items-end p-1.5 transition-all duration-200"
                  style={{
                    background: t.bg,
                    outline: t.ring ? '2px solid #E7C46A' : 'none',
                    outlineOffset: '1px',
                    boxShadow: t.ring ? '0 4px 12px rgba(44,36,22,0.15)' : 'none',
                  }}
                >
                  <span className="text-[7px] font-semibold text-[#2C2416]/60">{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step 1 – Text editing state (default) */}
          <div className={`absolute inset-0 flex items-center justify-center p-6 transition-all duration-400 ${activeStep === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <div
              className="relative rounded-xl overflow-hidden flex items-center justify-center"
              style={{ width: 160, height: 112, background: '#A8BFA3', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
            >
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
              <div className="relative border-2 rounded px-2 py-1" style={{ borderColor: '#E7C46A', background: 'rgba(255,255,255,0.15)' }}>
                <span className="font-serif text-white text-lg font-semibold tracking-widest">ELLA</span>
                <div className="absolute -top-1 -left-1 w-2 h-2 rounded-sm bg-white border border-[#E7C46A]" />
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-sm bg-white border border-[#E7C46A]" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-sm bg-white border border-[#E7C46A]" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-sm bg-white border border-[#E7C46A]" />
              </div>
              <div className="absolute top-0 bottom-0 left-1/2 w-px" style={{ background: 'rgba(231,196,106,0.6)' }} />
              {/* Cursor blink */}
              <div className="absolute bottom-3 right-4 w-px h-4 bg-white/80 animate-pulse" />
            </div>
          </div>

          {/* Step 2 – Card + gadget details */}
          <div className={`absolute inset-0 flex items-center justify-center gap-3 p-4 transition-all duration-400 ${activeStep === 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            {/* Card */}
            <div className="rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ width: 110, height: 77, background: '#A8BFA3', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
              <span className="font-serif text-white text-sm font-semibold tracking-widest">ELLA</span>
            </div>
            {/* Gadgets column */}
            <div className="flex flex-col gap-2">
              {[
                { bg: '#FFCED3', label: 'Doosje', w: 52 },
                { bg: '#E8DCBB', label: 'Label', w: 52 },
                { bg: '#A8BFA3', label: 'Cadeau', w: 52 },
              ].map((g) => (
                <div key={g.label} className="rounded-lg h-7 flex items-center justify-center" style={{ width: g.w, background: g.bg }}>
                  <span className="text-[8px] font-semibold text-[#2C2416]/70">{g.label}</span>
                </div>
              ))}
            </div>
            {/* Connection dots */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[85%] h-px border-t border-dashed border-[#E7C46A]/40" />
            </div>
          </div>

          {/* Step 3 – Full concept preview */}
          <div className={`absolute inset-0 flex items-center justify-center p-4 transition-all duration-400 ${activeStep === 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <div className="flex flex-col items-center gap-2 w-full max-w-[200px]">
              {/* Header label */}
              <div className="bg-[#2C2416] rounded-full px-3 py-1">
                <span className="text-[8px] font-bold text-white/80 uppercase tracking-widest">Jouw concept</span>
              </div>
              {/* Items row */}
              <div className="flex items-end gap-2 w-full justify-center">
                {/* Main card */}
                <div className="rounded-xl flex items-center justify-center flex-shrink-0" style={{ width: 90, height: 63, background: '#A8BFA3', boxShadow: '0 6px 20px rgba(0,0,0,0.12)' }}>
                  <span className="font-serif text-white text-xs font-semibold tracking-wider">ELLA</span>
                </div>
                {/* Side items stacked */}
                <div className="flex flex-col gap-1.5">
                  <div className="rounded-lg flex items-center justify-center" style={{ width: 44, height: 30, background: '#FFCED3' }}>
                    <span className="text-[7px] font-semibold text-[#2C2416]/60">Doosje</span>
                  </div>
                  <div className="rounded-lg flex items-center justify-center" style={{ width: 44, height: 24, background: '#E8DCBB' }}>
                    <span className="text-[7px] font-semibold text-[#2C2416]/60">Label</span>
                  </div>
                </div>
              </div>
              {/* Offerte CTA bar */}
              <div className="w-full bg-studio-yellow rounded-lg py-1.5 flex items-center justify-center">
                <span className="text-[8px] font-bold text-[#2C2416]">Offerte aanvragen →</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-36 border-l border-[#F0EBE0] p-3 space-y-3">
          <p className="text-[9px] font-bold text-[#C4B8A0] uppercase tracking-widest">Lettertype</p>
          <div className="bg-[#F5F0E8] rounded-lg px-2 py-1.5">
            <span className="text-[9px] text-[#7A6A52] font-medium">Fraunces</span>
          </div>
          <p className="text-[9px] font-bold text-[#C4B8A0] uppercase tracking-widest">Kleur</p>
          <div className="grid grid-cols-5 gap-1">
            {['#FFCED3','#E8DCBB','#A8BFA3','#E7C46A','#2C2416'].map((c, i) => (
              <div
                key={c}
                className="w-4 h-4 rounded-md border-2 transition-all duration-200"
                style={{
                  background: c,
                  borderColor: activeStep === 1 && i === 2 ? '#2C2416' : 'transparent',
                  transform: activeStep === 1 && i === 2 ? 'scale(1.15)' : 'scale(1)',
                }}
              />
            ))}
          </div>
          <p className="text-[9px] font-bold text-[#C4B8A0] uppercase tracking-widest">Grootte</p>
          <div className="bg-[#F5F0E8] rounded-lg px-2 py-1.5 flex justify-between items-center">
            <span className="text-[9px] text-[#7A6A52]">19</span>
            <span className="text-[9px] text-[#C4B8A0]">mm</span>
          </div>

          {/* Step indicator dots */}
          <div className="pt-2 flex flex-col gap-1.5">
            {[0,1,2,3].map((i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  background: i === activeStep ? '#E7C46A' : '#EDE7D9',
                  width: i === activeStep ? '100%' : '60%',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
