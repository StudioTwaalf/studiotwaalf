'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  label:       string
  value:       string
  placeholder?: string
  type?:       'text' | 'email' | 'tel'
  onSave:      (value: string) => Promise<void> | void
  empty?:      string
}

/**
 * Inline-editable field for the Gegevens page.
 * Displays value in read mode; click the edit icon to enter write mode.
 * Saves on Enter or "Opslaan" button; cancels on Escape or "Annuleren".
 */
export default function EditableField({
  label,
  value,
  placeholder = 'Voeg toe…',
  type  = 'text',
  onSave,
  empty = '—',
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync draft when prop changes (e.g. after external save)
  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  // Auto-focus when entering edit mode
  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function handleEdit() {
    setDraft(value)
    setError(null)
    setEditing(true)
  }

  function handleCancel() {
    setDraft(value)
    setError(null)
    setEditing(false)
  }

  async function handleSave() {
    if (draft === value) { setEditing(false); return }
    setSaving(true)
    setError(null)
    try {
      await onSave(draft)
      setEditing(false)
    } catch {
      setError('Opslaan mislukt. Probeer opnieuw.')
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter')  { e.preventDefault(); handleSave() }
    if (e.key === 'Escape') { handleCancel() }
  }

  const isEmpty = !value

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-4 py-3.5
                    border-b border-neutral-100 last:border-0">

      <label className="w-full sm:w-36 flex-shrink-0 text-xs font-medium text-[#9C8F7A] tracking-wide pt-0.5">
        {label}
      </label>

      <div className="flex-1">
        {editing ? (
          <div className="space-y-2">
            <input
              ref={inputRef}
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={saving}
              className="w-full rounded-xl border border-[#E7C46A]/60 bg-white px-3 py-2 text-sm
                         text-[#2C2416] placeholder:text-neutral-300
                         focus:outline-none focus:ring-2 focus:ring-[#E7C46A]/40
                         disabled:opacity-60 transition"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#E7C46A] text-[#2C2416]
                           hover:brightness-95 disabled:opacity-60 transition"
              >
                {saving ? 'Opslaan…' : 'Opslaan'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="text-xs text-[#9C8F7A] hover:text-[#2C2416] transition"
              >
                Annuleren
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 group/row">
            <span className={`text-sm flex-1 ${isEmpty ? 'text-[#C4B8A0] italic' : 'text-[#2C2416]'}`}>
              {isEmpty ? empty : value}
            </span>
            <button
              onClick={handleEdit}
              aria-label={`${label} bewerken`}
              className="opacity-0 group-hover/row:opacity-100 p-1 rounded-lg text-[#B5A48A]
                         hover:text-[#2C2416] hover:bg-neutral-100 transition-all duration-150"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
