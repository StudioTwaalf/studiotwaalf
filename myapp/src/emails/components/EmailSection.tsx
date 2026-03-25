import { Section } from '@react-email/components'
import * as React from 'react'

interface EmailSectionProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

export function EmailSection({ children, style }: EmailSectionProps) {
  return (
    <Section
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '32px 36px',
        marginTop: '8px',
        marginBottom: '8px',
        ...style,
      }}
    >
      {children}
    </Section>
  )
}
