'use client'

/**
 * MockupComposition — premium editorial flat-lay.
 *
 * One unified scene: card + gadgets share the same surface.
 * No boxes, no borders, no decorative illustrations.
 * Product images sit directly on the warm background via mix-blend-mode multiply.
 *
 * Virtual canvas 660 × 495 (4 : 3), CSS-scaled to container width.
 */

import { useRef, useEffect, useState, useMemo } from 'react'
import CardPreview from '@/components/editor/CardPreview'
import type { TemplateDesign } from '@/types/template'
import type { SelectedGadget } from '@/lib/gadget-personalization'
import { gadgetVirtualSize } from '@/lib/product-dimensions'
import type { GadgetVirtualDims } from '@/lib/product-dimensions'

// ─── Virtual canvas ────────────────────────────────────────────────────────────

const V_W = 660
const V_H = 495

// ─── GadgetObject — no container, pure surface element ────────────────────────

interface GadgetObjectProps {
  gadget:    SelectedGadget
  /**
   * Max-width in virtual-px.  For portrait images this is narrower than maxHeight;
   * for landscape images it is the dominant dimension.
   */
  maxWidth:  number
  /**
   * Max-height in virtual-px.  For portrait images this is the dominant dimension;
   * for landscape images it is shorter than maxWidth.
   */
  maxHeight: number
}

function GadgetObject({ gadget, maxWidth, maxHeight }: GadgetObjectProps) {
  const isUrl = typeof gadget.emoji === 'string' &&
                (gadget.emoji.startsWith('/') || gadget.emoji.startsWith('http'))
  const qty = gadget.quantity ?? 1
  // Shadow scale off the dominant axis for consistent depth
  const dom = Math.max(maxWidth, maxHeight)
  const sdw = `drop-shadow(0 ${Math.round(dom * 0.07)}px ${Math.round(dom * 0.20)}px rgba(44,36,22,0.28)) drop-shadow(0 2px 5px rgba(44,36,22,0.14))`

  return (
    /*
     * No background, no border, no box — the product IS the object.
     * `display: inline-block` so the wrapper hugs the image naturally.
     */
    <div style={{ position: 'relative', userSelect: 'none', pointerEvents: 'none', display: 'inline-block' }}>
      {isUrl ? (
        /*
         * Product image — constrained by maxWidth AND maxHeight so the browser
         * fits the image within the physically-correct bounding box while
         * preserving its natural aspect ratio.
         * mix-blend-mode: multiply dissolves the white product background
         * into the warm sand surface so the object appears to sit directly
         * on the scene.
         */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={gadget.emoji}
          alt=""
          style={{
            maxWidth:     maxWidth,
            maxHeight:    maxHeight,
            width:        'auto',
            height:       'auto',
            display:      'block',
            mixBlendMode: 'multiply',
            filter:       sdw,
          }}
        />
      ) : (
        /* Emoji — square container, centred */
        <div
          style={{
            width:          maxWidth,
            height:         maxHeight,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            filter:         sdw,
          }}
        >
          <span style={{ fontSize: Math.round(Math.min(maxWidth, maxHeight) * 0.78), lineHeight: 1 }}>
            {gadget.emoji ?? '📦'}
          </span>
        </div>
      )}

      {/* Quantity badge — no blend mode, stays on top */}
      {qty > 1 && (
        <span
          style={{
            position:      'absolute',
            top:           -6,
            right:         -8,
            background:    'rgba(44,36,22,0.82)',
            color:         '#F4EFE6',
            fontSize:      Math.max(8, Math.round(dom * 0.10)),
            fontWeight:    700,
            lineHeight:    1,
            borderRadius:  10,
            padding:       `3px 7px`,
            letterSpacing: '-0.01em',
          }}
        >
          ×{qty}
        </span>
      )}
    </div>
  )
}

// ─── Placement ────────────────────────────────────────────────────────────────

interface Placement {
  x:               number   // virtual-px left edge
  y:               number   // virtual-px top edge
  rotate:          number   // deg
  /**
   * CSS transform-origin for the rotation.
   * Using 'center bottom' on tall objects makes them lean from their base,
   * exactly how a standing product looks when it rests on a flat surface.
   * 'center' is correct for flat / wide objects (labels, stickers).
   */
  transformOrigin: string
  maxWidth:        number   // image max-width (virtual-px)
  maxHeight:       number   // image max-height (virtual-px)
  /** Dominant dimension — used for spacing / overlap calculations. */
  dominant:        number
  zIndex:          number
}

/**
 * Builds up to 3 placements anchored to the card's right edge.
 *
 * Editorial flat-lay composition rules:
 *
 *   — Horizontal spread: gadgets fan out to the RIGHT of the card.
 *     Each gadget's left edge starts where the previous gadget ends
 *     (plus a gap, or negative gap = overlap when space is tight).
 *     This keeps the cluster readable — products sit side by side,
 *     as they would in a real flat-lay photo.
 *
 *   — Vertical anchor: all gadgets are centred on `anchorY` (≈ 42% of
 *     card height from the top), with a small per-slot bias (±20–30 px).
 *     No gadget is placed at the top or bottom of the card in isolation.
 *
 *   — Overlap:  gadgets start 25 px left of the card's right edge so they
 *               feel physically anchored to the scene.
 *
 *   — Rotation: each slot has its own direction and pivot point.
 *               'center bottom' pivots from the base → object leans naturally.
 *
 *   — Layers:   slot 0 (primary) z=5, slot 1 (secondary) z=3, slot 2 (accent) z=4.
 *               For 3 gadgets: accent is tucked between primary and secondary,
 *               slightly higher — creates depth without breaking the horizontal flow.
 */
function buildPlacements(
  gadgetDims: GadgetVirtualDims[],
  cardX:      number,
  cardY:      number,
  cardVW:     number,
  cardVH:     number,
): Placement[] {
  const count = gadgetDims.length
  if (count === 0) return []

  // Gadgets start 25 px left of the card right edge (anchors them to the scene)
  const overlapPx = 25
  const startX    = cardX + cardVW - overlapPx
  const endX      = V_W - 8   // right canvas margin

  // Vertical anchor: slightly above card centre
  const anchorY = cardY + Math.round(cardVH * 0.42)
  const clampY  = (y: number, h: number) => Math.max(6, Math.min(V_H - h - 6, y))

  /** Build one placement; vBias = fraction of maxHeight placed above anchorY. */
  const slot = (
    d:       GadgetVirtualDims,
    x:       number,
    vBias:   number,
    rotate:  number,
    origin:  string,
    zIndex:  number,
  ): Placement => ({
    x,
    y:               clampY(anchorY - Math.round(d.maxHeight * vBias), d.maxHeight),
    rotate,
    transformOrigin: origin,
    maxWidth:        d.maxWidth,
    maxHeight:       d.maxHeight,
    dominant:        d.dominant,
    zIndex,
  })

  // ── 1 gadget ──────────────────────────────────────────────────────────────
  if (count === 1) {
    const d     = gadgetDims[0]
    const zoneW = endX - startX
    const x     = startX + Math.max(0, Math.round((zoneW - d.maxWidth) / 2))
    return [slot(d, x, 0.50, 4, 'center bottom', 5)]
  }

  // ── 2 gadgets — side by side ──────────────────────────────────────────────
  if (count === 2) {
    const d0 = gadgetDims[0]
    const d1 = gadgetDims[1]
    const zoneW    = endX - startX
    const idealGap = 14
    // Allow overlap (negative gap) when zone is too narrow, capped at 30 % of the narrower gadget
    const gap = Math.max(
      -Math.round(Math.min(d0.maxWidth, d1.maxWidth) * 0.30),
      Math.min(idealGap, zoneW - d0.maxWidth - d1.maxWidth),
    )
    // Shift the whole cluster left if the right gadget overflows the canvas
    const rawRight  = startX + d0.maxWidth + gap + d1.maxWidth
    const shiftLeft = Math.max(0, rawRight - endX)
    const x0        = startX - shiftLeft
    const x1        = x0 + d0.maxWidth + gap

    return [
      slot(d0, x0, 0.52, 5,  'center bottom', 5),
      slot(d1, x1, 0.44, -4, 'center bottom', 3),
    ]
  }

  // ── 3 gadgets — primary left, secondary right, accent bridging above ──────
  {
    const d0 = gadgetDims[0]
    const d1 = gadgetDims[1]
    const d2 = gadgetDims[2]

    // Primary: starts at startX
    const x0 = startX

    // Secondary: to the right of primary (small gap; overlap allowed)
    const gap01 = Math.max(-Math.round(d0.maxWidth * 0.25), 8)
    const x1    = Math.min(endX - d1.maxWidth, x0 + d0.maxWidth + gap01)

    // Accent: horizontally between primary and secondary, slightly higher
    const x2 = Math.min(endX - d2.maxWidth,
                 Math.round(x0 + (x1 - x0) * 0.35))

    return [
      slot(d0, x0, 0.54,  5, 'center bottom', 5),
      slot(d1, x1, 0.43, -4, 'center bottom', 3),
      slot(d2, x2, 0.70,  3, 'center',        4),
    ]
  }
}

// ─── Per-gadget size calculation ──────────────────────────────────────────────

/**
 * Returns the virtual-canvas bounding box (maxWidth, maxHeight, dominant) for a
 * gadget in the composition.
 *
 * Priority:
 *   1. Real product dimensions → gadgetVirtualSize() with dominant-axis logic
 *   2. Visual heuristic (% of card height) — used when no dims stored
 *
 * `slotIndex`  is 0-based: 0 = primary, 1 = secondary, 2 = accent (smaller).
 * `totalCount` controls the heuristic size so gadgets don't overflow the zone
 *              when placed side by side:
 *                1 gadget  → larger (zone all to itself)
 *                2 gadgets → moderate (two must fit side by side)
 *                3 gadgets → smaller (three must cluster without chaos)
 *
 * Limits are proportional to cardVH, not hardcoded, so a tall product next to a
 * tall card can actually render close to card height:
 *   MIN_PX = max(32, cardVH × 0.12)   — at least 12 % of card height
 *   MAX_PX = cardVH × 1.35             — up to 35 % taller than the card
 */
function resolveGadgetDims(
  gadget:           SelectedGadget,
  slotIndex:        number,
  totalCount:       number,
  artboardWidthMm:  number,
  artboardHeightMm: number,
  cardVW:           number,
  cardVH:           number,
): GadgetVirtualDims {
  const MIN_PX = Math.max(32, Math.round(cardVH * 0.12))
  const MAX_PX = Math.round(cardVH * 1.35)

  if (gadget.dimensions) {
    return gadgetVirtualSize(
      gadget.dimensions,
      artboardWidthMm,
      artboardHeightMm,
      cardVW,
      cardVH,
      MIN_PX,
      MAX_PX,
    )
  }

  // Heuristic fallback: dominant dimension as a fraction of card height.
  // Fractions decrease with count so multiple gadgets fit side-by-side.
  // Aspect ratio unknown → assume square.
  const heuristic: number[][] = [
    [0.60],             // 1 gadget  — large, takes the whole right zone
    [0.42, 0.40],       // 2 gadgets — smaller to fit side by side
    [0.36, 0.34, 0.30], // 3 gadgets — compact cluster
  ]
  const row      = heuristic[Math.min(totalCount - 1, 2)] ?? heuristic[2]
  const frac     = row[slotIndex] ?? row[row.length - 1]
  const dominant = Math.min(MAX_PX, Math.round(cardVH * frac))
  return { maxWidth: dominant, maxHeight: dominant, dominant }
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  templateDesign: TemplateDesign
  gadgets:        SelectedGadget[]
  paperId:        string | null
  artboardId?:    string
}

export default function MockupComposition({
  templateDesign,
  gadgets,
  paperId,
  artboardId,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        setScale(containerRef.current.offsetWidth / V_W)
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const artboard = useMemo(
    () =>
      (artboardId
        ? templateDesign.artboards.find((a) => a.id === artboardId)
        : templateDesign.artboards[0]) ?? templateDesign.artboards[0],
    [templateDesign, artboardId],
  )

  if (!artboard) return null

  const hasGadgets     = gadgets.length > 0
  // Max 3 in the scene; rest shown in "+N meer" badge
  const displayGadgets = gadgets.slice(0, 3)
  const overflowCount  = gadgets.length - 3

  // ── Card sizing ──────────────────────────────────────────────────────────────
  // With gadgets: card takes left 46 % of stage (right side reserved for cluster)
  // Without:      card centred at 54 % width
  const cardAspect = artboard.width / artboard.height

  const cardMaxW = hasGadgets ? Math.round(V_W * 0.46) : Math.round(V_W * 0.54)
  const cardVH_  = Math.round(cardMaxW / cardAspect)
  const maxVH    = Math.round(V_H * 0.92)
  const cardVH   = Math.min(cardVH_, maxVH)
  const cardVW   = Math.round(cardVH * cardAspect)

  const cardX = hasGadgets
    ? Math.round(V_W * 0.05)
    : Math.round((V_W - cardVW) / 2)
  const cardY = Math.round((V_H - cardVH) / 2)

  // Compute per-gadget virtual bounding boxes (real dimensions or heuristic fallback)
  const gadgetDims = displayGadgets.map((g, i) =>
    resolveGadgetDims(g, i, displayGadgets.length, artboard.width, artboard.height, cardVW, cardVH),
  )

  const placements = hasGadgets
    ? buildPlacements(gadgetDims, cardX, cardY, cardVW, cardVH)
    : []

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', aspectRatio: '4 / 3', position: 'relative', overflow: 'hidden', borderRadius: 24 }}
    >
      {/* ── Virtual canvas, CSS-scaled ────────────────────────────────────── */}
      <div
        style={{
          position:        'absolute',
          top: 0, left: 0,
          width:           V_W,
          height:          V_H,
          transform:       `scale(${scale})`,
          transformOrigin: 'top left',
          /*
           * Background surface — 148° so the light "source" sits top-left.
           * Lighter top-left (#F8F3EA) fades through warm mid-tone to a
           * slightly richer bottom-right (#E2D7B4), giving the surface depth
           * without making it look like a coloured backdrop.
           */
          background:      'linear-gradient(148deg, #F8F3EA 0%, #EDE3CC 52%, #E2D7B4 100%)',
        }}
      >

        {/*
          * ── Scene lighting stack (all zIndex 0 — under card and gadgets) ──
          *
          * Four thin layers that together simulate soft studio daylight:
          *
          *   1. Studio light  — warm radial highlight from top-left corner,
          *                      imitating a large softbox or window at ~10 o'clock.
          *                      Keeps the surface feeling lit without a spotlight.
          *
          *   2. Linen grain   — very low-opacity noise that breaks up the digital
          *                      smoothness of the gradient, making the surface feel
          *                      tactile rather than rendered.
          *
          *   3. Vignette      — slightly stronger than before (0.12 vs 0.09) and
          *                      centred slightly above mid (48%) to pull focus
          *                      toward the card area.
          *
          *   4. Ground shadow — a very soft upward gradient at the bottom edge.
          *                      Grounds the scene; prevents the composition from
          *                      feeling like it floats against a white void.
          */}

        {/* 1. Studio light */}
        <div
          aria-hidden
          style={{
            position:   'absolute', inset: 0,
            background: 'radial-gradient(ellipse 80% 70% at 18% 12%, rgba(255,250,238,0.30) 0%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* 2. Linen grain */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">' +
              '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/>' +
              '<feColorMatrix type="saturate" values="0"/></filter>' +
              '<rect width="80" height="80" filter="url(#n)" opacity="0.065"/></svg>'
            )}")`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* 3. Background vignette */}
        <div
          aria-hidden
          style={{
            position:   'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 48% 48%, transparent 26%, rgba(44,36,22,0.12) 100%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* 4. Ground shadow */}
        <div
          aria-hidden
          style={{
            position:   'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(44,36,22,0.07) 0%, transparent 32%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* ── Card ─────────────────────────────────────────────────────────── */}
        <div
          style={{
            position:  'absolute',
            left:      cardX,
            top:       cardY,
            transform: `rotate(${hasGadgets ? -2 : -1}deg)`,
            /*
             * drop-shadow traces the combined alpha boundary of ALL children
             * (paper-edge layer + card face), so both cast a single unified
             * shadow — exactly as a real printed card would look in a photo.
             */
            filter:    'drop-shadow(0 18px 44px rgba(44,36,22,0.20)) drop-shadow(0 4px 12px rgba(44,36,22,0.13)) drop-shadow(0 1px 3px rgba(44,36,22,0.09))',
            zIndex:    2,
          }}
        >
          {/*
           * Paper-edge layer — offset 3 px below-right of the card face.
           *
           * Simulates the visible side of the card stock.  Three stacked
           * pixel-strips of decreasing opacity give an impression of actual
           * paper depth rather than a single flat stripe.
           *
           * Colour is a warm cream-tan (not grey) to stay coherent with the
           * Studio Twaalf flat-lay surface palette.  The gradient shifts from
           * a slightly lighter top-left to a darker bottom-right, following
           * the assumed overhead light source.
           *
           * aria-hidden — purely decorative, contains no accessible content.
           */}
          <div
            aria-hidden
            style={{
              position:   'absolute',
              top:         3,
              left:        3,
              width:       cardVW,
              height:      cardVH,
              background:  'linear-gradient(150deg, #CFC2A2 0%, #C0B28B 100%)',
              borderRadius: 2,
            }}
          />

          {/* Card face — renders naturally above the paper-edge layer */}
          <CardPreview
            design={templateDesign}
            artboardId={artboardId}
            paperId={paperId ?? undefined}
            width={cardVW}
          />
        </div>

        {/* ── Gadgets ──────────────────────────────────────────────────────── */}
        {displayGadgets.map((gadget, i) => {
          const pl = placements[i]
          if (!pl) return null
          return (
            <div
              key={gadget.id}
              style={{
                position:        'absolute',
                left:            pl.x,
                top:             pl.y,
                transform:       `rotate(${pl.rotate}deg)`,
                transformOrigin: pl.transformOrigin,
                zIndex:          pl.zIndex,
              }}
            >
              <GadgetObject gadget={gadget} maxWidth={pl.maxWidth} maxHeight={pl.maxHeight} />
            </div>
          )
        })}

        {/* ── "+N meer" badge ───────────────────────────────────────────────── */}
        {overflowCount > 0 && (
          <div
            style={{
              position:      'absolute',
              right:         20,
              bottom:        18,
              background:    'rgba(44,36,22,0.60)',
              backdropFilter:'blur(8px)',
              color:         '#F4EFE6',
              borderRadius:  20,
              padding:       '4px 12px',
              fontSize:      12,
              fontWeight:    600,
              letterSpacing: '0.03em',
              zIndex:        8,
              userSelect:    'none',
            }}
          >
            +{overflowCount} meer
          </div>
        )}

        {/*
          * ── Scene-level frame vignette ────────────────────────────────────
          * Sits above card, gadgets, and the "+N meer" badge.
          * Very low opacity (0.06) so it never visibly darkens the card face
          * — it only feathers the scene edges, pulling the eye inward.
          * Needs its own borderRadius to match the outer container's clip.
          */}
        <div
          aria-hidden
          style={{
            position:     'absolute', inset: 0,
            background:   'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(44,36,22,0.06) 100%)',
            pointerEvents:'none',
            borderRadius: 24,
            zIndex:       9,
          }}
        />

      </div>
    </div>
  )
}
