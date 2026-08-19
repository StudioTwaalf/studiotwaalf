'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Check-in: naam verplicht, e-mail optioneel en niet geverifieerd.
 * Eén scherm, één knop — elke extra stap kost je gasten.
 */
export default function CheckInForm({
  slug,
  photoLimit,
  welcomeText,
}: {
  slug: string
  photoLimit: number
  welcomeText: string | null
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    try {
      const res = await fetch(`/api/wedding/${slug}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? 'Er ging iets mis. Probeer opnieuw.')
        return
      }

      router.refresh()
    } catch {
      setError('Geen verbinding. Probeer het zo dadelijk opnieuw.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <label className="block text-[11px] uppercase tracking-[0.2em] text-white/50">
        Je naam
      </label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        minLength={2}
        maxLength={80}
        autoComplete="name"
        placeholder="Marie Peeters"
        className="mt-2 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-white/50"
      />

      <label className="mt-5 block text-[11px] uppercase tracking-[0.2em] text-white/50">
        E-mail <span className="normal-case tracking-normal text-white/30">— optioneel</span>
      </label>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        maxLength={160}
        autoComplete="email"
        placeholder="marie@voorbeeld.be"
        className="mt-2 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-white/50"
      />
      <p className="mt-2 text-xs text-white/40">
        Zo kunnen we je de foto&apos;s nasturen zodra ze ontwikkeld zijn.
      </p>

      {error && <p className="mt-4 text-sm text-[#FF7A18]">{error}</p>}

      <button
        type="submit"
        disabled={busy || name.trim().length < 2}
        className="mt-8 w-full rounded-full bg-white py-4 text-sm font-medium text-black transition disabled:opacity-40"
      >
        {busy ? 'Even geduld…' : `Geef me mijn ${photoLimit} foto's`}
      </button>

      {welcomeText && (
        <p className="mt-8 whitespace-pre-line text-center text-xs leading-relaxed text-white/40">
          {welcomeText}
        </p>
      )}
    </form>
  )
}
