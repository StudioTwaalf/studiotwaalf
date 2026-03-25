import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Gepersonaliseerde cadeaus – Studio Twaalf',
  description:
    'Originele gepersonaliseerde cadeaus voor geboorte, huwelijk of een bijzonder moment. Op maat gemaakt door Studio Twaalf, actief in heel Vlaanderen.',
}

const CATEGORIES = [
  {
    title: 'Geboorte',
    description:
      'Een persoonlijk cadeau dat het aankomst van een nieuw leven viert. Met naam, datum en de sfeer van het concept.',
    color: '#FFCED3',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
  {
    title: 'Huwelijk',
    description:
      'Een cadeau dat past bij het huwelijksconcept: van stijlvol gepersonaliseerde items tot afgestemde drukwerkgeschenken.',
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
    title: 'Verjaardag & jubileum',
    description:
      'Bijzondere momenten verdienen een bijzonder cadeau. Persoonlijk, stijlvol en met oog voor elk detail.',
    color: '#A8BFA3',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 010 8h-1" />
        <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    title: 'Bedankje',
    description:
      'Een kleine blijk van waardering die opvalt en lang bijblijft. Gepersonaliseerd en met zorg samengesteld.',
    color: '#E7C46A',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
]

const FEATURES = [
  {
    number: '01',
    title: 'Persoonlijk ontworpen',
    description:
      'Elk cadeau wordt afgestemd op de persoon, het moment en de stijl. Geen generieke geschenken, maar iets echts.',
  },
  {
    number: '02',
    title: 'Passend bij het concept',
    description:
      'Wanneer het cadeau deel uitmaakt van een geboorte- of huwelijksconcept, stemmen we alles visueel op elkaar af.',
  },
  {
    number: '03',
    title: 'Met zorg verpakt',
    description:
      'Verpakking is deel van de beleving. Stijlvolle doosjes, linten en afwerking maken elk cadeau meteen bijzonder.',
  },
  {
    number: '04',
    title: 'Levering in België & Nederland',
    description:
      'We leveren in heel België en Nederland. Afhalen in Deerlijk is ook mogelijk op afspraak.',
  },
]

export default function CadeausPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-studio-beige pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-4">
              Gepersonaliseerde cadeaus
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-studio-black leading-tight text-balance mb-6">
              Gepersonaliseerde cadeaus met een persoonlijke toets
            </h1>
            <p className="text-[#8A7A6A] text-lg leading-relaxed mb-8 max-w-xl">
              Een cadeau dat echt iets zegt, begint bij een goed idee en de wil om er iets unieks van te
              maken. Bij Studio Twaalf ontwerpen we gepersonaliseerde cadeaus voor geboorte, huwelijk en
              alle bijzondere momenten daartussenin.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-studio-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#2C2416] transition-colors"
              >
                Ontdek de mogelijkheden
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 border border-[#E0D5C5] text-[#7A6A52] text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#F0EBE0] transition-colors"
              >
                Bekijk templates
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Use cases ─────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-3">
              Voor elk moment
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-studio-black leading-tight text-balance">
              Een cadeau voor elk bijzonder moment
            </h2>
            <p className="text-[#8A7A6A] text-base leading-relaxed mt-4">
              Of het nu gaat om een geboorte, een huwelijk of een ander mijlpaalmoment — bij Studio Twaalf
              vindt elk moment een gepast, persoonlijk geschenk.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="bg-studio-beige py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-3">
              Waarom kiezen voor Studio Twaalf
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-studio-black leading-tight text-balance">
              Cadeaus met betekenis
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div key={f.number} className="bg-white border border-[#EDE7D9] rounded-2xl p-6">
                <span className="text-[10px] font-bold text-[#C4B8A0] tracking-widest block mb-3">{f.number}</span>
                <h3 className="text-sm font-semibold text-studio-black mb-2">{f.title}</h3>
                <p className="text-[0.8125rem] text-[#8A7A6A] leading-relaxed">{f.description}</p>
              </div>
            ))}
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
            Aan de slag
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-white leading-tight text-balance mb-6">
            Op zoek naar het perfecte, originele cadeau?
          </h2>
          <p className="text-[#C4B8A0] text-base leading-relaxed mb-10 max-w-xl mx-auto">
            Vertel ons over het moment, de persoon en jouw wensen. Wij denken graag met je mee om iets
            te creëren dat écht iets betekent.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-studio-yellow text-[#2C2416] text-sm font-semibold px-7 py-3.5 rounded-xl hover:brightness-95 transition-all"
            >
              Neem contact op
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm font-semibold px-7 py-3.5 rounded-xl hover:bg-white/15 transition-colors"
            >
              Bekijk templates
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
