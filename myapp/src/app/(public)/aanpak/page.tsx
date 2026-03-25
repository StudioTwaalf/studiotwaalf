import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Onze aanpak – Studio Twaalf',
  description:
    'Ontdek hoe Studio Twaalf werkt: van template kiezen en personaliseren tot gadgets selecteren en een offerte aanvragen. DIY of samen — jij kiest.',
}

const STEPS = [
  {
    number: '01',
    title: 'Kies een template',
    description:
      'Start vanuit een zorgvuldig ontworpen basisontwerp dat past bij jouw moment — geboorte, huwelijk of een ander bijzonder concept. Elk template is zacht, premium en volledig personaliseerbaar.',
    color: '#FFCED3',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Personaliseer je ontwerp',
    description:
      'Pas naam, datum, tekst, kleuren en illustraties aan in onze intuïtieve design tool. Verplaats elementen vrij, kies lettertypes en zie meteen hoe het eruit ziet. Geen ontwerpervaring nodig.',
    color: '#E8DCBB',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Kies je gadgets en afwerking',
    description:
      'Breid je concept uit met doopsuiker, verpakkingen, labels, cadeautjes en meer. Alles wordt visueel afgestemd op jouw kaartje — zodat elk element in dezelfde sfeer ademt.',
    color: '#A8BFA3',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Bekijk jouw concept',
    description:
      'Bekijk een overzicht van alles wat je hebt samengesteld: kaartje, gadgets en afwerking. Download een conceptoverzicht en controleer elk detail voor je de volgende stap zet.',
    color: '#E7C46A',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    number: '05',
    title: 'Vraag je offerte aan',
    description:
      'Stuur je concept door en wij maken een gedetailleerde offerte op. We nemen snel contact op om alles te bespreken, de papier- en afwerkingskeuze te bevestigen en de productie te starten.',
    color: '#EDE0D4',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="12" y2="17" />
      </svg>
    ),
  },
]

const TRUST = [
  {
    title: 'Jij behoudt de controle',
    description:
      'Via de design tool bepaal jij het ontwerp. Wij zorgen voor de productie en afwerking. Geen verrassingen, geen miscommunicatie.',
  },
  {
    title: 'Persoonlijke begeleiding',
    description:
      'Bij vragen of twijfels staan we klaar. Maatwerk is ook mogelijk als je liever alles samen overlegt.',
  },
  {
    title: 'Transparante offerte',
    description:
      'Je offerte is duidelijk, gedetailleerd en altijd vrijblijvend. Pas na jouw goedkeuring starten we met de productie.',
  },
  {
    title: 'Snelle levering',
    description:
      'We leveren in heel België en Nederland. Afhalen in Deerlijk is ook mogelijk op afspraak.',
  },
]

export default function AanpakPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-studio-beige pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-4">
              Onze aanpak
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-studio-black leading-tight text-balance mb-6">
              Van inspiratie tot concept in vijf stappen
            </h1>
            <p className="text-[#8A7A6A] text-lg leading-relaxed mb-8 max-w-xl">
              Studio Twaalf maakt het ontwerpen van je geboorte- of huwelijksconcept eenvoudig en
              aangenaam. Of je nu zelf aan de slag gaat met de design tool of liever alles samen overlegt
              — wij begeleiden je van begin tot einde.
            </p>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 bg-studio-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#2C2416] transition-colors"
            >
              Start met ontwerpen
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Steps ─────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-3">
              Het proces
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-studio-black leading-tight text-balance">
              Zo werkt het
            </h2>
          </div>

          <div className="space-y-5">
            {STEPS.map((step, i) => (
              <div key={step.number} className="flex gap-6 sm:gap-8 items-start group">
                {/* Left: number + line */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center z-10"
                    style={{ background: step.color, color: '#2C2416' }}
                  >
                    {step.icon}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-px flex-1 min-h-[2rem] mt-1" style={{ background: '#EDE7D9' }} />
                  )}
                </div>

                {/* Right: content */}
                <div className="bg-[#FAFAF7] border border-[#EDE7D9] rounded-2xl p-6 flex-1 mb-5 hover:shadow-soft transition-shadow">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-[10px] font-bold text-[#C4B8A0] tracking-widest">
                      {step.number}
                    </span>
                    <h3 className="text-base font-semibold text-studio-black">{step.title}</h3>
                  </div>
                  <p className="text-[0.8125rem] text-[#8A7A6A] leading-relaxed max-w-2xl">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIY vs Maatwerk ─────────────────────────────────────────────── */}
      <section className="bg-studio-beige py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-3">
              Jouw keuze
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-studio-black leading-tight text-balance">
              DIY of samen creëren
            </h2>
            <p className="text-[#8A7A6A] text-base leading-relaxed mt-4">
              Bij Studio Twaalf passen we ons aan aan jou — niet omgekeerd.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* DIY */}
            <div className="bg-white border border-[#EDE7D9] rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-studio-sand/40 flex items-center justify-center mb-5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2C2416" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-semibold text-studio-black mb-3">
                Design tool — doe het zelf
              </h3>
              <p className="text-[#8A7A6A] text-sm leading-relaxed mb-6">
                Ga zelf aan de slag met onze intuïtieve online tool. Kies een template, personaliseer
                naar jouw smaak en stel het volledige concept samen — op je eigen tempo, wanneer het
                jou past.
              </p>
              <ul className="space-y-2 mb-8">
                {[
                  'Meer dan 10 templates beschikbaar',
                  'Vrij te personaliseren op naam, datum en tekst',
                  'Realtime preview van je concept',
                  'Direct offerte aanvragen vanuit de tool',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[#8A7A6A]">
                    <span className="w-1.5 h-1.5 rounded-full bg-studio-yellow flex-shrink-0 mt-1.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 bg-studio-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#2C2416] transition-colors"
              >
                Start met ontwerpen
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Custom */}
            <div className="bg-[#2C2416] rounded-2xl p-8 relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
              />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-5">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E7C46A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl font-semibold text-white mb-3">
                  Samen creëren — maatwerk
                </h3>
                <p className="text-[#C4B8A0] text-sm leading-relaxed mb-6">
                  Liever alles samen overlopen? We zitten graag met je samen om jouw wensen te bespreken
                  en een concept op maat te creëren dat volledig is afgestemd op jouw smaak en stijl.
                </p>
                <ul className="space-y-2 mb-8">
                  {[
                    'Persoonlijk overleg — online of in Deerlijk',
                    'Ontwerp volledig op maat',
                    'Begeleiding van begin tot levering',
                    'Voor complexe of grote concepten',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[#C4B8A0]">
                      <span className="w-1.5 h-1.5 rounded-full bg-studio-yellow flex-shrink-0 mt-1.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-studio-yellow text-[#2C2416] text-sm font-semibold px-6 py-3 rounded-xl hover:brightness-95 transition-all"
                >
                  Neem contact op
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#F5F0E8] py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-3">
              Rust en vertrouwen
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-studio-black leading-tight text-balance">
              Je bent in goede handen
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TRUST.map((t) => (
              <div key={t.title} className="bg-white border border-[#EDE7D9] rounded-2xl p-6">
                <div className="w-2 h-2 rounded-full bg-studio-yellow mb-4" />
                <h3 className="text-sm font-semibold text-studio-black mb-2">{t.title}</h3>
                <p className="text-[0.8125rem] text-[#8A7A6A] leading-relaxed">{t.description}</p>
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
            Begin vandaag
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-white leading-tight text-balance mb-6">
            Klaar om te starten?
          </h2>
          <p className="text-[#C4B8A0] text-base leading-relaxed mb-10 max-w-xl mx-auto">
            Kies een template, personaliseer naar jouw smaak en vraag een offerte aan. Het kost je
            minder tijd dan je denkt — en het resultaat is altijd de moeite waard.
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
