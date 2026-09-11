import type { Metadata } from 'next'
import { Instagram } from 'lucide-react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getGuestFromCookies } from '@/lib/wedding/guest'
import CheckInForm from './CheckInForm'
import DisposableCamera from './DisposableCamera'
import InstallHint from './InstallHint'

// De cookie bepaalt wat je ziet, dus nooit cachen
export const dynamic = 'force-dynamic'

// Maakt de camera installeerbaar op het beginscherm van de gast: eigen
// manifest per feest, en de iOS-specifieke tags die Safari nodig heeft om
// hem als app te openen in plaats van als tabblad.
export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const event = await prisma.weddingEvent.findUnique({
    where: { slug: params.slug },
    select: { coupleName: true },
  })

  const naam = event?.coupleName ?? 'Wegwerpcamera'

  return {
    title: naam,
    manifest: `/w/${params.slug}/manifest`,
    robots: { index: false, follow: false },
    appleWebApp: {
      capable: true,
      title: naam,
      statusBarStyle: 'black-translucent',
    },
    icons: {
      icon: [{ url: '/camera/icon-192.png', sizes: '192x192', type: 'image/png' }],
      apple: [{ url: '/camera/icon-180.png', sizes: '180x180', type: 'image/png' }],
    },
  }
}

export default async function WeddingCameraPage({ params }: { params: { slug: string } }) {
  const event = await prisma.weddingEvent.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      slug: true,
      coupleName: true,
      eventDate: true,
      photoLimit: true,
      isOpen: true,
      welcomeText: true,
    },
  })

  if (!event) notFound()

  const guest = await getGuestFromCookies(event.id, event.slug)

  if (!event.isOpen) {
    return (
      <Shell coupleName={event.coupleName}>
        <h1 className="font-serif text-2xl text-studio-beige">Het feest is voorbij</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-studio-beige/60">
          De camera van {event.coupleName} is gesloten. Bedankt om mee te fotograferen.
        </p>
      </Shell>
    )
  }

  if (guest) {
    return (
      <DisposableCamera
        slug={event.slug}
        guestName={guest.name.split(' ')[0]}
        photoLimit={event.photoLimit}
        initialCount={guest.photoCount}
        coupleName={event.coupleName}
      />
    )
  }

  const dateLabel = new Intl.DateTimeFormat('nl-BE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(event.eventDate)

  return (
    <Shell coupleName={event.coupleName}>
      <p className="text-[11px] uppercase tracking-[0.3em] text-studio-beige/45">{dateLabel}</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight text-studio-beige">{event.coupleName}</h1>
      <p className="mt-5 max-w-sm text-sm leading-relaxed text-studio-beige/60">
        Je krijgt een filmpje van {event.photoLimit} foto&apos;s. Je ziet ze niet meteen terug —
        net als bij een echte wegwerpcamera worden ze pas later ontwikkeld.
      </p>

      <div className="mt-10 w-full">
        <CheckInForm
          slug={event.slug}
          photoLimit={event.photoLimit}
          welcomeText={event.welcomeText}
        />
      </div>

      {/* Vóór het inchecken, niet erna: op iOS krijgt de app vanaf het
          beginscherm zijn eigen opslag en zou de gast anders opnieuw
          moeten inchecken. */}
      <InstallHint />
    </Shell>
  )
}

function Shell({ coupleName, children }: { coupleName: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-studio-black px-7 py-14 text-center">
      <div className="flex w-full max-w-sm flex-col items-center">{children}</div>

      <p className="mt-14 text-[10px] uppercase tracking-[0.25em] text-studio-beige/25">
        {coupleName}
      </p>

      {/* target="_blank" is hier geen detail: zonder dat verliest de gast zijn
          camera aan Instagram en moet hij de QR opnieuw scannen. */}
      <a
        href="https://www.instagram.com/studiotwaalf.be"
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-2 rounded-full border border-studio-beige/15 px-4 py-2 text-[11px] text-studio-beige/45 transition hover:border-studio-yellow/50 hover:text-studio-yellow"
      >
        <Instagram size={13} strokeWidth={1.75} aria-hidden />
        Camera door Studio Twaalf
      </a>
    </main>
  )
}
