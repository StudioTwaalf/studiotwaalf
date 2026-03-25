import type { Metadata } from 'next'
import { getAccountProfile } from '@/lib/data/account/get-account-profile'
import PageIntro from '@/components/account/PageIntro'
import SectionCard from '@/components/account/SectionCard'
import InfoRow from '@/components/account/InfoRow'

export const metadata: Metadata = {
  title: 'Mijn gegevens — Studio Twaalf',
}

// TODO: Replace with session.user.id from getServerSession(authOptions)
const MOCK_USER_ID = 'user-1'

export default async function GegevensPage() {
  const user = await getAccountProfile(MOCK_USER_ID)

  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-[#9C8F7A]">Gegevens konden niet worden geladen.</p>
      </div>
    )
  }

  const addressFull = [user.address.street, user.address.zip, user.address.city, user.address.country]
    .filter(Boolean)
    .join(', ')

  const memberSince = new Date(user.createdAt).toLocaleDateString('nl-BE', {
    month: 'long', year: 'numeric',
  })

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Mijn account"
        title="Gegevens"
        body="Beheer je persoonlijke informatie, adres en voorkeuren."
      />

      {/* ── Persoonlijke gegevens ─────────────────────────────────────── */}
      <SectionCard
        title="Persoonlijke gegevens"
        subtitle="Naam, e-mail en contactgegevens"
        action={
          <button className="text-xs font-medium text-[#8C6D1A] hover:text-[#2C2416] transition-colors">
            Bewerken
          </button>
        }
      >
        <dl>
          <InfoRow label="Naam"           value={user.name} />
          <InfoRow label="E-mailadres"    value={user.email} />
          <InfoRow label="Telefoonnummer" value={user.phone} />
          <InfoRow label="Bedrijf"        value={user.company} />
          <InfoRow label="Lid sinds"      value={memberSince} />
        </dl>
      </SectionCard>

      {/* ── Adres ─────────────────────────────────────────────────────── */}
      <SectionCard
        title="Adres"
        subtitle="Leveringsadres voor bestellingen"
        action={
          <button className="text-xs font-medium text-[#8C6D1A] hover:text-[#2C2416] transition-colors">
            Bewerken
          </button>
        }
      >
        <dl>
          <InfoRow label="Straat"   value={user.address.street} />
          <InfoRow label="Stad"     value={[user.address.zip, user.address.city].filter(Boolean).join(' ')} />
          <InfoRow label="Land"     value={user.address.country} />
          <InfoRow label="Volledig" value={addressFull || null} />
        </dl>
      </SectionCard>

      {/* ── Facturatie ────────────────────────────────────────────────── */}
      <SectionCard
        title="Facturatie"
        subtitle="BTW-nummer en facturatiegegevens"
        action={
          <button className="text-xs font-medium text-[#8C6D1A] hover:text-[#2C2416] transition-colors">
            Bewerken
          </button>
        }
      >
        <dl>
          <InfoRow
            label="Factuuradres"
            value={user.billing.sameAsShipping ? 'Zelfde als leveringsadres' : null}
            empty="Niet ingesteld"
          />
          <InfoRow label="Bedrijfsnaam" value={user.billing.companyName} />
          <InfoRow label="BTW-nummer"   value={user.billing.vatNumber} />
        </dl>
      </SectionCard>

      {/* ── Voorkeuren ────────────────────────────────────────────────── */}
      <SectionCard
        title="Voorkeuren"
        subtitle="Taal en communicatie-instellingen"
      >
        <dl>
          <InfoRow
            label="Taal"
            value={{ nl: 'Nederlands', fr: 'Frans', en: 'Engels' }[user.preferences.language]}
          />
          <InfoRow
            label="Nieuwsbrief"
            value={
              user.preferences.newsletter
                ? <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden />
                    Ingeschreven
                  </span>
                : <span className="text-[#9C8F7A] text-xs">Uitgeschreven</span>
            }
          />
        </dl>
      </SectionCard>

      {/* ── Beveiliging ───────────────────────────────────────────────── */}
      <SectionCard title="Beveiliging">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#2C2416] font-medium">Wachtwoord</p>
            <p className="text-xs text-[#9C8F7A] mt-0.5">Wijzig je wachtwoord via een beveiligde link</p>
          </div>
          <button className="text-xs font-semibold px-3.5 py-2 rounded-xl border border-neutral-200
                             text-[#2C2416] bg-white hover:bg-[#F5F0E8] transition-colors duration-150">
            Wijzigen
          </button>
        </div>
      </SectionCard>
    </div>
  )
}
