import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Drukwerk met karakter – Studio Twaalf',
  description:
    'Ontdek premium drukwerk van Studio Twaalf: geboortekaartjes, huwelijksuitnodigingen, labels en bedankkaartjes op maat. Vanuit Deerlijk, actief in heel Vlaanderen.',
}

const CATEGORIES = [
  {
    title: 'Geboortekaartjes',
    description:
      'Een kaartje dat het begin van een nieuw leven aankondigt. Warm, persoonlijk en volledig afgestemd op jullie stijl.',
    color: '#FFCED3',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
  {
    title: 'Huwelijksdrukwerk',
    description:
      'Van uitnodiging tot menukaart en bedankje: een coherent geheel voor jullie mooiste dag.',
    color: '#E8DCBB',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    title: 'Bedankkaartjes',
    description:
      'Een klein gebaar dat veel zegt. Stijlvolle bedankjes die aansluiten bij het concept van de grote dag.',
    color: '#A8BFA3',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    title: 'Labels & stickers',
    description:
      'Voor op doosjes, potjes of als finishing touch. Perfect afgestemd op kleuren en lettertype van het kaartje.',
    color: '#E7C46A',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    title: 'Naamkaartjes',
    description:
      'Kleine printitems met grote impact: tafelkaartjes, naamplaatjes of persoonlijke labelkaartjes.',
    color: '#F5F0E8',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    ),
  },
  {
    title: "Menukaarten & programma\u2019s",
    description:
      "Stijlvolle menu\u2019s en programmakaarten die passen bij het totaalplaatje van jullie huwelijk.",
    color: '#EDE0D4',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="12" y2="17" />
      </svg>
    ),
  },
]

const REASONS = [
  {
    title: 'Zachte, premium stijl',
    description:
      'Elk ontwerp ademt rust en elegantie. Geen drukke patronen, maar een stijl die de tijd doorstaat.',
  },
  {
    title: 'Volledig personaliseerbaar',
    description:
      'Naam, datum, tekst, kleur en illustratie — alles stemt u zelf af via de online design tool of via ons.',
  },
  {
    title: 'Samenhang met het concept',
    description:
      'Kaartje, doopsuiker, verpakking en cadeautje in één doorlopende stijl. Dat is wat Studio Twaalf uniek maakt.',
  },
  {
    title: 'Zorgvuldige papierkeuze',
    description:
      'Van dik en mat tot zacht gesatineerd — papier en afwerking worden bewust gekozen voor het beste resultaat.',
  },
]

export default function DrukwerkPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-studio-beige pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-4">
              Drukwerk
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-studio-black leading-tight text-balance mb-6">
              Drukwerk met karakter
            </h1>
            <p className="text-[#8A7A6A] text-lg leading-relaxed mb-8 max-w-xl">
              Elk kaartje, label of uitnodiging vertelt een stukje van jouw verhaal. Bij Studio Twaalf
              ontwerpen we drukwerk dat niet alleen mooi is, maar dat ook voelt als jij. Vanuit Deerlijk
              begeleiden we klanten in heel Vlaanderen.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 bg-studio-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#2C2416] transition-colors"
              >
                Start met ontwerpen
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border border-[#E0D5C5] text-[#7A6A52] text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#F0EBE0] transition-colors"
              >
                Neem contact op
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────────── */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-3">
              Wat is mogelijk
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-studio-black leading-tight text-balance">
              Voor elk bijzonder moment
            </h2>
            <p className="text-[#8A7A6A] text-base leading-relaxed mt-4">
              Van geboorteaankondiging tot huwelijksuitnodiging: Studio Twaalf ontwerpt drukwerk
              dat past bij de sfeer en het gevoel dat jij wil uitstralen.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATEGORIES.map((cat) => (
              <div key={cat.title} className="bg-[#FAFAF7] border border-[#EDE7D9] rounded-2xl p-6 hover:shadow-soft transition-shadow">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: cat.color, color: '#2C2416' }}
                >
                  {cat.icon}
                </div>
                <h3 className="text-sm font-semibold text-studio-black mb-2">{cat.title}</h3>
                <p className="text-[0.8125rem] text-[#8A7A6A] leading-relaxed">{cat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Studio Twaalf ─────────────────────────────────────────────── */}
      <section className="bg-studio-beige py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-3">
                Waarom Studio Twaalf
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-studio-black leading-tight text-balance mb-6">
                Meer dan alleen een kaartje
              </h2>
              <p className="text-[#8A7A6A] text-base leading-relaxed mb-8">
                Bij Studio Twaalf staat elk drukwerkstuk in het teken van het totale concept. Jouw
                geboortekaartje op maat wordt de rode draad door alle bijhorende producten — doopsuiker,
                verpakking, labels en cadeautjes. Alles ademt dezelfde sfeer.
              </p>
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 bg-studio-yellow text-[#2C2416] text-sm font-semibold px-6 py-3 rounded-xl hover:brightness-95 transition-all"
              >
                Bekijk templates
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {REASONS.map((r) => (
                <div key={r.title} className="bg-white border border-[#EDE7D9] rounded-2xl p-5">
                  <div className="w-2 h-2 rounded-full bg-studio-yellow mb-3" />
                  <h3 className="text-sm font-semibold text-studio-black mb-1.5">{r.title}</h3>
                  <p className="text-[0.8125rem] text-[#8A7A6A] leading-relaxed">{r.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="bg-[#2C2416] py-20 lg:py-28 relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #E7C46A 0%, transparent 60%)' }}
        />
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative max-w-3xl mx-auto px-6 sm:px-8 text-center">
          <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-4">
            Klaar om te starten?
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-white leading-tight text-balance mb-6">
            Ontwerp jouw geboortekaartje op maat
          </h2>
          <p className="text-[#C4B8A0] text-base leading-relaxed mb-10 max-w-xl mx-auto">
            Kies een template, personaliseer naar jouw smaak en vraag eenvoudig een offerte aan.
            Wij staan klaar om je te begeleiden.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 bg-studio-yellow text-[#2C2416] text-sm font-semibold px-7 py-3.5 rounded-xl hover:brightness-95 transition-all"
            >
              Start met ontwerpen
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm font-semibold px-7 py-3.5 rounded-xl hover:bg-white/15 transition-colors"
            >
              Neem contact op
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
