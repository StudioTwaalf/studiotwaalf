import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

// ─── /w/[slug]/album — de "ontwikkelde" foto's ───────────────────────────────
// Blijft dicht tot revealAt gepasseerd is.  Dat wachten is het halve concept.

export const dynamic = 'force-dynamic'

export default async function AlbumPage({ params }: { params: { slug: string } }) {
  const event = await prisma.weddingEvent.findUnique({
    where: { slug: params.slug },
    select: { id: true, slug: true, coupleName: true, revealAt: true },
  })

  if (!event) notFound()

  const isRevealed = event.revealAt !== null && event.revealAt <= new Date()

  if (!isRevealed) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black px-8 text-center">
        <p className="font-mono text-5xl text-[#FF7A18]">✱</p>
        <h1 className="mt-8 font-serif text-2xl text-white">Nog aan het ontwikkelen</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
          {event.revealAt
            ? `De foto's van ${event.coupleName} komen online op ${new Intl.DateTimeFormat('nl-BE', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(event.revealAt)}.`
            : `${event.coupleName} bekijkt de foto's eerst zelf. Kom straks nog eens terug.`}
        </p>
        <Link
          href={`/w/${event.slug}`}
          className="mt-10 text-[11px] uppercase tracking-[0.25em] text-white/40 underline"
        >
          Terug naar de camera
        </Link>
      </main>
    )
  }

  const photos = await prisma.weddingPhoto.findMany({
    where: { eventId: event.id, isHidden: false },
    orderBy: { takenAt: 'asc' },
    select: { id: true, url: true, takenAt: true, guest: { select: { name: true } } },
  })

  return (
    <main className="min-h-screen bg-black px-5 pb-20 pt-14">
      <header className="mx-auto max-w-4xl text-center">
        <h1 className="font-serif text-3xl text-white">{event.coupleName}</h1>
        <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-white/40">
          {photos.length} foto&apos;s · door jullie gemaakt
        </p>
      </header>

      {photos.length === 0 ? (
        <p className="mt-16 text-center text-sm text-white/50">
          Er zijn nog geen foto&apos;s om te tonen.
        </p>
      ) : (
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <a
              key={photo.id}
              href={photo.url}
              target="_blank"
              rel="noreferrer"
              className="group relative block overflow-hidden rounded-sm bg-white/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`Foto van ${photo.guest.name}`}
                loading="lazy"
                className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-[10px] text-white/70 opacity-0 transition group-hover:opacity-100">
                {photo.guest.name}
              </span>
            </a>
          ))}
        </div>
      )}
    </main>
  )
}
