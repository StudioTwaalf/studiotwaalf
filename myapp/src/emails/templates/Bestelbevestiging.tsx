import { Hr, Row, Section, Text } from '@react-email/components'
import * as React from 'react'
import {
  EmailFooter,
  EmailHeader,
  EmailLayout,
  EmailSection,
} from '../components'

interface BestelbevestigingProps {
  voornaam: string
  orderNumber: string
  orderTotal: string
  baseUrl?: string
}

export function Bestelbevestiging({
  voornaam = 'Emma',
  orderNumber = 'ST-2026-0001',
  orderTotal = '€ 7,19',
  baseUrl = 'https://studiotwaalf.be',
}: BestelbevestigingProps) {
  return (
    <EmailLayout preview={`Bedankt voor je bestelling, ${voornaam} — we zijn er meteen mee aan de slag.`}>
      <EmailHeader />

      <EmailSection>
        <Text style={styles.greeting}>Dag {voornaam},</Text>

        <Text style={styles.paragraph}>
          Bedankt voor je bestelling — we zijn er meteen mee aan de slag gegaan.
        </Text>

        <Text style={styles.paragraph}>Hieronder vind je een kort overzicht:</Text>
      </EmailSection>

      {/* Order summary block */}
      <EmailSection style={{ backgroundColor: '#F5F0E8', marginTop: '4px', marginBottom: '4px' }}>
        <Row>
          <Text style={styles.summaryLabel}>Bestelnummer</Text>
          <Text style={styles.summaryValue}>{orderNumber}</Text>
        </Row>
        <Hr style={{ borderColor: '#E5DDD4', margin: '10px 0' }} />
        <Row>
          <Text style={styles.summaryLabel}>Totaal</Text>
          <Text style={styles.summaryValue}>{orderTotal}</Text>
        </Row>
      </EmailSection>

      <EmailSection style={{ marginTop: '4px' }}>
        <Text style={styles.paragraph}>
          We zorgen ervoor dat alles met de nodige aandacht wordt verwerkt. Heb je gekozen voor
          gepersonaliseerde items? Dan behandelen we die met extra zorg, zodat alles mooi aansluit
          bij jouw gekozen stijl.
        </Text>

        <Text style={styles.paragraph}>
          Zodra je bestelling verder in verwerking gaat of verzonden wordt, houden we je uiteraard
          op de hoogte.
        </Text>

        <Text style={styles.paragraph}>
          Heb je in tussentijd nog een vraag? Je mag ons altijd contacteren of gewoon antwoorden
          op deze mail.
        </Text>

        <Text style={styles.closing}>
          Veel liefs,
          <br />
          <span style={{ color: '#8B6F3E', fontWeight: '500' }}>Studio Twaalf</span>
        </Text>
      </EmailSection>

      <EmailFooter />
    </EmailLayout>
  )
}

export default Bestelbevestiging

const styles = {
  greeting: {
    fontSize: '17px',
    color: '#1C1410',
    margin: '0 0 20px 0',
    fontWeight: '400',
  },
  paragraph: {
    fontSize: '15px',
    lineHeight: '1.65',
    color: '#3D2E24',
    margin: '0 0 16px 0',
  },
  summaryLabel: {
    fontSize: '13px',
    color: '#7A6655',
    margin: '2px 0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  summaryValue: {
    fontSize: '16px',
    color: '#1C1410',
    fontWeight: '600',
    margin: '2px 0',
  },
  closing: {
    fontSize: '15px',
    lineHeight: '1.65',
    color: '#3D2E24',
    margin: '24px 0 0 0',
  },
} satisfies Record<string, React.CSSProperties>
