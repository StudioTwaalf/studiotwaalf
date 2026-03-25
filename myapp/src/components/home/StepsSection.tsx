import Link from 'next/link'

const STEPS = [
  {
    number: '01',
    title: 'Kies een template',
    description: 'Start vanuit een zorgvuldig ontworpen concept voor geboorte, huwelijk of cadeau.',
    color: '#FFCED3',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Personaliseer je design',
    description: 'Pas naam, kleuren, lettertypes en illustraties aan met onze intuïtieve design tool.',
    color: '#E8DCBB',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Kies je producten',
    description: 'Combineer kaartjes, doopsuiker, verpakkingen en cadeaus tot een samenhangend concept.',
    color: '#A8BFA3',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Ontvang je offerte',
    description: 'Download een overzicht en vraag eenvoudig je offerte aan. Wij nemen snel contact op.',
    color: '#E7C46A',
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

export default function StepsSection() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-3">
            Hoe het werkt
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-studio-black leading-tight text-balance">
            Van concept naar realisatie in vier stappen
          </h2>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {STEPS.map((step, i) => (
            <div key={step.number} className="group relative">
              {/* Connector line (desktop only) */}
              {i < STEPS.length - 1 && (
                <div
                  className="hidden lg:block absolute top-9 left-[calc(100%+0px)] w-5 h-px z-10"
                  style={{ background: '#E8DCBB' }}
                />
              )}

              <div className="bg-[#FAFAF7] border border-[#EDE7D9] rounded-2xl p-6 h-full hover:shadow-soft transition-shadow">
                {/* Icon circle */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: step.color, color: '#2C2416' }}
                >
                  {step.icon}
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-[10px] font-bold text-[#C4B8A0] tracking-widest">
                    {step.number}
                  </span>
                  <h3 className="text-sm font-semibold text-studio-black leading-snug">
                    {step.title}
                  </h3>
                </div>

                <p className="text-[0.8125rem] text-[#8A7A6A] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 bg-studio-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#2C2416] transition-colors"
          >
            Start jouw ontwerp
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
