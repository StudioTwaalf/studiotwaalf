'use client'

import { useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'

const inputCls = `w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm
  bg-white focus:outline-none focus:ring-2 focus:ring-[#E7C46A]/50
  focus:border-[#E7C46A] transition-colors`

function Field({
  id, label, required, children,
}: { id: string; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-[#7A6A52] mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    firstName:       '',
    lastName:        '',
    email:           '',
    password:        '',
    confirmPassword: '',
    street:          '',
    houseNumber:     '',
    bus:             '',
    zipCode:         '',
    city:            '',
    phone:           '',
  })
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirmPassword) {
      setError('Wachtwoorden komen niet overeen.')
      return
    }
    if (form.password.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens bevatten.')
      return
    }

    setLoading(true)

    const houseNumber = [form.houseNumber, form.bus].filter(Boolean).join(' bus ')

    const res = await fetch('/api/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName:   form.firstName,
        lastName:    form.lastName,
        email:       form.email,
        password:    form.password,
        street:      form.street      || null,
        houseNumber: houseNumber      || null,
        zipCode:     form.zipCode     || null,
        city:        form.city        || null,
        phone:       form.phone       || null,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Er is iets misgegaan.')
      setLoading(false)
      return
    }

    const login = await signIn('credentials', {
      email: form.email, password: form.password, redirect: false,
    })
    setLoading(false)
    if (login?.ok) trackEvent({ event: 'sign_up', method: 'email' })
    router.push(login?.ok ? '/account/projecten' : '/login')
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8">

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-[1.5rem] font-serif text-[#2C2416] tracking-tight">
              Account aanmaken
            </h1>
            <p className="text-xs text-[#9C8F7A] mt-2">
              Maak een account aan om je ontwerpen en bestellingen te beheren.
            </p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── Persoonlijke gegevens ── */}
            <p className="text-[10px] font-bold text-[#C4B8A0] uppercase tracking-widest pt-1">
              Persoonlijke gegevens
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Field id="firstName" label="Voornaam" required>
                <input id="firstName" type="text" autoComplete="given-name" required
                  value={form.firstName} onChange={set('firstName')} className={inputCls} />
              </Field>
              <Field id="lastName" label="Achternaam">
                <input id="lastName" type="text" autoComplete="family-name"
                  value={form.lastName} onChange={set('lastName')} className={inputCls} />
              </Field>
            </div>

            <Field id="email" label="E-mailadres" required>
              <input id="email" type="email" autoComplete="email" required
                value={form.email} onChange={set('email')} className={inputCls} />
            </Field>

            <Field id="phone" label="Telefoonnummer">
              <input id="phone" type="tel" autoComplete="tel"
                value={form.phone} onChange={set('phone')} className={inputCls} />
            </Field>

            {/* ── Adres ── */}
            <p className="text-[10px] font-bold text-[#C4B8A0] uppercase tracking-widest pt-2">
              Adres
            </p>

            <Field id="street" label="Straat">
              <input id="street" type="text" autoComplete="address-line1"
                value={form.street} onChange={set('street')} className={inputCls} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field id="houseNumber" label="Huisnummer">
                <input id="houseNumber" type="text" autoComplete="off"
                  value={form.houseNumber} onChange={set('houseNumber')} className={inputCls} />
              </Field>
              <Field id="bus" label="Bus / toevoeging">
                <input id="bus" type="text" autoComplete="off"
                  value={form.bus} onChange={set('bus')} className={inputCls} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field id="zipCode" label="Postcode">
                <input id="zipCode" type="text" autoComplete="postal-code"
                  value={form.zipCode} onChange={set('zipCode')} className={inputCls} />
              </Field>
              <Field id="city" label="Gemeente">
                <input id="city" type="text" autoComplete="address-level2"
                  value={form.city} onChange={set('city')} className={inputCls} />
              </Field>
            </div>

            {/* ── Wachtwoord ── */}
            <p className="text-[10px] font-bold text-[#C4B8A0] uppercase tracking-widest pt-2">
              Wachtwoord
            </p>

            <Field id="password" label="Wachtwoord" required>
              <input id="password" type="password" autoComplete="new-password" required
                value={form.password} onChange={set('password')} className={inputCls} />
              <p className="text-[10px] text-[#B5A48A] mt-1">Minimaal 8 tekens.</p>
            </Field>

            <Field id="confirmPassword" label="Wachtwoord bevestigen" required>
              <input id="confirmPassword" type="password" autoComplete="new-password" required
                value={form.confirmPassword} onChange={set('confirmPassword')} className={inputCls} />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2C2416] text-white text-sm font-semibold py-2.5 px-4
                         rounded-xl hover:bg-[#3D3220] focus:outline-none focus:ring-2
                         focus:ring-[#E7C46A] focus:ring-offset-2 transition-colors
                         disabled:opacity-60 mt-2"
            >
              {loading ? 'Account aanmaken…' : 'Account aanmaken'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#B5A48A]">
            Al een account?{' '}
            <Link href="/login" className="text-[#8C6D1A] hover:underline font-medium">
              Inloggen
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
