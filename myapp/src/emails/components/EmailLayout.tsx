import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Tailwind,
} from '@react-email/components'
import * as React from 'react'

interface EmailLayoutProps {
  preview: string
  children: React.ReactNode
}

const config = {
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#FAF7F2',
          white: '#FFFFFF',
          text: '#1C1410',
          muted: '#7A6655',
          accent: '#8B6F3E',
          border: '#E5DDD4',
        },
      },
    },
  },
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="nl">
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind config={config}>
        <Body
          style={{
            backgroundColor: '#FAF7F2',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
            margin: 0,
            padding: 0,
          }}
        >
          <Container
            style={{
              maxWidth: '600px',
              margin: '0 auto',
              padding: '40px 20px',
            }}
          >
            {children}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
