/**
 * GadgetsPdf — React-PDF document for the gadgets preview export.
 *
 * Layout: A4 portrait, 2 cards per row, 2 rows per page = 4 gadgets/page.
 * Each card shows a product image (or placeholder), a name overlay positioned
 * via PreviewConfig bounding-box coordinates, and a small info strip below.
 *
 * Test checklist:
 *   [ ] Product with absolute image URL → image rendered in preview block
 *   [ ] Product without image (emoji/null) → indigo placeholder rectangle
 *   [ ] previewConfig present → overlay in correct bounding box (absolute pt)
 *   [ ] previewConfig absent  → DEFAULT_PREVIEW_CONFIG used (bottom 25%)
 *   [ ] chip.enabled true     → frosted background on overlay
 *   [ ] chip.enabled false    → plain text, no background
 *   [ ] personalizationText null → "Naam niet ingevuld" in gray
 *   [ ] White color selection → white text (chip background provides contrast)
 *   [ ] Playfair font         → Times-Roman in PDF
 *   [ ] 4+ gadgets            → multiple pages created
 *   [ ] 0 gadgets             → single "geen gadgets" page
 *   [ ] Footer shows page X/Y on every page
 */

import React from 'react'
import { Document, Page, View, Text, Image as PdfImage } from '@react-pdf/renderer'
import type { GadgetPdfItem } from '@/lib/personalization/effective'
import { DEFAULT_PREVIEW_CONFIG } from '@/lib/personalization/previewConfig'
import type { PreviewConfig } from '@/lib/personalization/previewConfig'
import type { GadgetPersonalization } from '@/lib/gadget-personalization'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  designId:     string
  templateName: string
  gadgets:      GadgetPdfItem[]
}

// ─── Page layout constants (all in pt; 72pt = 1 inch) ─────────────────────────

const PAGE_W = 595   // A4 portrait
const PAGE_H = 842
const MARGIN = 40
const CONTENT_W = PAGE_W - MARGIN * 2  // 515
const CARD_GAP   = 14
const COLS       = 2
const CARDS_PER_PAGE = COLS * 2          // 4

// Card dimensions
const CARD_W     = (CONTENT_W - CARD_GAP) / COLS   // ~250.5 → floor to 250
const CARD_W_PT  = Math.floor(CARD_W)               // 250
const CARD_H_PT  = 318
const PREVIEW_H  = 200   // image / placeholder area
const INFO_H     = CARD_H_PT - PREVIEW_H            // 118

// Header / footer heights (used to check page content fits)
const HEADER_H_P0 = 52    // page 0: big title
const HEADER_H_PN = 24    // other pages: small repeated header
const FOOTER_H    = 22

// ─── Font & color helpers ─────────────────────────────────────────────────────

function pdfFontFamily(font?: GadgetPersonalization['font']): string {
  return font === 'playfair' ? 'Times-Roman' : 'Helvetica'
}

function pdfTextColor(color?: GadgetPersonalization['color']): string {
  if (color === 'white')    return '#ffffff'
  if (color === 'darkgray') return '#555555'
  return '#111111'
}

function formatPrice(cents: number): string {
  return `Vanaf\u00a0€\u202f${(cents / 100).toFixed(2).replace('.', ',')}`
}

// ─── Name overlay ─────────────────────────────────────────────────────────────

function NameOverlay({
  text,
  config,
  personalization,
}: {
  text:            string | null
  config:          PreviewConfig
  personalization: GadgetPersonalization
}) {
  const isPlaceholder = !text
  const displayText   = text ?? 'Naam niet ingevuld'

  const fontFamilyPdf = pdfFontFamily(isPlaceholder ? undefined : personalization.font)
  const colorPdf      = isPlaceholder ? '#9CA3AF' : pdfTextColor(personalization.color)
  const whiteContrast = personalization.color === 'white' && !isPlaceholder

  // Scale fontSizePx (CSS px in the 460-px-tall modal preview) to PDF pt.
  // Factor 0.33 maps the default 28 px → 9.2 pt, matching the old hardcoded 9pt.
  // Clamped to [7, 14] so names are always legible and don't overflow the card.
  const FONT_SIZE = Math.max(7, Math.min(14, Math.round((personalization.fontSizePx ?? 28) * 0.33)))

  // ── textPos: drag-to-position center-point mode ──────────────────────────────
  if (personalization.textPos) {
    const tp  = personalization.textPos
    const bnd = config.text.box
    const chip = config.text.chip

    // Absolute center in pt
    const absX = ((bnd.xPct + (tp.xPct / 100) * bnd.wPct) / 100) * CARD_W_PT
    const absY = ((bnd.yPct + (tp.yPct / 100) * bnd.hPct) / 100) * PREVIEW_H

    // Estimate text width to center the View around absX.
    // Rough Helvetica char width ≈ FONT_SIZE × 0.58 per character
    const estCharW   = FONT_SIZE * 0.58
    const estTextW   = Math.min(displayText.length * estCharW + 10, bnd.wPct / 100 * CARD_W_PT)
    const chipPad    = chip?.enabled ? (chip.paddingPct / 100) * CARD_W_PT : 0
    const labelW     = estTextW + chipPad * 2
    // Clamp so the label stays within the bounds rectangle
    const bndLeft    = (bnd.xPct / 100) * CARD_W_PT
    const bndRight   = ((bnd.xPct + bnd.wPct) / 100) * CARD_W_PT
    const labelLeft  = Math.max(bndLeft, Math.min(absX - labelW / 2, bndRight - labelW))
    const labelTop   = Math.max(0, absY - (FONT_SIZE + chipPad * 2) / 2)

    return (
      <View
        style={{
          position: 'absolute',
          left:     labelLeft,
          top:      labelTop,
          width:    labelW,
          ...(chip?.enabled ? {
            backgroundColor: `rgba(255,255,255,${chip.opacity})`,
            // borderRadius: 0 crashes @react-pdf/stylesheet (0 is falsy in resolveBorderShorthand)
            ...(chip.radius > 0 ? { borderRadius: chip.radius } : {}),
            padding:         chipPad,
          } : {}),
        }}
      >
        <Text
          style={{
            fontFamily: fontFamilyPdf,
            fontSize:   FONT_SIZE,
            color:      colorPdf,
            textAlign:  'center',
            ...(whiteContrast && chip?.enabled && chip.opacity < 0.5
              ? { backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 2, padding: 1 }
              : {}),
          }}
        >
          {displayText}
        </Text>
      </View>
    )
  }

  // ── Bounding-box fill mode (default) ─────────────────────────────────────────
  const { box, align, verticalAlign, chip } = config.text

  const x = (box.xPct / 100) * CARD_W_PT
  const y = (box.yPct / 100) * PREVIEW_H
  const w = (box.wPct / 100) * CARD_W_PT
  const h = (box.hPct / 100) * PREVIEW_H
  const chipPad = chip?.enabled ? (chip.paddingPct / 100) * CARD_W_PT : 0

  const justifyContent =
    verticalAlign === 'top'    ? 'flex-start' :
    verticalAlign === 'bottom' ? 'flex-end'   : 'center'

  const alignItems =
    align === 'left'  ? 'flex-start' :
    align === 'right' ? 'flex-end'   : 'center'

  return (
    <View
      style={{
        position:        'absolute',
        left:            x,
        top:             y,
        width:           w,
        height:          h,
        flexDirection:   'column',
        alignItems,
        justifyContent,
        overflow:        'hidden',
        ...(chip?.enabled ? {
          backgroundColor: `rgba(255,255,255,${chip.opacity})`,
          // borderRadius: 0 crashes @react-pdf/stylesheet (0 is falsy in resolveBorderShorthand)
          ...(chip.radius > 0 ? { borderRadius: chip.radius } : {}),
          padding:         chipPad,
        } : {}),
      }}
    >
      <Text
        style={{
          fontFamily: fontFamilyPdf,
          fontSize:   FONT_SIZE,
          color:      colorPdf,
          // For white text on a light chip: nudge opacity so it's readable even without shadow
          ...(whiteContrast && chip?.enabled && chip.opacity < 0.5
            ? { backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 2, padding: 1 }
            : {}),
        }}
      >
        {displayText}
      </Text>
    </View>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function GadgetCard({ gadget, last }: { gadget: GadgetPdfItem; last: boolean }) {
  const config    = gadget.previewConfig ?? DEFAULT_PREVIEW_CONFIG
  const isImage   = typeof gadget.imageUrl === 'string' &&
                    (gadget.imageUrl.startsWith('http://') ||
                     gadget.imageUrl.startsWith('https://'))

  return (
    <View
      style={{
        width:        CARD_W_PT,
        height:       CARD_H_PT,
        borderWidth:  1,
        borderColor:  '#E5E7EB',
        borderStyle:  'solid',
        borderRadius: 8,
        overflow:     'hidden',
        marginRight:  last ? 0 : CARD_GAP,
      }}
    >
      {/* ── Preview area ── */}
      <View
        style={{
          width:           CARD_W_PT,
          height:          PREVIEW_H,
          backgroundColor: '#EEF2FF',   // indigo-50
          position:        'relative',
          overflow:        'hidden',
        }}
      >
        {isImage ? (
          <PdfImage
            src={gadget.imageUrl!}
            style={{ width: CARD_W_PT, height: PREVIEW_H, objectFit: 'cover' }}
          />
        ) : (
          /* Placeholder: two-tone indigo gradient via nested Views */
          <View
            style={{
              position:        'absolute',
              top:             0,
              left:            0,
              width:           CARD_W_PT,
              height:          PREVIEW_H,
              backgroundColor: '#C7D2FE', // indigo-200
              alignItems:      'center',
              justifyContent:  'center',
            }}
          >
            <Text style={{ fontFamily: 'Helvetica', fontSize: 9, color: '#6366F1' }}>
              {/* Show first 2 chars of product name as stand-in icon */}
              {gadget.name.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Name bounding-box overlay */}
        <NameOverlay
          text={gadget.personalizationText}
          config={config}
          personalization={gadget.personalization}
        />
      </View>

      {/* ── Info strip ── */}
      <View
        style={{
          width:           CARD_W_PT,
          height:          INFO_H,
          backgroundColor: '#ffffff',
          padding:         10,
          justifyContent:  'center',
        }}
      >
        <Text
          style={{
            fontFamily: 'Helvetica-Bold',
            fontSize:   10,
            color:      '#111827',
          }}
        >
          {gadget.name}
        </Text>

        {gadget.priceCents > 0 && (
          <Text
            style={{
              fontFamily: 'Helvetica',
              fontSize:   8.5,
              color:      '#6B7280',
              marginTop:  3,
            }}
          >
            {formatPrice(gadget.priceCents)}
          </Text>
        )}

        {gadget.personalizationText && (
          <Text
            style={{
              fontFamily:      'Helvetica',
              fontSize:        8,
              color:           '#4F46E5',
              marginTop:       5,
              backgroundColor: '#EEF2FF',
              borderRadius:    3,
              padding:         3,
            }}
          >
            Naam: {gadget.personalizationText}
          </Text>
        )}

        {!gadget.personalizationText && (
          <Text
            style={{
              fontFamily: 'Helvetica',
              fontSize:   8,
              color:      '#D97706',   // amber-600
              marginTop:  5,
            }}
          >
            Nog geen naam ingevuld
          </Text>
        )}
      </View>
    </View>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function GadgetsPage({
  gadgets,
  pageIndex,
  totalPages,
  templateName,
  designId,
}: {
  gadgets:      GadgetPdfItem[]
  pageIndex:    number
  totalPages:   number
  templateName: string
  designId:     string
}) {
  const row1 = gadgets.slice(0, 2)
  const row2 = gadgets.slice(2, 4)

  // Pad rows to always render 2 invisible placeholders so layout is symmetric
  while (row1.length < 2) row1.push(null as unknown as GadgetPdfItem)
  while (row2.length < 2) row2.push(null as unknown as GadgetPdfItem)

  return (
    <Page
      size="A4"
      style={{
        paddingTop:    MARGIN,
        paddingBottom: MARGIN,
        paddingLeft:   MARGIN,
        paddingRight:  MARGIN,
        fontFamily:    'Helvetica',
      }}
    >
      {/* ── Header ── */}
      {pageIndex === 0 ? (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 18, color: '#111827' }}>
            Gadgets preview
          </Text>
          <Text style={{ fontFamily: 'Helvetica', fontSize: 9, color: '#9CA3AF', marginTop: 3 }}>
            {templateName} · ontwerp {designId.slice(0, 8)}
          </Text>
        </View>
      ) : (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontFamily: 'Helvetica', fontSize: 9, color: '#9CA3AF' }}>
            Gadgets preview · {templateName}
          </Text>
        </View>
      )}

      {/* ── Card grid ── */}
      <View style={{ flex: 1 }}>
        {/* Row 1 */}
        <View style={{ flexDirection: 'row', marginBottom: CARD_GAP }}>
          {row1.map((g, i) =>
            g ? (
              <GadgetCard key={g.id} gadget={g} last={i === row1.length - 1} />
            ) : (
              <View key={`ph-r1-${i}`} style={{ width: CARD_W_PT }} />
            )
          )}
        </View>

        {/* Row 2 — only if there's content */}
        {gadgets.length > 2 && (
          <View style={{ flexDirection: 'row' }}>
            {row2.map((g, i) =>
              g ? (
                <GadgetCard key={g.id} gadget={g} last={i === row2.length - 1} />
              ) : (
                <View key={`ph-r2-${i}`} style={{ width: CARD_W_PT }} />
              )
            )}
          </View>
        )}
      </View>

      {/* ── Footer ── */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          borderTopStyle: 'solid',
          paddingTop:     8,
          marginTop:      10,
          flexDirection:  'row',
          justifyContent: 'space-between',
          alignItems:     'center',
        }}
      >
        <Text style={{ fontFamily: 'Helvetica', fontSize: 7.5, color: '#9CA3AF', fontStyle: 'italic' }}>
          Voorbeeld – niet druk-klaar
        </Text>
        <Text style={{ fontFamily: 'Helvetica', fontSize: 7.5, color: '#9CA3AF' }}>
          {pageIndex + 1} / {totalPages}
        </Text>
      </View>
    </Page>
  )
}

// ─── Document ─────────────────────────────────────────────────────────────────

export default function GadgetsPdf({ designId, templateName, gadgets }: Props) {
  // Empty state
  if (gadgets.length === 0) {
    return (
      <Document title="Gadgets preview">
        <Page size="A4" style={{ padding: MARGIN, fontFamily: 'Helvetica' }}>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 18, color: '#111827', marginBottom: 12 }}>
            Gadgets preview
          </Text>
          <Text style={{ fontSize: 11, color: '#6B7280' }}>
            Geen gadgets geselecteerd voor dit ontwerp.
          </Text>
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
              borderTopStyle: 'solid',
              paddingTop:     8,
              marginTop:      20,
            }}
          >
            <Text style={{ fontSize: 7.5, color: '#9CA3AF', fontStyle: 'italic' }}>
              Voorbeeld – niet druk-klaar
            </Text>
          </View>
        </Page>
      </Document>
    )
  }

  // Chunk gadgets into pages of CARDS_PER_PAGE
  const pages: GadgetPdfItem[][] = []
  for (let i = 0; i < gadgets.length; i += CARDS_PER_PAGE) {
    pages.push(gadgets.slice(i, i + CARDS_PER_PAGE))
  }

  return (
    <Document title="Gadgets preview">
      {pages.map((pageGadgets, i) => (
        <GadgetsPage
          key={i}
          gadgets={pageGadgets}
          pageIndex={i}
          totalPages={pages.length}
          templateName={templateName}
          designId={designId}
        />
      ))}
    </Document>
  )
}
