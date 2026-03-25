import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Doopsuiker als deel van jouw concept – Studio Twaalf',
  description:
    'Doopsuiker ideeën op maat: doosjes, potjes en labels die perfect passen bij jouw geboortekaartje. Persoonlijk, premium en coherent met het totaalconcept.',
}

const PRODUCTS = [
  {
    title: 'Doosjes op maat',
    description:
      'Elegante bedankdoosjes met een label of wikkel die aansluit bij de stijl van het geboortekaartje.',
    color: '#FFCED3',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      </svg>
    ),
  },
  {
    title: 'Potjes & weckpotjes',
    description:
      'Kleine potjes gevuld met jouw keuze, voorzien van een gepersonaliseerd deksel of label.',
    color: '#A8BFA3',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6M10 3v1a1 1 0 001 1h2a1 1 0 001-1V3" />
        <rect x="4" y="7" width="16" height="13" rx="2" />
        <path d="M4 11h16" />
      </svg>
    ),
  },
  {
    title: 'Gepersonaliseerde labels',
    description:
      'Labels en wikkelbanderolen met naam, geboortedatum en illustraties — in perfecte aansluiting op het kaartje.',
    color: '#E7C46A',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    title: 'Linten & afwerking',
    description:
      'Kleine details die het grote verschil maken: linten, stickers en afwerkingen die het totaalplaatje compleet maken.',
    color: '#E8DCBB',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        <path d="M8 12s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
  },
  {
    title: 'Kleine bedankjes',
    description:
      'Persoonlijke minigeschenken die aansluiten op het concept: ideaal voor gasten van alle leeftijden.',
    color: '#F5F0E8',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12" />
        <rect x="2" y="7" width="20" height="5" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
      </svg>
    ),
  },
  {
    title: 'Presentatiedoos',
    description:
      'Een stijlvolle doos als cadeauverpakking voor de doopsuiker — mooi om weg te geven, fijn om te ontvangen.',
    color: '#EDE0D4',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
]

export default function DoopsuikerPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-studio-beige pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-4">
              Doopsuiker
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-studio-black leading-tight text-balance mb-6">
              Doopsuiker als deel van jouw totaalconcept
            </h1>
            <p className="text-[#8A7A6A] text-lg leading-relaxed mb-8 max-w-xl">
              Doopsuiker is meer dan een bedankje. Het is een eerste indruk van de sfeer die jullie willen
              neerzetten. Bij Studio Twaalf ontwerpen we doopsuiker ideeën die perfect aansluiten bij het
              geboortekaartje — in dezelfde kleuren, illustraties en lettertypes.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 bg-studio-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#2C2416] transition-colors"
              >
                Stel jouw concept samen
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

      {/* ── Products ─────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-3">
              Ons aanbod
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-studio-black leading-tight text-balance">
              Van doosje tot presentatie
            </h2>
            <p className="text-[#8A7A6A] text-base leading-relaxed mt-4">
              Alles wat je nodig hebt voor een mooie doopsuiker, samengebracht in één samenhangend concept.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PRODUCTS.map((p) => (
              <div key={p.title} className="bg-[#FAFAF7] border border-[#EDE7D9] rounded-2xl p-6 hover:shadow-soft transition-shadow">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: p.color, color: '#2C2416' }}
                >
                  {p.icon}
                </div>
                <h3 className="text-sm font-semibold text-studio-black mb-2">{p.title}</h3>
                <p className="text-[0.8125rem] text-[#8A7A6A] leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Matching section ─────────────────────────────────────────────── */}
      <section className="bg-[#F5F0E8] py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Visual */}
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { bg: '#FFCED3', label: 'Kaartje', sub: 'Zelfde illustratie' },
                  { bg: '#A8BFA3', label: 'Label', sub: 'Zelfde lettertype' },
                  { bg: '#E8DCBB', label: 'Doosje', sub: 'Zelfde kleurpalet' },
                  { bg: '#E7C46A', label: 'Lint', sub: 'Zelfde sfeer' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl p-6 flex flex-col justify-between h-32"
                    style={{ background: item.bg }}
                  >
                    <span className="text-[#2C2416] font-semibold text-sm">{item.label}</span>
                    <span className="text-[#2C2416]/60 text-xs font-medium">{item.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Text */}
            <div className="order-1 lg:order-2">
              <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-3">
                Eén coherent geheel
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-studio-black leading-tight text-balance mb-6">
                Doopsuiker die past bij het kaartje
              </h2>
              <p className="text-[#8A7A6A] text-base leading-relaxed mb-4">
                Wanneer je een concept samenstelt bij Studio Twaalf, stemmen we de doopsuiker volledig
                af op het kaartje. Dezelfde kleuren, hetzelfde lettertype, dezelfde illustraties — zodat
                alles op elk niveau klopt.
              </p>
              <p className="text-[#8A7A6A] text-base leading-relaxed mb-8">
                Het resultaat is een totaalplaatje dat indruk maakt en jouw persoonlijkheid weerspiegelt.
                Dat is wat gasten bijblijft.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/templates"
                  className="inline-flex items-center gap-2 bg-studio-yellow text-[#2C2416] text-sm font-semibold px-6 py-3 rounded-xl hover:brightness-95 transition-all"
                >
                  Stel jouw concept samen
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/aanpak"
                  className="inline-flex items-center gap-2 border border-[#E0D5C5] text-[#7A6A52] text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#F0EBE0] transition-colors"
                >
                  Bekijk onze aanpak
                </Link>
              </div>
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
          className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #FFCED3 0%, transparent 60%)' }}
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
            Stel jouw doopsuiker concept samen
          </h2>
          <p className="text-[#C4B8A0] text-base leading-relaxed mb-10 max-w-xl mx-auto">
            Begin met een template, personaliseer naar jouw smaak en vraag een offerte aan voor
            het volledige concept — kaartje én doopsuiker.
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
