'use client'

/**
 * PaperPicker — premium paper selection component for Studio Twaalf.
 *
 * Features:
 *  • Searchable paper library (20 types)
 *  • Tag filter chips (Alles | Populair | Structuur | Eco | Premium | Glans | Mat | Recycled)
 *  • 2-column card grid with CSS-generated texture swatches
 *  • Animated selected state (amber ring + check mark)
 *  • Detailed info panel for selected paper
 *  • Clear-selection button
 *  • Disclaimer note about screen vs. print accuracy
 */

import { useState } from 'react'
import {
  PAPERS,
  PAPER_TAG_LABELS,
  getPaperTextureDataUrl,
  type PaperTag,
} from '@/data/papers'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  selectedId: string | null
  onSelect:   (id: string | null) => void
}

// ─── Tag order ────────────────────────────────────────────────────────────────

const TAGS: (PaperTag | 'all')[] = [
  'all', 'populair', 'structuur', 'eco', 'premium', 'glans', 'mat', 'recycled',
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaperPicker({ selectedId, onSelect }: Props) {
  const [search,    setSearch]    = useState('')
  const [filterTag, setFilterTag] = useState<PaperTag | 'all'>('all')

  // Derived: filtered papers
  const filtered = PAPERS.filter((p) => {
    const q   = search.trim().toLowerCase()
    const hit = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    const tag = filterTag === 'all' || p.tags.includes(filterTag)
    return hit && tag
  })

  const selected = selectedId ? PAPERS.find((p) => p.id === selectedId) ?? null : null

  // ── Shared styles ──────────────────────────────────────────────────────────
  const inputCls = [
    'w-full px-2.5 py-1.5 border border-[#E0D5C5] rounded-lg text-xs bg-white',
    'focus:outline-none focus:ring-1 focus:ring-[#E7C46A] focus:border-[#E7C46A]',
    'text-[#2C2416] placeholder:text-[#C4B8A0]',
  ].join(' ')

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">

      {/* ── Search ── */}
      <div className="relative">
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#C4B8A0] pointer-events-none"
        >
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Zoeken…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} pl-8`}
        />
      </div>

      {/* ── Tag filter chips (horizontally scrollable) ── */}
      <div
        className="flex gap-1.5 overflow-x-auto"
        style={{ scrollbarWidth: 'none', paddingBottom: 2 }}
      >
        {TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setFilterTag(tag)}
            className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all"
            style={{
              background:  filterTag === tag ? '#E7C46A' : '#fff',
              color:       filterTag === tag ? '#2C2416' : '#B5A48A',
              border:      filterTag === tag ? '1px solid #D4B050' : '1px solid #E8DDD0',
            }}
          >
            {PAPER_TAG_LABELS[tag]}
          </button>
        ))}
      </div>

      {/* ── Paper grid ── */}
      {filtered.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-[10px] text-[#C4B8A0] italic">Geen papiersoorten gevonden</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((paper) => {
            const isSelected  = paper.id === selectedId
            const textureUrl  = getPaperTextureDataUrl(paper.texture)
            const previewOpacity = Math.min(0.85, paper.overlayOpacity * 5)

            return (
              <button
                key={paper.id}
                onClick={() => onSelect(isSelected ? null : paper.id)}
                className="rounded-xl overflow-hidden text-left transition-all"
                style={{
                  border:      isSelected
                    ? '2px solid #B08040'
                    : '1.5px solid #EDE7D9',
                  background:  isSelected ? '#FDFAF2' : '#FAFAF7',
                  boxShadow:   isSelected
                    ? '0 0 0 2.5px rgba(176,128,64,0.18), 0 2px 8px rgba(44,36,22,0.10)'
                    : '0 1px 3px rgba(44,36,22,0.04)',
                  transform:   isSelected ? 'scale(1.025)' : undefined,
                  outline:     'none',
                }}
                title={paper.description}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    const el = e.currentTarget
                    el.style.borderColor = '#D4B870'
                    el.style.boxShadow   = '0 2px 8px rgba(176,128,64,0.15)'
                    el.style.transform   = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    const el = e.currentTarget
                    el.style.borderColor = '#EDE7D9'
                    el.style.boxShadow   = '0 1px 3px rgba(44,36,22,0.04)'
                    el.style.transform   = ''
                  }
                }}
              >
                {/* ── Texture swatch ── */}
                <div className="relative overflow-hidden" style={{ height: 46 }}>
                  {/* Paper tone base */}
                  <div className="absolute inset-0" style={{ background: paper.tone }} />
                  {/* Texture noise overlay */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url("${textureUrl}")`,
                      backgroundSize:  '75px 75px',
                      opacity:         previewOpacity,
                      mixBlendMode:    'multiply',
                    }}
                  />
                  {/* Popular star badge */}
                  {paper.popular && (
                    <div
                      className="absolute top-1.5 right-1.5 w-[14px] h-[14px] rounded-full flex items-center justify-center"
                      style={{ background: '#E7C46A', boxShadow: '0 1px 3px rgba(44,36,22,0.2)' }}
                    >
                      <span className="text-[7px] font-black text-[#2C2416]">★</span>
                    </div>
                  )}
                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className="absolute bottom-1.5 right-1.5">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: '#B08040', boxShadow: '0 1px 3px rgba(44,36,22,0.3)' }}
                      >
                        <svg
                          width="8" height="8" viewBox="0 0 24 24" fill="none"
                          stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Card info ── */}
                <div className="px-2 py-1.5 space-y-0.5">
                  <p
                    className="text-[9px] font-semibold leading-tight"
                    style={{ color: isSelected ? '#6B4E1A' : '#2C2416' }}
                  >
                    {paper.name.replace(/\s\d+g$/, '')}
                  </p>
                  <p className="text-[8px] text-[#B5A48A]">{paper.weight} g/m²</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Selected paper info panel ── */}
      {selected && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid #EDE7D9' }}
        >
          {/* Header */}
          <div
            className="px-3 py-2.5 flex items-center gap-2.5"
            style={{ background: '#FDF8EE', borderBottom: '1px solid #EDE7D9' }}
          >
            {/* Mini swatch */}
            <div
              className="relative shrink-0 rounded-lg overflow-hidden"
              style={{ width: 34, height: 34 }}
            >
              <div className="absolute inset-0" style={{ background: selected.tone }} />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url("${getPaperTextureDataUrl(selected.texture)}")`,
                  backgroundSize:  '50px 50px',
                  opacity:         Math.min(0.8, selected.overlayOpacity * 5),
                  mixBlendMode:    'multiply',
                }}
              />
            </div>

            {/* Name + weight */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-[10px] font-semibold text-[#2C2416] leading-tight">
                  {selected.name}
                </p>
                {selected.popular && (
                  <span
                    className="text-[7px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: '#E7C46A', color: '#2C2416' }}
                  >
                    Populair
                  </span>
                )}
              </div>
              <p className="text-[9px] text-[#B5A48A] mt-0.5">{selected.weight} g/m²</p>
            </div>
          </div>

          {/* Description + tags */}
          <div className="px-3 py-2.5 space-y-2" style={{ background: '#FAFAF7' }}>
            <p className="text-[9px] text-[#7A6A52] leading-relaxed">
              {selected.description}
            </p>
            <div className="flex flex-wrap gap-1">
              {selected.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[8px] px-1.5 py-0.5 rounded-full"
                  style={{ background: '#EDE7D9', color: '#B5A48A' }}
                >
                  {PAPER_TAG_LABELS[tag]}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Clear selection ── */}
      {selectedId && (
        <button
          onClick={() => onSelect(null)}
          className="w-full py-1.5 text-[10px] font-medium rounded-lg transition-colors"
          style={{ color: '#C4B8A0' }}
          onMouseEnter={(e) => {
            const el = e.currentTarget
            el.style.color      = '#7A6A52'
            el.style.background = '#F5F0E8'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget
            el.style.color      = '#C4B8A0'
            el.style.background = 'transparent'
          }}
        >
          Selectie wissen
        </button>
      )}

      {/* ── Disclaimer ── */}
      <p
        className="text-[9px] text-center leading-relaxed pt-1"
        style={{ color: '#D4C8B0' }}
      >
        Papierpreview is indicatief.
        <br />
        Actueel papier bevestigd bij bestelling.
      </p>
    </div>
  )
}
