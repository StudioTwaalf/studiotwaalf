import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Wegwerpcamera',
  robots: { index: false, follow: false },
}

// Fullscreen op mobiel: geen zoom, notch-veilig, donkere statusbalk
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export default function CameraLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-black">{children}</div>
}
