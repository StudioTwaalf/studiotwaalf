'use client'

import { useId, useRef, useState } from 'react'

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Returns true when the value is a URL (http/https or relative /path). */
function isImageUrl(val: string): boolean {
  return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/')
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface Props {
  /** Name of the hidden <input> that carries the value into the server action. */
  name?: string
  /** Initial value — either a URL or an emoji string. */
  defaultValue?: string
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ImageUpload({ name = 'imageUrl', defaultValue = '' }: Props) {
  const uid = useId()
  const fileInputId = `img-upload-${uid}`
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [value, setValue]       = useState(defaultValue)
  const [uploading, setUploading] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // ── Upload handler ───────────────────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json() as { url?: string; error?: string }

      if (!res.ok) throw new Error(data.error ?? 'Upload mislukt')

      setValue(data.url ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload mislukt')
    } finally {
      setUploading(false)
      // Reset so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const hasImage = isImageUrl(value)
  const hasEmoji = value.length > 0 && !hasImage

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Afbeelding of emoji
      </label>

      {/* ── Preview ─────────────────────────────────────────────────────── */}
      {(hasImage || hasEmoji) && (
        <div className="mb-3 flex items-center gap-3">
          {hasImage ? (
            <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Product preview"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <span className="text-4xl leading-none" aria-label="Emoji preview">
              {value}
            </span>
          )}

          {hasImage && (
            <button
              type="button"
              onClick={() => setValue('')}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Afbeelding verwijderen"
            >
              Verwijderen
            </button>
          )}
        </div>
      )}

      {/* ── Hidden input carries the value into the server action ────────── */}
      <input type="hidden" name={name} value={value} />

      {/* ── Text input for emoji or manual URL ──────────────────────────── */}
      <input
        type="text"
        value={value}
        onChange={(e) => { setError(null); setValue(e.target.value) }}
        placeholder="bijv. 🔵  of  https://..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />

      {/* ── Upload button row ────────────────────────────────────────────── */}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {/* Hidden native file input */}
        <input
          ref={fileInputRef}
          id={fileInputId}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          onChange={handleFileChange}
          className="sr-only"
          aria-label="Kies een afbeelding om te uploaden"
        />

        {/* Visible label styled as button */}
        <label
          htmlFor={fileInputId}
          className={[
            'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg',
            'border border-gray-300 bg-white text-gray-700 cursor-pointer select-none',
            'hover:bg-gray-50 transition-colors',
            uploading ? 'opacity-50 pointer-events-none' : '',
          ].filter(Boolean).join(' ')}
        >
          {uploading ? (
            <>
              {/* Spinner */}
              <svg
                className="w-4 h-4 animate-spin text-indigo-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading…
            </>
          ) : (
            <>
              {/* Upload arrow icon */}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Upload afbeelding
            </>
          )}
        </label>

        <span className="text-xs text-gray-400">PNG, JPG, WebP of AVIF · max 5 MB</span>
      </div>

      {/* ── Error message ────────────────────────────────────────────────── */}
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
