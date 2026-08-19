import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getGuestFromCookies } from '@/lib/wedding/guest'
import CheckInForm from './CheckInForm'
import DisposableCamera from './DisposableCamera'

// De cookie bepaalt wat je ziet, dus nooit cachen
export const dynamic = 'force-dynamic'

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
        <h1 className="font-serif text-2xl text-white">Het feest is voorbij</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
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
      <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">{dateLabel}</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight text-white">{event.coupleName}</h1>
      <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
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
    </Shell>
  )
}

function Shell({ coupleName, children }: { coupleName: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-7 py-14 text-center">
      <div className="flex w-full max-w-sm flex-col items-center">{children}</div>
      <p className="mt-14 text-[10px] uppercase tracking-[0.25em] text-white/20">
        {coupleName} · Studio Twaalf
      </p>
    </main>
  )
}
