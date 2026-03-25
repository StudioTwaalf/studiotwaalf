import { Section, Text } from '@react-email/components'
import * as React from 'react'
import {
  EmailButton,
  EmailFooter,
  EmailHeader,
  EmailLayout,
  EmailSection,
} from '../components'

interface WelkomstmailProps {
  voornaam: string
  baseUrl?: string
}

export function Welkomstmail({
  voornaam = 'Emma',
  baseUrl = 'https://studiotwaalf.be',
}: WelkomstmailProps) {
  return (
    <EmailLayout preview={`Welkom bij Studio Twaalf, ${voornaam} — fijn dat je er bent.`}>
      <EmailHeader />

      <EmailSection>
        <Text style={styles.greeting}>Dag {voornaam},</Text>

        <Text style={styles.paragraph}>
          Wat fijn dat je hier bent — welkom bij Studio Twaalf.
        </Text>

        <Text style={styles.paragraph}>
          Of je nu zelf aan de slag wil gaan met een ontwerp of liever kiest voor maatwerk,
          we begeleiden je graag stap voor stap naar een geheel dat helemaal klopt.
        </Text>

        <Text style={styles.paragraph}>
          Je kan meteen verdergaan waar je gebleven was, of rustig inspiratie opdoen in onze
          collectie.
        </Text>

        <Section style={{ marginTop: '28px', marginBottom: '28px' }}>
          <EmailButton href={`${baseUrl}/diy`}>
            Ga verder met je ontwerp
          </EmailButton>
        </Section>

        <Section style={{ marginBottom: '28px' }}>
          <EmailButton href={`${baseUrl}/webshop`}>
            Ontdek de collectie
          </EmailButton>
        </Section>

        <Text style={styles.paragraph}>
          Heb je vragen of weet je niet goed waar te beginnen? Dan helpen we je met plezier op weg.
        </Text>

        <Text style={styles.closing}>
          Warme groet,
          <br />
          <span style={{ color: '#8B6F3E', fontWeight: '500' }}>Studio Twaalf</span>
        </Text>
      </EmailSection>

      <EmailFooter showUnsubscribe unsubscribeUrl={`${baseUrl}/uitschrijven`} />
    </EmailLayout>
  )
}

export default Welkomstmail

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
  closing: {
    fontSize: '15px',
    lineHeight: '1.65',
    color: '#3D2E24',
    margin: '24px 0 0 0',
  },
} satisfies Record<string, React.CSSProperties>
