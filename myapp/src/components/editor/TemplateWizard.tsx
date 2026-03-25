'use client'

/**
 * TemplateWizard — professional multi-step wizard for creating and publishing
 * Studio Twaalf templates directly inside the canvas editor.
 *
 * Steps:
 *  1. Velden      — configure text field editability / locking
 *  2. Gegevens    — name, description, category, tags, default paper
 *  3. Afbeelding  — thumbnail + full preview image upload/URL
 *  4. Publiceren  — review summary + publish / update button
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import type { TemplateDesign, TextElement } from '@/types/template'
import { PAPERS } from '@/data/papers'

// ─── Step definitions ─────────────────────────────────────────────────────────

type WizardStep = 'velden' | 'gegevens' | 'afbeelding' | 'publiceren'

interface StepDef {
  id:    WizardStep
  label: string
}

const STEPS: StepDef[] = [
  { id: 'velden',     label: 'Velden'     },
  { id: 'gegevens',   label: 'Gegevens'   },
  { id: 'afbeelding', label: 'Afbeelding' },
  { id: 'publiceren', label: 'Publiceren' },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const TEMPLATE_CATEGORIES = [
  'Geboorte',
  'Trouwen',
  'Verjaardag',
  'Communie / Vormsel',
  'Kerst',
  'Uitnodiging',
  'Dankkaartje',
  'Andere',
]

// ─── Shared input style ───────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E7C46A] focus:border-[#E7C46A]'
const inputStyle = { borderColor: '#E0D5C5', color: '#2C2416', background: 'white' }

// ─── Component ────────────────────────────────────────────────────────────────

interface LocalEdit {
  editable?:          boolean
  isTemplateLocked?:  boolean
}

interface Props {
  design:            TemplateDesign
  adminTemplateId:   string | null
  initialName:       string
  onClose:           () => void
  /** Called on successful save so the canvas reflects the published design. */
  onCommitDesign:    (updatedDesign: TemplateDesign) => void
  /** Called after save completes — typically redirects to /admin/templates. */
  onSaveComplete:    () => void
}

export default function TemplateWizard({
  design,
  adminTemplateId,
  initialName,
  onClose,
  onCommitDesign,
  onSaveComplete,
}: Props) {

  // ── Step state ──────────────────────────────────────────────────────────────
  const [step,      setStep]      = useState<WizardStep>('velden')
  const stepIndex = STEPS.findIndex((s) => s.id === step)

  // ── Metadata state ──────────────────────────────────────────────────────────
  const [name,         setName]         = useState(initialName)
  const [description,  setDescription]  = useState('')
  const [category,     setCategory]     = useState('')
  const [tagsRaw,      setTagsRaw]      = useState('')
  const [thumbnail,    setThumbnail]    = useState('')
  const [previewImg,   setPreviewImg]   = useState('')
  const [defaultPaper, setDefaultPaper] = useState('')
  const [loadingMeta,  setLoadingMeta]  = useState(!!adminTemplateId)

  // ── Local element edits (batched, applied only on publish) ─────────────────
  const [localEdits, setLocalEdits] = useState<Record<string, LocalEdit>>({})

  // Merge canvas state with local edits for display
  const effectiveEditable = (el: TextElement) =>
    localEdits[el.id]?.editable ?? el.editable
  const effectiveLocked = (el: TextElement) =>
    localEdits[el.id]?.isTemplateLocked ?? el.isTemplateLocked ?? false

  const toggleEditable = (el: TextElement) =>
    setLocalEdits((prev) => ({
      ...prev,
      [el.id]: { ...prev[el.id], editable: !(effectiveEditable(el)) },
    }))

  const toggleLocked = (el: TextElement) =>
    setLocalEdits((prev) => ({
      ...prev,
      [el.id]: { ...prev[el.id], isTemplateLocked: !(effectiveLocked(el)) },
    }))

  // ── Upload state ────────────────────────────────────────────────────────────
  const [uploading,   setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const thumbFileRef = useRef<HTMLInputElement>(null)
  const prevFileRef  = useRef<HTMLInputElement>(null)

  // ── Save state ──────────────────────────────────────────────────────────────
  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // ── Derived values ──────────────────────────────────────────────────────────
  const textElements  = design.elements.filter((el): el is TextElement => el.type === 'text')
  const artboard      = design.artboards[0]
  const editableCount = textElements.filter((el) => effectiveEditable(el)).length
  const lockedCount   = design.elements.filter((el) =>
    localEdits[el.id]?.isTemplateLocked ?? el.isTemplateLocked ?? false,
  ).length

  // ── Load existing metadata when editing ────────────────────────────────────
  useEffect(() => {
    if (!adminTemplateId) return
    fetch(`/api/admin/templates/${adminTemplateId}`)
      .then((r) => r.json())
      .then((t) => {
        if (t.name)            setName(t.name)
        if (t.description)     setDescription(t.description)
        if (t.category)        setCategory(t.category)
        if (t.tags?.length)    setTagsRaw(t.tags.join(', '))
        if (t.thumbnail)       setThumbnail(t.thumbnail)
        if (t.previewImageUrl) setPreviewImg(t.previewImageUrl)
        if (t.defaultPaperId)  setDefaultPaper(t.defaultPaperId)
      })
      .finally(() => setLoadingMeta(false))
  }, [adminTemplateId])

  // ── Upload helper ───────────────────────────────────────────────────────────
  const uploadFile = useCallback(async (file: File, setUrl: (url: string) => void) => {
    setUploading(true)
    setUploadError(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res  = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const text = await res.text()
      let json: { error?: string; url?: string } = {}
      try { json = JSON.parse(text) } catch { /* non-JSON body */ }
      if (!res.ok) throw new Error(json.error ?? `Upload mislukt (HTTP ${res.status})`)
      setUrl(json.url ?? '')
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload mislukt')
    } finally {
      setUploading(false)
    }
  }, [])

  // ── Navigation ──────────────────────────────────────────────────────────────
  const canNext =
    step === 'velden'     ? true :
    step === 'gegevens'   ? !!name.trim() :
    step === 'afbeelding' ? true :
    false

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1].id)
  }
  const handleBack = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1].id)
  }

  // ── Publish ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!name.trim()) return
    setSaving(true)
    setSaveError(null)

    // Build design with all local element edits applied
    const designWithPatches: TemplateDesign = {
      ...design,
      elements: design.elements.map((el) => {
        const patch = localEdits[el.id]
        return patch ? { ...el, ...patch } : el
      }),
    }

    const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)

    try {
      const url    = adminTemplateId
        ? `/api/admin/templates/${adminTemplateId}`
        : '/api/admin/templates'
      const method = adminTemplateId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:              name.trim(),
          description:       description.trim() || undefined,
          category:          category            || undefined,
          tags,
          thumbnail:         thumbnail           || undefined,
          previewImageUrl:   previewImg          || undefined,
          defaultPaperId:    defaultPaper        || undefined,
          widthMm:           artboard?.width,
          heightMm:          artboard?.height,
          defaultDesignJson: designWithPatches,
        }),
      })

      // Safely parse response — body may be empty on some error statuses
      const text = await res.text()
      let json: { error?: string; templateId?: string } = {}
      try { json = JSON.parse(text) } catch { /* non-JSON body */ }

      if (!res.ok) throw new Error(json.error ?? `Opslaan mislukt (HTTP ${res.status})`)

      // Commit patched design to canvas history
      onCommitDesign(designWithPatches)
      // Redirect / cleanup
      onSaveComplete()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Opslaan mislukt')
      setSaving(false)
    }
  }, [
    name, description, category, tagsRaw,
    thumbnail, previewImg, defaultPaper,
    design, localEdits, artboard,
    adminTemplateId, onCommitDesign, onSaveComplete,
  ])

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && !e.shiftKey && step !== 'publiceren' && canNext) {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, canNext, onClose])

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(44,36,22,0.62)', backdropFilter: 'blur(5px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl flex flex-col"
        style={{
          background:  '#FAFAF7',
          boxShadow:   '0 32px 96px rgba(44,36,22,0.35), 0 0 0 1px rgba(232,221,208,0.8)',
          maxHeight:   'calc(100vh - 2rem)',
        }}
      >

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-7 pt-6 pb-1 shrink-0">
          <div>
            <p
              className="text-[10px] font-bold tracking-widest uppercase mb-1"
              style={{ color: '#B5A48A' }}
            >
              {adminTemplateId ? 'Template bijwerken' : 'Nieuw template'}
            </p>
            <h2 className="text-lg font-semibold" style={{ color: '#2C2416' }}>
              Template wizard
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-lg font-light mt-0.5 transition-all"
            style={{ color: '#B5A48A' }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = '#F0E8D4'
              ;(e.currentTarget as HTMLElement).style.color = '#2C2416'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = '#B5A48A'
            }}
          >
            ×
          </button>
        </div>

        {/* ── Step indicator ─────────────────────────────────────────────────── */}
        <div className="flex items-center px-7 pt-4 pb-5 shrink-0">
          {STEPS.map((s, i) => {
            const isActive    = s.id === step
            const isCompleted = i < stepIndex
            return (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => isCompleted ? setStep(s.id) : undefined}
                  disabled={!isCompleted && !isActive}
                  className="flex items-center gap-2"
                  style={{ cursor: isCompleted ? 'pointer' : 'default' }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all"
                    style={{
                      background: isActive    ? '#E7C46A'
                                : isCompleted ? '#2C2416'
                                :               '#E8DDD0',
                      color:      isActive    ? '#2C2416'
                                : isCompleted ? '#FAFAF7'
                                :               '#B5A48A',
                    }}
                  >
                    {isCompleted ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: isActive    ? '#2C2416'
                           : isCompleted ? '#7A6A52'
                           :               '#C4B8A0',
                    }}
                  >
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className="h-px mx-3 shrink-0 transition-all"
                    style={{
                      width:      36,
                      background: i < stepIndex ? '#2C2416' : '#E8DDD0',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* ── Step description ───────────────────────────────────────────────── */}
        <div className="px-7 pb-4 shrink-0">
          <p className="text-sm" style={{ color: '#7A6A52' }}>
            {step === 'velden'
              ? 'Bepaal welke tekstvelden klanten kunnen aanpassen en welke elementen vastgezet zijn.'
              : step === 'gegevens'
                ? 'Vul de templategegevens in. Naam is verplicht.'
                : step === 'afbeelding'
                  ? 'Voeg een thumbnail en grote preview toe die klanten zien in de galerij.'
                  : 'Controleer het template en publiceer het.'}
          </p>
        </div>

        {/* ── Content ────────────────────────────────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto px-7 pb-2"
          style={{ minHeight: 0 }}
        >

          {/* ════ Step 1: Velden ════ */}
          {step === 'velden' && (
            <div>
              {textElements.length === 0 ? (
                <div
                  className="text-center py-12 rounded-xl border border-dashed"
                  style={{ borderColor: '#E0D5C5' }}
                >
                  <svg className="mx-auto mb-2" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C4B8A0" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                  </svg>
                  <p className="text-sm font-medium" style={{ color: '#B5A48A' }}>
                    Geen tekstvelden gevonden
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#C4B8A0' }}>
                    Voeg tekstelementen toe via het canvas.
                  </p>
                </div>
              ) : (
                <div
                  className="rounded-xl overflow-hidden border"
                  style={{ borderColor: '#E0D5C5' }}
                >
                  {/* Column headers */}
                  <div
                    className="grid text-[10px] font-bold uppercase tracking-widest px-4 py-2.5"
                    style={{
                      gridTemplateColumns: '1fr auto auto auto',
                      gap: '12px',
                      background: '#F5EFE9',
                      color: '#B5A48A',
                      borderBottom: '1px solid #E0D5C5',
                    }}
                  >
                    <span>Veldnaam / inhoud</span>
                    <span className="text-center w-20">Bewerkbaar</span>
                    <span className="text-center w-16">Vergrendeld</span>
                    <span className="text-center w-20">Tekengebied</span>
                  </div>

                  {/* Rows */}
                  {textElements.map((el, idx) => {
                    const ab      = design.artboards.find((a) => a.id === el.artboardId)
                    const abLabel = ab?.name ?? ab?.id ?? '—'
                    const editable = effectiveEditable(el)
                    const locked   = effectiveLocked(el)
                    return (
                      <div
                        key={el.id}
                        className="grid items-center px-4 py-3 transition-colors"
                        style={{
                          gridTemplateColumns: '1fr auto auto auto',
                          gap:          '12px',
                          borderBottom: idx < textElements.length - 1 ? '1px solid #F0EBE3' : undefined,
                          background:   'white',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = '#FDFCFA'
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'white'
                        }}
                      >
                        {/* Name + content */}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: '#2C2416' }}>
                            {el.name}
                          </p>
                          <p
                            className="text-[11px] truncate mt-0.5"
                            style={{ color: '#B5A48A', maxWidth: 220 }}
                          >
                            {el.content || <em style={{ color: '#D4C8B4' }}>leeg</em>}
                          </p>
                        </div>

                        {/* Bewerkbaar toggle */}
                        <div className="flex justify-center w-20">
                          <button
                            onClick={() => toggleEditable(el)}
                            title={editable ? 'Klant kan dit aanpassen' : 'Niet aanpasbaar voor klant'}
                            className="relative shrink-0 transition-all focus:outline-none"
                            style={{
                              width:  36,
                              height: 20,
                              borderRadius: 10,
                              background: editable ? '#4ADE80' : '#E0D5C5',
                            }}
                          >
                            <span
                              className="absolute top-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-all"
                              style={{
                                left: editable ? 'calc(100% - 18px)' : '2px',
                              }}
                            />
                          </button>
                        </div>

                        {/* Vergrendeld toggle */}
                        <div className="flex justify-center w-16">
                          <button
                            onClick={() => toggleLocked(el)}
                            title={locked ? 'Positie vergrendeld voor klant' : 'Klant kan verplaatsen'}
                            className="relative shrink-0 transition-all focus:outline-none"
                            style={{
                              width:  36,
                              height: 20,
                              borderRadius: 10,
                              background: locked ? '#E7C46A' : '#E0D5C5',
                            }}
                          >
                            <span
                              className="absolute top-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-all"
                              style={{
                                left: locked ? 'calc(100% - 18px)' : '2px',
                              }}
                            />
                          </button>
                        </div>

                        {/* Artboard badge */}
                        <div className="flex justify-center w-20">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium truncate max-w-full"
                            style={{ background: '#F5EFE9', color: '#7A6A52' }}
                          >
                            {abLabel.length > 9 ? abLabel.slice(0, 9) + '…' : abLabel}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Summary row */}
              <div className="flex items-center gap-5 mt-4 px-0.5">
                <div className="flex items-center gap-1.5 text-xs" style={{ color: '#7A6A52' }}>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0" />
                  {editableCount} bewerkbare velden
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: '#7A6A52' }}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#E7C46A' }} />
                  {lockedCount} vergrendelde elementen
                </div>
                <div className="flex items-center gap-1.5 text-xs ml-auto" style={{ color: '#C4B8A0' }}>
                  {design.elements.length} elementen totaal
                </div>
              </div>
            </div>
          )}

          {/* ════ Step 2: Gegevens ════ */}
          {step === 'gegevens' && (
            <div className="space-y-4">
              {loadingMeta ? (
                <div className="flex items-center justify-center py-12 text-sm" style={{ color: '#B5A48A' }}>
                  <svg className="animate-spin mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".3" />
                    <path d="M21 12a9 9 0 00-9-9" />
                  </svg>
                  Gegevens laden…
                </div>
              ) : (
                <>
                  {/* Name */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#B5A48A' }}>
                      Naam <span style={{ color: '#E77A46' }}>*</span>
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Bijv. Geboortekaartje Ella"
                      className={inputCls}
                      style={inputStyle}
                      autoFocus
                    />
                    {!name.trim() && (
                      <p className="text-[10px] mt-1" style={{ color: '#E77A46' }}>
                        Naam is verplicht om verder te gaan.
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#B5A48A' }}>
                      Omschrijving
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Korte beschrijving voor de template galerij…"
                      rows={2}
                      className={inputCls + ' resize-none'}
                      style={inputStyle}
                    />
                  </div>

                  {/* Category + Tags */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#B5A48A' }}>
                        Categorie
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={inputCls}
                        style={{ ...inputStyle, color: category ? '#2C2416' : '#C4B8A0' }}
                      >
                        <option value="">— kies categorie —</option>
                        {TEMPLATE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#B5A48A' }}>
                        Tags
                        <span className="ml-1 font-normal normal-case" style={{ color: '#C4B8A0' }}>
                          (komma-gescheiden)
                        </span>
                      </label>
                      <input
                        value={tagsRaw}
                        onChange={(e) => setTagsRaw(e.target.value)}
                        placeholder="roze, meisje, modern"
                        className={inputCls}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Default paper */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#B5A48A' }}>
                      Standaard papier
                    </label>
                    <select
                      value={defaultPaper}
                      onChange={(e) => setDefaultPaper(e.target.value)}
                      className={inputCls}
                      style={inputStyle}
                    >
                      <option value="">— geen standaard —</option>
                      {PAPERS.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Format info */}
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
                    style={{ background: '#F5F0E8', color: '#B5A48A' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                    Formaat:{' '}
                    <strong className="ml-1" style={{ color: '#7A6A52' }}>
                      {artboard?.width} × {artboard?.height} mm
                    </strong>
                    <span className="mx-1" style={{ color: '#D4C8B4' }}>·</span>
                    <span>
                      {design.artboards.length} tekengebied
                      {design.artboards.length !== 1 ? 'en' : ''}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ════ Step 3: Afbeelding ════ */}
          {step === 'afbeelding' && (
            <div className="space-y-6">
              {/* ── Thumbnail ── */}
              <ImageUploadBlock
                label="Thumbnail"
                hint="Wordt getoond in de template galerij"
                value={thumbnail}
                onChange={setThumbnail}
                uploading={uploading}
                uploadError={uploadError}
                onUpload={(f) => uploadFile(f, setThumbnail)}
                fileRef={thumbFileRef}
              />

              {/* ── Preview image ── */}
              <ImageUploadBlock
                label="Grote preview"
                hint="Optioneel — voor de template detailpagina"
                value={previewImg}
                onChange={setPreviewImg}
                uploading={uploading}
                uploadError={uploadError}
                onUpload={(f) => uploadFile(f, setPreviewImg)}
                fileRef={prevFileRef}
              />
            </div>
          )}

          {/* ════ Step 4: Publiceren ════ */}
          {step === 'publiceren' && (
            <div className="space-y-4">
              {/* Summary card */}
              <div
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: '#E0D5C5' }}
              >
                {/* Top: thumbnail + name + tags */}
                <div
                  className="flex items-start gap-4 p-4"
                  style={{ background: 'white' }}
                >
                  <div
                    className="shrink-0 rounded-lg border overflow-hidden flex items-center justify-center"
                    style={{
                      width:       72,
                      height:      72,
                      borderColor: '#E0D5C5',
                      background:  artboard?.backgroundColor ?? '#F5EFE9',
                    }}
                  >
                    {thumbnail ? (
                      <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4B8A0" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21,15 16,10 5,21" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: '#2C2416' }}>
                      {name || <em style={{ color: '#C4B8A0' }}>(geen naam)</em>}
                    </p>
                    {description && (
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#7A6A52' }}>
                        {description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {category && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: '#F5EFE9', color: '#7A6A52' }}
                        >
                          {category}
                        </span>
                      )}
                      {tagsRaw.split(',').filter((t) => t.trim()).slice(0, 6).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-[10px]"
                          style={{ background: '#EDE7D9', color: '#B5A48A' }}
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div
                  className="grid grid-cols-4 border-t divide-x"
                  style={{ borderColor: '#F0EBE3', color: '#B5A48A' }}
                >
                  {[
                    { label: 'Formaat',           value: `${artboard?.width} × ${artboard?.height} mm` },
                    { label: 'Tekengebieden',      value: String(design.artboards.length) },
                    { label: 'Bewerkbare velden',  value: String(editableCount) },
                    { label: 'Vergrendeld',        value: String(lockedCount) },
                  ].map((stat) => (
                    <div key={stat.label} className="px-3 py-2.5 text-center" style={{ borderColor: '#F0EBE3' }}>
                      <p className="text-[9px] font-bold uppercase tracking-wider">{stat.label}</p>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: '#2C2416' }}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paper note */}
              {defaultPaper && (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
                  style={{ background: '#F5F0E8', color: '#7A6A52' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" />
                  </svg>
                  Standaard papier:
                  <strong className="ml-1">
                    {PAPERS.find((p) => p.id === defaultPaper)?.name ?? defaultPaper}
                  </strong>
                </div>
              )}

              {/* Error */}
              {saveError && (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
                  style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {saveError}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-7 py-4 shrink-0 border-t"
          style={{ borderColor: '#EDE7D9' }}
        >
          {/* Back / Cancel */}
          <button
            onClick={stepIndex > 0 ? handleBack : onClose}
            className="px-4 py-2 text-sm rounded-xl transition-all"
            style={{ color: '#7A6A52' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#F0E8D4')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            {stepIndex > 0 ? '← Vorige' : 'Annuleren'}
          </button>

          {/* Next / Publish */}
          {step !== 'publiceren' ? (
            <button
              onClick={handleNext}
              disabled={!canNext}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: canNext ? '#E7C46A' : '#F0E8D4',
                color:      canNext ? '#2C2416' : '#C4B8A0',
                cursor:     canNext ? 'pointer'  : 'not-allowed',
              }}
            >
              Volgende
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: !name.trim() || saving ? '#F0E8D4' : '#E7C46A',
                color:      !name.trim() || saving ? '#C4B8A0' : '#2C2416',
                cursor:     !name.trim() || saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? (
                <>
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".3" />
                    <path d="M21 12a9 9 0 00-9-9" />
                  </svg>
                  Publiceren…
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                  {adminTemplateId ? 'Template bijwerken' : 'Template publiceren'}
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── ImageUploadBlock (internal helper component) ─────────────────────────────

interface ImageUploadBlockProps {
  label:       string
  hint?:       string
  value:       string
  onChange:    (url: string) => void
  uploading:   boolean
  uploadError: string | null
  onUpload:    (file: File) => void
  fileRef:     React.RefObject<HTMLInputElement>
}

function ImageUploadBlock({
  label, hint, value, onChange, uploading, uploadError, onUpload, fileRef,
}: ImageUploadBlockProps) {
  return (
    <div>
      <div className="mb-2.5">
        <label
          className="block text-[10px] font-bold uppercase tracking-widest"
          style={{ color: '#B5A48A' }}
        >
          {label}
        </label>
        {hint && (
          <p className="text-[11px] mt-0.5" style={{ color: '#C4B8A0' }}>{hint}</p>
        )}
      </div>

      <div className="flex gap-3">
        {/* Preview square */}
        <div
          className="shrink-0 rounded-xl border overflow-hidden flex items-center justify-center"
          style={{
            width:       88,
            height:      88,
            borderColor: '#E0D5C5',
            background:  value ? 'transparent' : '#F5EFE9',
          }}
        >
          {value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4C8B4" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21,15 16,10 5,21" />
            </svg>
          )}
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-2">
          <input
            type="file"
            ref={fileRef}
            accept="image/png,image/jpeg,image/webp,image/avif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onUpload(f)
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all w-full justify-center"
            style={{ borderColor: '#E0D5C5', color: '#5C4D3A', background: 'white' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#F5EFE9')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'white')}
          >
            {uploading ? (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".3" />
                <path d="M21 12a9 9 0 00-9-9" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
            )}
            {uploading ? 'Uploaden…' : 'Afbeelding uploaden'}
          </button>

          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="of plak een URL…"
            className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E7C46A]"
            style={{ borderColor: '#E0D5C5', color: '#2C2416', background: 'white' }}
          />

          {uploadError && (
            <p className="text-xs" style={{ color: '#DC2626' }}>{uploadError}</p>
          )}

          {value && (
            <button
              onClick={() => onChange('')}
              className="text-xs transition-colors"
              style={{ color: '#C4B8A0' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#7A6A52')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#C4B8A0')}
            >
              Verwijder afbeelding
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
