'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

/**
 * QR-code voor op tafel.  Foutcorrectie op 'H' zodat de code leesbaar blijft
 * als er een glas op staat of iemand er een vlek op maakt.
 */
export default function WeddingQrCard({
  slug,
  coupleName,
}: {
  slug: string
  coupleName: string
}) {
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const full = `${window.location.origin}/w/${slug}`
    setUrl(full)
    QRCode.toDataURL(full, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 512,
      color: { dark: '#111111', light: '#FFFFFF' },
    })
      .then(setPreview)
      .catch(() => setPreview(null))
  }, [slug])

  async function downloadPrintable() {
    // 2048px = ruim genoeg voor een scherpe afdruk op A6/A5
    const dataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 2048,
      color: { dark: '#111111', light: '#FFFFFF' },
    })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `qr-${slug}.png`
    a.click()
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="text-sm font-medium text-gray-900">QR-code voor op tafel</h2>

      <div className="mt-4 flex items-start gap-5">
        <div className="shrink-0 rounded-xl border border-gray-200 p-2">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={`QR-code voor ${coupleName}`} className="h-32 w-32" />
          ) : (
            <div className="h-32 w-32 animate-pulse rounded bg-gray-100" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="break-all font-mono text-xs text-gray-500">{url || '…'}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadPrintable}
              disabled={!url}
              className="rounded-full bg-gray-900 px-4 py-2 text-xs text-white hover:bg-gray-700 transition-colors disabled:opacity-40"
            >
              Download PNG (print)
            </button>
            <button
              type="button"
              onClick={copyLink}
              disabled={!url}
              className="rounded-full border border-gray-300 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              {copied ? 'Gekopieerd' : 'Link kopiëren'}
            </button>
            <a
              href={`/w/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-gray-300 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Openen
            </a>
          </div>

          <p className="mt-3 text-xs text-gray-400">
            Test de code met je eigen telefoon vóór de dag zelf. De camera werkt alleen over
            https — op localhost lukt het ook, op een http-adres niet.
          </p>
        </div>
      </div>
    </div>
  )
}
