import { Hr, Link, Section, Text } from '@react-email/components'
import * as React from 'react'
import { EmailButton, EmailFooter, EmailHeader, EmailLayout, EmailSection } from '../components'

interface AlbumOntwikkeldProps {
  voornaam: string
  coupleName: string
  albumUrl: string
  aantalFotos: number
  instagramUrl?: string
}

/**
 * Gaat naar de gasten zodra het koppel het album openzet.
 *
 * De foto's zelf gaan níét mee als bijlage: tweehonderd foto's van een halve
 * megabyte komt door geen enkele mailbox. Deze mail is een uitnodiging naar
 * het album, niet het album zelf.
 */
export function AlbumOntwikkeld({
  voornaam = 'Marie',
  coupleName = 'Bram & Amelie',
  albumUrl = 'https://studiotwaalf.vercel.app/w/bramelie/album',
  aantalFotos = 120,
  instagramUrl = 'https://www.instagram.com/studiotwaalf.be',
}: AlbumOntwikkeldProps) {
  return (
    <EmailLayout preview={`De foto's van ${coupleName} zijn ontwikkeld.`}>
      <EmailHeader />

      <EmailSection>
        <Text style={styles.greeting}>Dag {voornaam},</Text>

        <Text style={styles.paragraph}>
          De foto&apos;s van het feest van {coupleName} zijn ontwikkeld. Ook die van jou. Je ziet
          ze nu voor het eerst terug.
        </Text>

        <Text style={styles.paragraph}>
          Samen hebben de gasten er {aantalFotos} gemaakt. Blader er rustig doorheen en bewaar
          gerust wat je mooi vindt.
        </Text>

        <Section style={{ marginTop: '28px', marginBottom: '28px' }}>
          <EmailButton href={albumUrl}>Bekijk het album</EmailButton>
        </Section>

        <Text style={styles.closing}>
          Warme groet,
          <br />
          <span style={{ color: '#8B6F3E', fontWeight: '500' }}>Studio Twaalf</span>
        </Text>

        {/* ── Instagram ───────────────────────────────────────────────────────
            Onderaan en apart gezet: wie net foto's van een trouwfeest opent,
            wil eerst die foto's zien. Daarna mag het gerust gevraagd worden. */}
        <Hr style={{ borderColor: '#E5DDD4', margin: '36px 0 24px 0' }} />

        <Text style={styles.instaKop}>Zelf ook zo&apos;n camera op je feest?</Text>

        <Text style={styles.instaTekst}>
          Deze wegwerpcamera is gemaakt door Studio Twaalf. Op Instagram laten we zien wat we
          nog meer maken voor trouwfeesten: van uitnodigingen tot het drukwerk op tafel.
        </Text>

        <Section style={{ marginTop: '20px' }}>
          <EmailButton href={instagramUrl}>Volg ons op Instagram</EmailButton>
        </Section>

        <Text style={styles.instaHandle}>
          <Link href={instagramUrl} style={{ color: '#8B6F3E', textDecoration: 'none' }}>
            @studiotwaalf.be
          </Link>
        </Text>
      </EmailSection>

      <EmailFooter />
    </EmailLayout>
  )
}

export default AlbumOntwikkeld

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
  instaKop: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#1C1410',
    margin: '0 0 10px 0',
  },
  instaTekst: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#7A6655',
    margin: '0',
  },
  instaHandle: {
    fontSize: '13px',
    color: '#A89585',
    margin: '14px 0 0 0',
  },
} satisfies Record<string, React.CSSProperties>
