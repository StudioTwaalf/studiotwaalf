import { Section, Text } from '@react-email/components'
import * as React from 'react'
import {
  EmailButton,
  EmailFooter,
  EmailHeader,
  EmailLayout,
  EmailSection,
} from '../components'

interface AbandonedDesignProps {
  voornaam: string
  designUrl?: string
  baseUrl?: string
}

export function AbandonedDesign({
  voornaam = 'Emma',
  designUrl,
  baseUrl = 'https://studiotwaalf.be',
}: AbandonedDesignProps) {
  const ctaUrl = designUrl ?? `${baseUrl}/diy`

  return (
    <EmailLayout preview={`Je ontwerp staat nog klaar, ${voornaam} — ga verder wanneer je wil.`}>
      <EmailHeader />

      <EmailSection>
        <Text style={styles.greeting}>Dag {voornaam},</Text>

        <Text style={styles.paragraph}>
          We merkten dat je gestart was met een ontwerp — het staat nog netjes voor je klaar.
        </Text>

        <Text style={styles.paragraph}>
          Soms is het gewoon fijn om er even opnieuw naar te kijken met een frisse blik.
          Je kan op elk moment verdergaan waar je gebleven was.
        </Text>

        <Section style={{ marginTop: '28px', marginBottom: '28px' }}>
          <EmailButton href={ctaUrl}>
            Ga verder met je ontwerp
          </EmailButton>
        </Section>

        <Text style={styles.paragraph}>
          Twijfel je ergens over of wil je even sparren? Dan denken we graag met je mee.
        </Text>

        <Text style={styles.note}>
          Geen haast — neem gerust je tijd.
        </Text>

        <Text style={styles.closing}>
          Liefs,
          <br />
          <span style={{ color: '#8B6F3E', fontWeight: '500' }}>Studio Twaalf</span>
        </Text>
      </EmailSection>

      <EmailFooter showUnsubscribe unsubscribeUrl={`${baseUrl}/uitschrijven`} />
    </EmailLayout>
  )
}

export default AbandonedDesign

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
  note: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#7A6655',
    fontStyle: 'italic',
    margin: '0 0 16px 0',
  },
  closing: {
    fontSize: '15px',
    lineHeight: '1.65',
    color: '#3D2E24',
    margin: '24px 0 0 0',
  },
} satisfies Record<string, React.CSSProperties>
