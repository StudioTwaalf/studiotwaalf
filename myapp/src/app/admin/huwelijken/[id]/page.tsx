import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import WeddingQrCard from '@/components/admin/WeddingQrCard'
import WeddingPhotoGrid, { type AdminPhoto } from '@/components/admin/WeddingPhotoGrid'
import { deleteWeddingAction, updateWeddingAction } from '../actions'

export const dynamic = 'force-dynamic'

function toInputDateTime(date: Date | null): string {
  if (!date) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

export default async function WeddingDetailPage({ params }: { params: { id: string } }) {
  const event = await prisma.weddingEvent.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      slug: true,
      coupleName: true,
      eventDate: true,
      photoLimit: true,
      revealAt: true,
      isOpen: true,
      welcomeText: true,
      _count: { select: { guests: true, photos: true } },
    },
  })

  if (!event) notFound()

  const rawPhotos = await prisma.weddingPhoto.findMany({
    where: { eventId: event.id },
    orderBy: { takenAt: 'desc' },
    select: {
      id: true,
      url: true,
      isHidden: true,
      takenAt: true,
      guest: { select: { name: true } },
    },
  })

  const photos: AdminPhoto[] = rawPhotos.map((p) => ({
    id: p.id,
    url: p.url,
    isHidden: p.isHidden,
    takenAt: p.takenAt.toISOString(),
    guestName: p.guest.name,
  }))

  const guests = await prisma.weddingGuest.findMany({
    where: { eventId: event.id },
    orderBy: { photoCount: 'desc' },
    select: { id: true, name: true, email: true, photoCount: true },
  })

  return (
    <div>
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/admin/huwelijken" className="hover:text-gray-600 transition-colors">
          Wegwerpcamera&apos;s
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{event.coupleName}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900">{event.coupleName}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Intl.DateTimeFormat('nl-BE', { dateStyle: 'full' }).format(event.eventDate)} ·{' '}
          {event._count.guests} gasten · {event._count.photos} foto&apos;s
        </p>
      </div>

      <div className="space-y-6">
        <WeddingQrCard slug={event.slug} coupleName={event.coupleName} />

        {/* ── Instellingen ─────────────────────────────────────────────── */}
        <form
          action={updateWeddingAction}
          className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5"
        >
          <input type="hidden" name="id" value={event.id} />
          <h2 className="text-sm font-medium text-gray-900">Instellingen</h2>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isOpen"
              defaultChecked={event.isOpen}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">
              Camera is open
              <span className="ml-2 text-xs text-gray-400">
                Uitzetten sluit het inchecken én het uploaden af
              </span>
            </span>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1.5">
              Foto&apos;s per gast
            </span>
            <input
              name="photoLimit"
              type="number"
              min={1}
              max={200}
              defaultValue={event.photoLimit}
              className="w-40 rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
            />
            <span className="mt-1.5 block text-xs text-gray-400">
              Verhogen geeft iedereen meteen extra foto&apos;s. Verlagen raakt wie er al over zit
              niet — die kunnen enkel niet verder.
            </span>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1.5">
              Foto&apos;s &ldquo;ontwikkelen&rdquo; op
            </span>
            <input
              name="revealAt"
              type="datetime-local"
              defaultValue={toInputDateTime(event.revealAt)}
              className="w-64 rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
            />
            <span className="mt-1.5 block text-xs text-gray-400">
              Leeg = de publieke galerij op{' '}
              <code className="font-mono">/w/{event.slug}/album</code> blijft dicht. Zet dit pas
              nadat je de foto&apos;s hebt nagekeken.
            </span>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1.5">
              Tekst op het check-in scherm
            </span>
            <textarea
              name="welcomeText"
              rows={3}
              defaultValue={event.welcomeText ?? ''}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
            />
          </label>

          <button
            type="submit"
            className="rounded-full bg-gray-900 px-6 py-2.5 text-sm text-white hover:bg-gray-700 transition-colors"
          >
            Opslaan
          </button>
        </form>

        {/* ── Foto's ───────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <WeddingPhotoGrid photos={photos} eventId={event.id} slug={event.slug} />
        </div>

        {/* ── Gasten ───────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Gasten</h2>
          {guests.length === 0 ? (
            <p className="text-sm text-gray-500">Nog niemand ingecheckt.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="pb-2 font-medium">Naam</th>
                  <th className="pb-2 font-medium">E-mail</th>
                  <th className="pb-2 font-medium">Foto&apos;s</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {guests.map((guest) => (
                  <tr key={guest.id}>
                    <td className="py-2.5 text-gray-900">{guest.name}</td>
                    <td className="py-2.5 text-gray-500">{guest.email ?? '—'}</td>
                    <td className="py-2.5 text-gray-600">
                      {guest.photoCount} / {event.photoLimit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Verwijderen ──────────────────────────────────────────────── */}
        <form action={deleteWeddingAction} className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <input type="hidden" name="id" value={event.id} />
          <h2 className="text-sm font-medium text-red-700">Feest verwijderen</h2>
          <p className="mt-1 text-xs text-red-600">
            Verwijdert het feest, alle gasten en alle {event._count.photos} foto-verwijzingen.
            De bestanden zelf blijven in je opslag staan.
          </p>
          <button
            type="submit"
            className="mt-4 rounded-full border border-red-300 bg-white px-5 py-2 text-xs text-red-700 hover:bg-red-100 transition-colors"
          >
            Definitief verwijderen
          </button>
        </form>
      </div>
    </div>
  )
}
