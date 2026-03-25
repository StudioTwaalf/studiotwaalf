import { Text } from '@react-email/components'
import * as React from 'react'
import {
  EmailFooter,
  EmailHeader,
  EmailLayout,
  EmailSection,
} from '../components'

interface BestellingVerzondenProps {
  voornaam: string
  orderNumber?: string
  trackingUrl?: string
  baseUrl?: string
}

export function BestellingVerzonden({
  voornaam = 'Emma',
  orderNumber = 'ST-2026-0001',
  trackingUrl,
  baseUrl = 'https://studiotwaalf.be',
}: BestellingVerzondenProps) {
  return (
    <EmailLayout preview={`Goed nieuws, ${voornaam} — je bestelling is onderweg.`}>
      <EmailHeader />

      <EmailSection>
        <Text style={styles.greeting}>Dag {voornaam},</Text>

        <Text style={styles.paragraph}>
          Goed nieuws — je bestelling is onderweg.
        </Text>

        <Text style={styles.paragraph}>
          We hebben alles met zorg klaargemaakt en verzonden. Binnenkort mag je het pakketje
          verwachten.
        </Text>

        {orderNumber && (
          <Text style={styles.orderRef}>Bestelnummer: {orderNumber}</Text>
        )}

        {trackingUrl && (
          <Text style={styles.paragraph}>
            <a href={trackingUrl} style={{ color: '#8B6F3E', textDecoration: 'underline' }}>
              Volg je pakket
            </a>
          </Text>
        )}

        <Text style={styles.paragraph}>
          We hopen dat alles helemaal is zoals je het voor ogen had.
        </Text>

        <Text style={styles.paragraph}>
          Laat je ons iets weten wanneer het toegekomen is? We horen het altijd graag.
        </Text>

        <Text style={styles.closing}>
          Warme groet,
          <br />
          <span style={{ color: '#8B6F3E', fontWeight: '500' }}>Studio Twaalf</span>
        </Text>
      </EmailSection>

      <EmailFooter />
    </EmailLayout>
  )
}

export default BestellingVerzonden

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
  orderRef: {
    fontSize: '13px',
    color: '#7A6655',
    letterSpacing: '0.03em',
    margin: '0 0 16px 0',
    backgroundColor: '#F5F0E8',
    padding: '8px 12px',
    borderRadius: '6px',
    display: 'inline-block' as const,
  },
  closing: {
    fontSize: '15px',
    lineHeight: '1.65',
    color: '#3D2E24',
    margin: '24px 0 0 0',
  },
} satisfies Record<string, React.CSSProperties>
