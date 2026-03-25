/**
 * CardPreview — lightweight, read-only card renderer.
 *
 * Replicates the visual layer stack of CanvasEditor (elements → paper texture →
 * catch-light → gloss/pearl sheen → edge depth) without any editor chrome.
 * Used on the concept preview page and anywhere a static card thumbnail is needed.
 */

'use client'

import type { TemplateDesign, TemplateElement, TextElement, ShapeElement, ImageElement } from '@/types/template'
import { PAPERS, getPaperTextureFilterParams } from '@/data/papers'

// ─── hexToFilter (CSS filter tinting for SVG illustrations) ──────────────────

function hexToFilter(hex: string): string {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return 'none'
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  const s = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min)
  let h = 0
  if (max !== min) {
    const d = max - min
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h /= 6
  }
  const hDeg  = Math.round(h * 360)
  const sPct  = Math.round(s * 100)
  const lPct  = Math.round(l * 100)
  const inv   = lPct > 70 ? 88 : lPct > 50 ? 72 : lPct > 30 ? 48 : 18
  const sat   = sPct < 5 ? 0 : Math.min(Math.max(sPct * 6, 100), 2500)
  const sepia = sPct < 5 ? 0 : 100
  return `brightness(0) saturate(100%) invert(${inv}%) sepia(${sepia}%) saturate(${sat}%) hue-rotate(${hDeg}deg)`
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  design:      TemplateDesign
  /** Artboard to render — defaults to artboards[0]. */
  artboardId?: string
  /** Selected paper ID from the PAPERS library (optional). */
  paperId?:    string
  /** Desired rendered width in CSS pixels. Height is computed proportionally. */
  width?:      number
  /** Extra class names applied to the outer wrapper. */
  className?:  string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CardPreview({
  design,
  artboardId,
  paperId,
  width = 400,
  className,
}: Props) {
  const artboard = artboardId
    ? (design.artboards.find((a) => a.id === artboardId) ?? design.artboards[0])
    : design.artboards[0]

  if (!artboard) return null

  const scale  = width / artboard.width
  const height = artboard.height * scale

  const artboardElements = design.elements.filter((el) => el.artboardId === artboard.id)

  const selectedPaper = paperId ? (PAPERS.find((p) => p.id === paperId) ?? null) : null

  // ── Render individual design element ────────────────────────────────────────

  function renderElement(el: TemplateElement) {
    const baseStyle: React.CSSProperties = {
      position:        'absolute',
      left:             el.x,
      top:              el.y,
      ...(el.rotation ? { transform: `rotate(${el.rotation}deg)`, transformOrigin: 'top left' } : {}),
    }

    if (el.type === 'shape') {
      const s = el as ShapeElement
      return (
        <div
          key={el.id}
          style={{
            ...baseStyle,
            width:           s.width,
            height:          s.height,
            backgroundColor: s.style.fill && s.style.fill !== 'none' ? s.style.fill : 'transparent',
            border:          s.style.stroke && s.style.stroke !== 'none'
              ? `${s.style.strokeWidth ?? 0}px solid ${s.style.stroke}` : 'none',
            opacity:         s.style.opacity ?? 1,
            borderRadius:    s.shapeType === 'ellipse' ? '50%' : undefined,
            pointerEvents:   'none',
          }}
        />
      )
    }

    if (el.type === 'image') {
      const img = el as ImageElement
      if (!img.src || (!img.src.startsWith('/') && !img.src.startsWith('http'))) return null
      const isSvg      = img.src.toLowerCase().endsWith('.svg')
      const imgFilter  = isSvg && img.tintColor ? hexToFilter(img.tintColor) : undefined
      return (
        <div
          key={el.id}
          style={{
            ...baseStyle,
            width:        img.width,
            height:       img.height,
            opacity:      img.opacity ?? 1,
            pointerEvents:'none',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.src}
            alt={img.name ?? ''}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: imgFilter }}
            draggable={false}
          />
        </div>
      )
    }

    if (el.type === 'text') {
      const t = el as TextElement
      const s = t.style
      return (
        <div
          key={el.id}
          style={{
            ...baseStyle,
            width:         t.width  ?? 40,
            height:        t.height ?? 10,
            pointerEvents: 'none',
            overflow:      'hidden',
            fontFamily:    `${s.fontFamily}, Arial, sans-serif`,
            fontSize:      s.fontSize,
            fontWeight:    s.fontWeight   ?? 400,
            fontStyle:     s.fontStyle    ?? 'normal',
            color:         s.color,
            lineHeight:    s.lineHeight   ?? 1.2,
            textAlign:     s.textAlign    ?? 'left',
            letterSpacing: s.letterSpacing != null ? `${s.letterSpacing}em` : undefined,
            whiteSpace:    'pre-wrap',
            userSelect:    'none',
          }}
        >
          {t.content}
        </div>
      )
    }

    return null
  }

  return (
    <div
      className={className}
      style={{
        width,
        height,
        position: 'relative',
        flexShrink: 0,
        // Multi-layer card shadow for physical print feel
        boxShadow: [
          '0 1px 2px  rgba(44,36,22,0.06)',
          '0 3px 8px  rgba(44,36,22,0.09)',
          '0 10px 28px rgba(44,36,22,0.14)',
          '0 28px 56px rgba(44,36,22,0.11)',
          '0 48px 88px rgba(44,36,22,0.05)',
        ].join(', '),
        overflow: 'hidden',
        borderRadius: 2,
      }}
    >
      {/* ── Inner canvas (mm coordinates, CSS-scaled up) ── */}
      <div
        style={{
          position:        'absolute',
          top: 0, left: 0,
          width:           artboard.width,
          height:          artboard.height,
          backgroundColor: artboard.backgroundColor ?? '#ffffff',
          transform:       `scale(${scale})`,
          transformOrigin: 'top left',
          overflow:        'visible',
        }}
      >
        {/* Design elements */}
        {artboardElements.map(renderElement)}

        {/* ── Layer 180: Paper texture (inline SVG, multiply blend) ── */}
        {selectedPaper && (() => {
          const p       = getPaperTextureFilterParams(selectedPaper.texture)
          const opacity = Math.min(selectedPaper.overlayOpacity * 3, 0.20)
          const fid     = `cp-pt-${selectedPaper.id}`
          return (
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ width: '100%', height: '100%', opacity, mixBlendMode: 'multiply', zIndex: 180, overflow: 'hidden' }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id={fid} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="linearRGB">
                  <feTurbulence type={p.type} baseFrequency={p.freq} numOctaves={p.octaves} stitchTiles="stitch" />
                  <feColorMatrix type="saturate" values="0" />
                </filter>
              </defs>
              <rect width="100%" height="100%" filter={`url(#${fid})`} opacity={p.noiseOp} />
            </svg>
          )
        })()}
      </div>

      {/* ── Layer 182: Catch-light gradient (always) ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex:     182,
          background: [
            'radial-gradient(ellipse at 22% 11%, rgba(255,255,255,0.09) 0%, transparent 54%)',
            'radial-gradient(ellipse at 80% 90%, rgba(44,36,22,0.055) 0%, transparent 46%)',
          ].join(', '),
        }}
      />

      {/* ── Layer 185: Gloss / pearl sheen (glans + pearl papers) ── */}
      {selectedPaper && (selectedPaper.tags.includes('glans') || selectedPaper.texture === 'pearl') && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex:        185,
            mixBlendMode:  'screen',
            background:    'linear-gradient(138deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 30%, transparent 60%, rgba(255,255,255,0.04) 100%)',
          }}
        />
      )}

      {/* ── Layer 190: Edge depth inset shadow (always) ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex:    190,
          boxShadow: [
            `inset 0  1px 0 rgba(255,255,255,0.22)`,
            `inset 0 -1px 0 rgba(44,36,22,0.07)`,
            `inset  1px 0 0 rgba(255,255,255,0.10)`,
            `inset -1px 0 0 rgba(44,36,22,0.04)`,
          ].join(', '),
        }}
      />
    </div>
  )
}
