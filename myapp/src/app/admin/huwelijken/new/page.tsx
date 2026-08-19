import Link from 'next/link'
import { createWeddingAction } from '../actions'

export const dynamic = 'force-dynamic'

export default function NewWeddingPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="max-w-xl">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/admin/huwelijken" className="hover:text-gray-600 transition-colors">
          Wegwerpcamera&apos;s
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Nieuw feest</span>
      </nav>

      {searchParams.error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      )}

      <form action={createWeddingAction} className="space-y-5">
        <Field label="Namen van het koppel" hint="Bv. Hanne & Tom">
          <input
            name="coupleName"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
          />
        </Field>

        <Field label="Datum van het feest">
          <input
            name="eventDate"
            type="date"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
          />
        </Field>

        <Field
          label="Link (slug)"
          hint="Leeg laten = automatisch uit de namen. Dit komt in de QR-code: /w/hanne-en-tom"
        >
          <input
            name="slug"
            placeholder="hanne-en-tom"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono"
          />
        </Field>

        <Field label="Foto's per gast" hint="20 is de klassieke wegwerpcamera">
          <input
            name="photoLimit"
            type="number"
            min={1}
            max={200}
            defaultValue={20}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
          />
        </Field>

        <Field
          label="Tekst op het check-in scherm"
          hint="Goede plek voor je privacy-melding: wie de foto's krijgt en hoe lang ze bewaard worden."
        >
          <textarea
            name="welcomeText"
            rows={4}
            defaultValue={
              'Je foto’s gaan naar het bruidspaar en worden 12 maanden bewaard.\nLiever niet? Laat het ons weten en we verwijderen ze.'
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
          />
        </Field>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-full bg-gray-900 px-6 py-2.5 text-sm text-white hover:bg-gray-700 transition-colors"
          >
            Aanmaken
          </button>
          <Link
            href="/admin/huwelijken"
            className="rounded-full border border-gray-300 px-6 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Annuleren
          </Link>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1.5">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-gray-400">{hint}</span>}
    </label>
  )
}
