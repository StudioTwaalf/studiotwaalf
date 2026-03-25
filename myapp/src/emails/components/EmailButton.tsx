import { Button } from '@react-email/components'
import * as React from 'react'

interface EmailButtonProps {
  href: string
  children: React.ReactNode
}

export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <Button
      href={href}
      style={{
        display: 'inline-block',
        backgroundColor: '#8B6F3E',
        color: '#FFFFFF',
        fontSize: '14px',
        fontWeight: '500',
        textDecoration: 'none',
        padding: '12px 24px',
        borderRadius: '8px',
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </Button>
  )
}
