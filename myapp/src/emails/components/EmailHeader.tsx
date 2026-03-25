import { Img, Section, Text } from '@react-email/components'
import * as React from 'react'

interface EmailHeaderProps {
  logoUrl?: string
}

export function EmailHeader({ logoUrl }: EmailHeaderProps) {
  return (
    <Section
      style={{
        paddingTop: '32px',
        paddingBottom: '32px',
        textAlign: 'center',
        borderBottom: '1px solid #E5DDD4',
      }}
    >
      {logoUrl ? (
        <Img
          src={logoUrl}
          alt="Studio Twaalf"
          height={36}
          style={{ margin: '0 auto', display: 'block' }}
        />
      ) : (
        <Text
          style={{
            fontSize: '18px',
            fontWeight: '600',
            letterSpacing: '0.08em',
            color: '#8B6F3E',
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          Studio Twaalf
        </Text>
      )}
    </Section>
  )
}
