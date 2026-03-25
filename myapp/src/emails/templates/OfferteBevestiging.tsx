import { Text } from '@react-email/components'
import * as React from 'react'
import {
  EmailButton,
  EmailFooter,
  EmailHeader,
  EmailLayout,
  EmailSection,
} from '../components'

interface OfferteBevestigingProps {
  voornaam: string
  concept: string
  baseUrl?: string
}

export function OfferteBevestiging({
  voornaam = 'Emma',
  concept = 'jouw project',
  baseUrl = 'https://studiotwaalf.be',
}: OfferteBevestigingProps) {
  return (
    <EmailLayout preview={`Bedankt voor je aanvraag, ${voornaam} — we nemen het even van je over.`}>
      <EmailHeader />

      <EmailSection>
        <Text style={styles.greeting}>Dag {voornaam},</Text>

        <Text style={styles.paragraph}>
          Dank je wel voor je aanvraag — wat fijn dat je aan ons denkt voor jouw {concept}.
        </Text>

        <Text style={styles.paragraph}>
          We hebben alles goed ontvangen en nemen dit met zorg door. We bekijken jouw vraag en
          komen zo snel mogelijk bij je terug met een eerste voorstel of bijkomende vragen,
          zodat we samen tot een mooi en persoonlijk geheel kunnen komen.
        </Text>

        <Text style={styles.paragraph}>
          Intussen hoef je niets te doen — wij nemen het even van je over.
        </Text>

        <Text style={styles.paragraph}>
          Heb je toch nog iets dat je graag wil aanvullen? Dan mag je altijd gewoon antwoorden
          op deze mail.
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

export default OfferteBevestiging

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
