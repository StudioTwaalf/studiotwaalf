import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminWeddingsPage() {
  let events: Awaited<ReturnType<typeof loadEvents>> = []
  let dbError: string | null = null

  try {
    events = await loadEvents()
  } catch (err) {
    dbError = err instanceof Error ? err.message : 'Onbekende fout'
  }

  if (dbError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <p className="text-sm font-medium text-red-700 mb-1">Fout bij laden van huwelijken</p>
        <p className="text-xs text-red-500 font-mono">{dbError}</p>
        <p className="text-xs text-red-500 mt-3">
          Draait de database? <code>pnpm db:up</code> en daarna{' '}
          <code>npx prisma migrate deploy</code>.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Wegwerpcamera&apos;s</h1>
          <p className="text-sm text-gray-500 mt-1">
            {events.length === 0
              ? 'Nog geen feesten aangemaakt'
              : `${events.length} feest${events.length === 1 ? '' : 'en'}`}
          </p>
        </div>
        <Link
          href="/admin/huwelijken/new"
          className="rounded-full bg-gray-900 px-5 py-2.5 text-sm text-white hover:bg-gray-700 transition-colors"
        >
          Nieuw feest
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-sm text-gray-500">
            Maak een feest aan, print de QR-code en leg hem op tafel.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Koppel</th>
                <th className="px-5 py-3 font-medium">Datum</th>
                <th className="px-5 py-3 font-medium">Gasten</th>
                <th className="px-5 py-3 font-medium">Foto&apos;s</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/huwelijken/${event.id}`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {event.coupleName}
                    </Link>
                    <p className="text-xs text-gray-400 font-mono">/w/{event.slug}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {new Intl.DateTimeFormat('nl-BE', { dateStyle: 'medium' }).format(
                      event.eventDate,
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-600">{event._count.guests}</td>
                  <td className="px-5 py-4 text-gray-600">{event._count.photos}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs ${
                        event.isOpen
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {event.isOpen ? 'Open' : 'Gesloten'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function loadEvents() {
  return prisma.weddingEvent.findMany({
    orderBy: { eventDate: 'desc' },
    select: {
      id: true,
      slug: true,
      coupleName: true,
      eventDate: true,
      isOpen: true,
      _count: { select: { guests: true, photos: true } },
    },
  })
}
