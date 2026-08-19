'use client'

import { useState, useTransition } from 'react'
import JSZip from 'jszip'
import { togglePhotoHiddenAction } from '@/app/admin/huwelijken/actions'

export interface AdminPhoto {
  id: string
  url: string
  isHidden: boolean
  takenAt: string
  guestName: string
}

export default function WeddingPhotoGrid({
  photos,
  eventId,
  slug,
}: {
  photos: AdminPhoto[]
  eventId: string
  slug: string
}) {
  const [pending, startTransition] = useTransition()
  const [showHidden, setShowHidden] = useState(true)
  const [zipProgress, setZipProgress] = useState<number | null>(null)

  const visible = showHidden ? photos : photos.filter((p) => !p.isHidden)
  const hiddenCount = photos.filter((p) => p.isHidden).length

  /**
   * ZIP wordt in de browser gebouwd — geen serverless timeout, geen geheugen-
   * limiet op Vercel.  Bij honderden foto's duurt het even; vandaar de teller.
   */
  async function downloadZip() {
    const wanted = photos.filter((p) => !p.isHidden)
    if (wanted.length === 0) return

    setZipProgress(0)
    const zip = new JSZip()

    for (let i = 0; i < wanted.length; i++) {
      const photo = wanted[i]
      try {
        const res = await fetch(photo.url)
        if (!res.ok) continue
        const blob = await res.blob()
        const safeName = photo.guestName.replace(/[^a-zA-Z0-9]/g, '_')
        zip.file(`${String(i + 1).padStart(3, '0')}-${safeName}.jpg`, blob)
      } catch {
        // Eén foto die niet ophaalt mag de rest niet blokkeren
      }
      setZipProgress(Math.round(((i + 1) / wanted.length) * 100))
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = `${slug}-fotos.zip`
    a.click()
    URL.revokeObjectURL(href)
    setZipProgress(null)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-gray-900">
            {photos.length} foto&apos;s
            {hiddenCount > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({hiddenCount} verborgen)
              </span>
            )}
          </h2>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowHidden((v) => !v)}
              className="text-xs text-gray-500 underline"
            >
              {showHidden ? 'Verberg de verborgen' : 'Toon alles'}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={downloadZip}
          disabled={zipProgress !== null || photos.length === 0}
          className="rounded-full bg-gray-900 px-4 py-2 text-xs text-white hover:bg-gray-700 transition-colors disabled:opacity-40"
        >
          {zipProgress !== null ? `Inpakken… ${zipProgress}%` : 'Download alles (.zip)'}
        </button>
      </div>

      {photos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-sm text-gray-500">Nog geen foto&apos;s binnen.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {visible.map((photo) => (
            <div
              key={photo.id}
              className={`group relative overflow-hidden rounded-lg bg-gray-100 ${
                photo.isHidden ? 'opacity-40' : ''
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`Foto van ${photo.guestName}`}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                <span className="truncate text-[10px] text-white/80">{photo.guestName}</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(() => {
                      void togglePhotoHiddenAction(photo.id, eventId)
                    })
                  }
                  className="shrink-0 rounded bg-white/20 px-1.5 py-0.5 text-[10px] text-white backdrop-blur hover:bg-white/40 disabled:opacity-50"
                >
                  {photo.isHidden ? 'Toon' : 'Verberg'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
