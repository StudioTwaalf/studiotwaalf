'use client'

import { useState, FormEvent } from 'react'

type FormState = 'idle' | 'sending' | 'success' | 'error'

const SUBJECTS = [
  'Geboortekaartje op maat',
  'Huwelijksconcept',
  'Doopsuiker',
  'Gepersonaliseerd cadeau',
  'Maatwerk / ander',
]

export default function ContactForm() {
  const [state, setState] = useState<FormState>('idle')
  const [form, setForm] = useState({
    naam: '',
    email: '',
    telefoon: '',
    onderwerp: '',
    bericht: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setState('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setState('success')
        setForm({ naam: '', email: '', telefoon: '', onderwerp: '', bericht: '' })
      } else {
        setState('error')
      }
    } catch {
      setState('error')
    }
  }

  const inputCls =
    'w-full bg-white border border-[#E0D5C5] rounded-xl px-4 py-3 text-sm text-studio-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E7C46A]/60 focus:border-[#E7C46A]/60 transition-all'

  const labelCls = 'block text-xs font-semibold text-[#7A6A52] uppercase tracking-wider mb-1.5'

  if (state === 'success') {
    return (
      <div className="bg-[#F0F7F0] border border-[#A8BFA3]/40 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[#A8BFA3]/20 flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4A7A4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="font-serif text-xl font-semibold text-studio-black mb-2">
          Bericht ontvangen!
        </h3>
        <p className="text-[#8A7A6A] text-sm leading-relaxed">
          Bedankt voor je bericht. We nemen zo snel mogelijk contact met je op.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Naam */}
      <div>
        <label htmlFor="naam" className={labelCls}>
          Naam <span className="text-[#E7C46A]">*</span>
        </label>
        <input
          id="naam"
          name="naam"
          type="text"
          required
          autoComplete="name"
          placeholder="Je naam en voornaam"
          value={form.naam}
          onChange={handleChange}
          className={inputCls}
        />
      </div>

      {/* Email + Telefoon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="email" className={labelCls}>
            E-mailadres <span className="text-[#E7C46A]">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="jouw@email.be"
            value={form.email}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="telefoon" className={labelCls}>
            Telefoonnummer
            <span className="text-[#B5A48A] font-normal ml-1">(optioneel)</span>
          </label>
          <input
            id="telefoon"
            name="telefoon"
            type="tel"
            autoComplete="tel"
            placeholder="+32 ..."
            value={form.telefoon}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
      </div>

      {/* Onderwerp */}
      <div>
        <label htmlFor="onderwerp" className={labelCls}>
          Onderwerp <span className="text-[#E7C46A]">*</span>
        </label>
        <select
          id="onderwerp"
          name="onderwerp"
          required
          value={form.onderwerp}
          onChange={handleChange}
          className={inputCls}
        >
          <option value="" disabled>Kies een onderwerp</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Bericht */}
      <div>
        <label htmlFor="bericht" className={labelCls}>
          Jouw bericht <span className="text-[#E7C46A]">*</span>
        </label>
        <textarea
          id="bericht"
          name="bericht"
          required
          rows={5}
          placeholder="Vertel ons over jouw moment, stijl of wensen..."
          value={form.bericht}
          onChange={handleChange}
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* Error message */}
      {state === 'error' && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          Er liep iets mis. Probeer het opnieuw of stuur ons een e-mail via hallo@studiotwaalf.be.
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={state === 'sending'}
        className="w-full inline-flex items-center justify-center gap-2 bg-studio-black text-white text-sm font-semibold px-6 py-3.5 rounded-xl hover:bg-[#2C2416] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {state === 'sending' ? (
          <>
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            Versturen...
          </>
        ) : (
          <>
            Verstuur je bericht
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>

      <p className="text-[11px] text-[#B5A48A] text-center leading-relaxed">
        We antwoorden normaal binnen 1-2 werkdagen. Jouw gegevens worden nooit gedeeld met derden.
      </p>
    </form>
  )
}
