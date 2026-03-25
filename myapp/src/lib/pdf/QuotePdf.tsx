import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatEuro } from '@/lib/money'

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuotePdfProps = {
  templateName: string
  designName?: string | null
  babyName?: string | null
  items: {
    id: string
    name: string
    priceCents: number
    personalizationText?: string | null
  }[]
  totalCents: number
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    color: '#111827',
  },

  // Header
  header: {
    marginBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 16,
  },
  brand: {
    fontSize: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 3,
  },
  metaLabel: {
    color: '#6b7280',
    width: 72,
  },
  metaValue: {
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
    flex: 1,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },

  // Item rows
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rowLeft: {
    flex: 1,
    paddingRight: 12,
  },
  itemName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  itemSub: {
    color: '#6b7280',
    fontSize: 9,
    marginTop: 2,
  },
  itemPrice: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    textAlign: 'right',
  },
  emptyText: {
    color: '#9ca3af',
    fontStyle: 'italic',
    paddingVertical: 8,
  },

  // Total
  totalBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#111827',
  },
  totalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
  },
  totalSub: {
    color: '#6b7280',
    fontSize: 8,
    marginTop: 2,
  },
  totalPrice: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
    marginBottom: 2,
  },
})

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuotePdf({
  templateName,
  designName,
  babyName,
  items,
  totalCents,
}: QuotePdfProps) {
  return (
    <Document
      title="Offerte Studio Twaalf"
      author="Studio Twaalf"
      subject="Vrijblijvende offerte"
    >
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.brand}>Studio Twaalf</Text>
          <Text style={styles.title}>Offerte</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Template</Text>
            <Text style={styles.metaValue}>{templateName}</Text>
          </View>

          {designName ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Ontwerp</Text>
              <Text style={styles.metaValue}>{designName}</Text>
            </View>
          ) : null}

          {babyName ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Naam</Text>
              <Text style={styles.metaValue}>{babyName}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Gadgets ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gekozen gadgets</Text>

          {items.length === 0 ? (
            <Text style={styles.emptyText}>Geen gadgets geselecteerd.</Text>
          ) : (
            items.map((item, i) => (
              <View key={i} style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.personalizationText ? (
                    <Text style={styles.itemSub}>Naam: {item.personalizationText}</Text>
                  ) : null}
                </View>
                <Text style={styles.itemPrice}>
                  {formatEuro(item.priceCents ?? 0)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* ── Total ── */}
        <View style={styles.totalBlock}>
          <View>
            <Text style={styles.totalLabel}>Indicatief totaal</Text>
            <Text style={styles.totalSub}>Bestellen is niet verplicht.</Text>
          </View>
          <Text style={styles.totalPrice}>{formatEuro(totalCents)}</Text>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Dit is een vrijblijvende offerte. Bestellen is niet verplicht.
          </Text>
          <Text style={styles.footerText}>
            Studio Twaalf · hello@studiotwaalf.be
          </Text>
        </View>

      </Page>
    </Document>
  )
}
