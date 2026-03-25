'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import SvgCanvas from '@/components/SvgCanvas'
import { parseDesignJson } from '@/lib/design-utils'
import TemplatePreview from '@/components/template/TemplatePreview'
import TemplateEditor from '@/components/template/TemplateEditor'
import { isTemplateDesign } from '@/types/template'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  templateId:         string
  designsCount:       number
  initialName:        string
  initialDescription: string
  initialCategory:    string
  initialStatus:      string
  initialWidthMm:     number | null
  initialHeightMm:    number | null
  /** Already-stringified JSON (or empty string) from the server */
  initialDesignJson:  string
  /** Bound server action — passed in from the Server Component */
  action:             (formData: FormData) => Promise<void>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FALLBACK_W = 148  // A5 width  in mm
const FALLBACK_H = 210  // A5 height in mm

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'

// ─── Component ────────────────────────────────────────────────────────────────

export default function TemplateEditForm({
  templateId,
  designsCount,
  initialName,
  initialDescription,
  initialCategory,
  initialStatus,
  initialWidthMm,
  initialHeightMm,
  initialDesignJson,
  action,
}: Props) {
  // ── Controlled state for live-preview fields ──────────────────────────────
  const [jsonStr,  setJsonStr]  = useState(initialDesignJson)
  const [widthMm,  setWidthMm]  = useState<number | ''>(initialWidthMm  ?? '')
  const [heightMm, setHeightMm] = useState<number | ''>(initialHeightMm ?? '')

  // ── Safe JSON parse (never throws) ────────────────────────────────────────
  const { design, rawJson, error } = useMemo(() => {
    const trimmed = jsonStr.trim()
    if (!trimmed) return { design: null, rawJson: null, error: null }
    try {
      const parsed = JSON.parse(trimmed)
      return { design: parseDesignJson(parsed), rawJson: parsed, error: null }
    } catch (e) {
      return { design: null, rawJson: null, error: (e as Error).message }
    }
  }, [jsonStr])

  const previewW = typeof widthMm  === 'number' && widthMm  > 0 ? widthMm  : FALLBACK_W
  const previewH = typeof heightMm === 'number' && heightMm > 0 ? heightMm : FALLBACK_H

  // ── Editor sync ────────────────────────────────────────────────────────────
  function handleEditorChange(updatedDesign: unknown) {
    setJsonStr(JSON.stringify(updatedDesign, null, 2))
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Two-column layout: left = form fields, right = sticky panel ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

        {/* ── LEFT: form ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h1 className="text-lg font-semibold text-gray-900 mb-6">Template bewerken</h1>

          <form action={action} className="space-y-5">

            {/* Naam */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Naam <span className="text-red-500">*</span>
              </label>
              <input
                id="name" name="name" type="text" required autoFocus
                defaultValue={initialName}
                className={inputCls}
              />
            </div>

            {/* Beschrijving */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Beschrijving
              </label>
              <textarea
                id="description" name="description" rows={3}
                defaultValue={initialDescription}
                placeholder="Optionele beschrijving van deze template"
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Categorie + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Categorie
                </label>
                <input
                  id="category" name="category" type="text"
                  defaultValue={initialCategory}
                  placeholder="bijv. Geboortekaartje, Poster"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status" name="status"
                  defaultValue={initialStatus}
                  className={inputCls + ' bg-white'}
                >
                  <option value="draft">🟠 Concept</option>
                  <option value="published">🟢 Actief (openbaar)</option>
                  <option value="archived">🔴 Verborgen</option>
                </select>
              </div>
            </div>

            {/* Afmetingen */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="widthMm" className="block text-sm font-medium text-gray-700 mb-1">
                  Breedte (mm)
                </label>
                <input
                  id="widthMm" name="widthMm" type="number" step="0.1" min="0"
                  value={widthMm}
                  onChange={e => setWidthMm(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="bijv. 148"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="heightMm" className="block text-sm font-medium text-gray-700 mb-1">
                  Hoogte (mm)
                </label>
                <input
                  id="heightMm" name="heightMm" type="number" step="0.1" min="0"
                  value={heightMm}
                  onChange={e => setHeightMm(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="bijv. 210"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Default Design JSON */}
            <div>
              <label htmlFor="defaultDesignJson" className="block text-sm font-medium text-gray-700 mb-1">
                Default design JSON
              </label>
              <textarea
                id="defaultDesignJson" name="defaultDesignJson"
                rows={12}
                value={jsonStr}
                onChange={e => setJsonStr(e.target.value)}
                spellCheck={false}
                placeholder={'{\n  "background": "#ffffff",\n  "elements": []\n}'}
                className={[
                  inputCls,
                  'font-mono resize-y',
                  error ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : '',
                ].join(' ')}
              />
              {error ? (
                <p className="mt-1 text-xs text-red-500 font-mono truncate" title={error}>
                  ✗ {error}
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-400">
                  Moet geldige JSON zijn. Leeg laten om te verwijderen.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-mono truncate max-w-[160px]">
                {templateId}
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/templates"
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors px-4 py-2"
                >
                  Annuleren
                </Link>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white text-sm font-medium px-5 py-2 rounded-lg
                             hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500
                             focus:ring-offset-2 transition-colors"
                >
                  Opslaan
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ── RIGHT: sticky panel ─────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-6 space-y-4">

          {/* Live preview */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Live preview</h2>
              {(widthMm || heightMm) && (
                <span className="text-xs text-gray-400 font-mono">
                  {previewW} × {previewH} mm
                </span>
              )}
            </div>

            <div className="min-h-[180px] flex flex-col justify-center items-center">
              {rawJson && isTemplateDesign(rawJson) ? (
                <TemplatePreview design={rawJson} maxWidth={260} />
              ) : design ? (
                <SvgCanvas
                  widthMm={previewW}
                  heightMm={previewH}
                  designJson={design}
                  maxDisplayWidth={260}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center select-none">
                  {error ? (
                    <>
                      <span className="text-xl">⚠️</span>
                      <p className="text-xs font-medium text-red-500">Ongeldige JSON</p>
                      <p className="text-xs text-gray-400 font-mono max-w-[220px] truncate">{error}</p>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl opacity-20">□</span>
                      <p className="text-xs text-gray-400">
                        {jsonStr.trim() ? 'Verwerken…' : 'Plak design JSON voor een preview'}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Quick-start hint */}
            {!jsonStr.trim() && (
              <details className="mt-2 text-xs text-gray-400 group">
                <summary className="cursor-pointer hover:text-gray-600 transition-colors list-none flex items-center gap-1">
                  <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                  Voorbeeld JSON
                </summary>
                <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-[10px] leading-relaxed overflow-x-auto">{`{
  "background": "#fdf6ee",
  "elements": [
    {
      "id": "title",
      "type": "text",
      "x": 10, "y": 15,
      "text": "Baby shower",
      "fontFamily": "Playfair Display",
      "fontSize": 28,
      "color": "#3d2b1f",
      "fontWeight": 700
    }
  ]
}`}</pre>
              </details>
            )}
          </div>

          {/* Info card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Info
            </h3>
            <dl className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <dt className="text-gray-500">Designs</dt>
                <dd className="font-medium text-gray-900">{designsCount}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-gray-500">ID</dt>
                <dd className="font-mono text-xs text-gray-600 truncate max-w-[140px]">{templateId}</dd>
              </div>
            </dl>
            <Link
              href={`/admin/templates/${templateId}/builder`}
              className="block w-full text-center bg-[#2C2416] text-white text-sm font-medium py-2 rounded-lg
                         hover:bg-[#3D3220] transition-colors"
            >
              Open in Builder →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Tekstlagen editor — full width below both columns ─────────────── */}
      {rawJson && isTemplateDesign(rawJson) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Tekstlagen bewerken</h2>
          <p className="text-xs text-gray-400 mb-5">
            Wijzigingen worden direct in het JSON-veld bijgewerkt en meegeslagen via &ldquo;Opslaan&rdquo;.
          </p>
          <TemplateEditor initialDesign={rawJson} onChange={handleEditorChange} />
        </div>
      )}
    </div>
  )
}
