'use client'

/**
 * ImageUploadField — admin image upload with preview.
 *
 * Uploads the selected file to POST /api/admin/upload immediately on selection,
 * stores the returned URL in a hidden <input> so server actions can read it,
 * and shows a live preview.
 *
 * Also renders the URL as a readonly text input for visibility / manual override.
 */

import { useRef, useState } from 'react'

interface Props {
  /** Hidden input name read by the server action */
  name: string
  /** Current URL (from DB) */
  defaultValue?: string | null
  /** Label shown above the component */
  label: string
  /** Helper text shown below the label */
  hint?: string
  /** accepted file types, e.g. "image/png,image/jpeg" */
  accept?: string
}

export default function ImageUploadField({ name, defaultValue, label, hint, accept = 'image/*' }: Props) {
  const [url, setUrl]           = useState(defaultValue ?? '')
  const [uploading, setUploading] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const fileRef                 = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error(`Upload mislukt (${res.status})`)
      const data = await res.json() as { url: string }
      setUrl(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload mislukt')
    } finally {
      setUploading(false)
      // Reset file input so same file can be re-selected
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}

      <div className="flex gap-3">
        {/* Preview */}
        <div className="flex-shrink-0 w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="w-full h-full object-contain" />
          ) : (
            <span className="text-2xl text-gray-300">🖼️</span>
          )}
        </div>

        <div className="flex-1 space-y-2">
          {/* URL display / manual override */}
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://… of upload hieronder"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* Upload button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                         border border-gray-300 rounded-lg bg-white hover:bg-gray-50
                         transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Uploaden…
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Bestand kiezen
                </>
              )}
            </button>
            {url && (
              <button
                type="button"
                onClick={() => setUrl('')}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Verwijderen
              </button>
            )}
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>

      {/* Hidden input carries the URL into the server action */}
      <input type="hidden" name={name} value={url} />

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
