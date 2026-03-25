import type { Metadata } from 'next'
import {
  Manrope,
  Fraunces,
  Playfair_Display,
  Montserrat,
  Libre_Baskerville,
  DM_Serif_Display,
} from 'next/font/google'
import { GoogleTagManager } from '@next/third-parties/google'
import SessionProvider from '@/components/SessionProvider'
import RouteChangeTracker from '@/components/RouteChangeTracker'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-libre',
  display: 'swap',
})

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-dm-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Studio Twaalf',
  description: 'Gepersonaliseerde drukwerk — geboortekaartjes, huwelijksuitnodigingen en meer.',
  icons: {
    icon: '/logo/logo.png',
    apple: '/logo/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="nl"
      className={`
        ${manrope.variable}
        ${fraunces.variable}
        ${playfair.variable}
        ${montserrat.variable}
        ${libreBaskerville.variable}
        ${dmSerifDisplay.variable}
      `}
    >
      <body className="font-sans antialiased">
        <SessionProvider>
          <RouteChangeTracker />
          {children}
        </SessionProvider>
      </body>
      <GoogleTagManager gtmId="GTM-M9W57NXX" />
    </html>
  )
}
