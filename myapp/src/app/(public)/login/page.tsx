'use client'

import { useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'

export default function LoginPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const next         = searchParams.get('next') ?? '/account/projecten'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.ok) {
      trackEvent({ event: 'login', method: 'email' })
      router.push(next)
    } else {
      setError('Ongeldig e-mailadres of wachtwoord.')
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8">
          <div className="mb-8 text-center">
            <h1 className="text-[1.5rem] font-serif text-[#2C2416] tracking-tight">
              Inloggen
            </h1>
            <p className="text-xs text-[#9C8F7A] mt-2">
              Log in om je projecten en bestellingen te bekijken.
            </p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#7A6A52] mb-1.5">
                E-mailadres
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm
                           bg-white focus:outline-none focus:ring-2 focus:ring-[#E7C46A]/50
                           focus:border-[#E7C46A] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-[#7A6A52] mb-1.5">
                Wachtwoord
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm
                           bg-white focus:outline-none focus:ring-2 focus:ring-[#E7C46A]/50
                           focus:border-[#E7C46A] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2C2416] text-white text-sm font-semibold py-2.5 px-4
                         rounded-xl hover:bg-[#3D3220] focus:outline-none focus:ring-2
                         focus:ring-[#E7C46A] focus:ring-offset-2 transition-colors
                         disabled:opacity-60"
            >
              {loading ? 'Bezig…' : 'Inloggen'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#B5A48A]">
            Nog geen account?{' '}
            <Link href="/register" className="text-[#8C6D1A] hover:underline font-medium">
              Registreren
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
