import { Hr, Link, Section, Text } from '@react-email/components'
import * as React from 'react'

interface EmailFooterProps {
  showUnsubscribe?: boolean
  unsubscribeUrl?: string
}

export function EmailFooter({
  showUnsubscribe = false,
  unsubscribeUrl,
}: EmailFooterProps) {
  return (
    <Section style={{ paddingTop: '40px', paddingBottom: '24px' }}>
      <Hr style={{ borderColor: '#E5DDD4', marginBottom: '24px' }} />
      <Text
        style={{
          fontSize: '13px',
          color: '#7A6655',
          margin: '0 0 4px 0',
          textAlign: 'center',
        }}
      >
        Studio Twaalf
      </Text>
      <Text
        style={{
          fontSize: '13px',
          color: '#A89585',
          margin: '0 0 4px 0',
          textAlign: 'center',
        }}
      >
        Vragen? Antwoord gewoon op deze mail — we helpen je graag.
      </Text>
      {showUnsubscribe && unsubscribeUrl && (
        <Text
          style={{
            fontSize: '12px',
            color: '#C0AFA0',
            margin: '12px 0 0 0',
            textAlign: 'center',
          }}
        >
          <Link
            href={unsubscribeUrl}
            style={{ color: '#C0AFA0', textDecoration: 'underline' }}
          >
            Uitschrijven
          </Link>
        </Text>
      )}
    </Section>
  )
}
