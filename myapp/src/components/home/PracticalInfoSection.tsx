const DELIVERY = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    label: 'België',
    sub: 'Levering aan huis',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    label: 'Nederland',
    sub: 'Levering aan huis',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    label: 'Afhalen',
    sub: 'Mogelijk op afspraak',
  },
]

const PROCESS_STEPS = [
  { step: '1', label: 'Ontwerp maken', desc: 'Gebruik de tool of bespreek je idee' },
  { step: '2', label: 'Offerte aanvragen', desc: 'Download je offerte of stuur een aanvraag' },
  { step: '3', label: 'Bevestigen', desc: 'Akkoord geven en productie starten' },
  { step: '4', label: 'Productie & levering', desc: 'Jouw concept wordt werkelijkheid' },
]

export default function PracticalInfoSection() {
  return (
    <section className="bg-[#F5F0E8] py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

          {/* Levering */}
          <div>
            <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-4">
              Levering
            </p>
            <h3 className="font-serif text-2xl font-semibold text-studio-black mb-6">
              Overal naartoe
            </h3>
            <div className="space-y-3">
              {DELIVERY.map((d) => (
                <div
                  key={d.label}
                  className="flex items-center gap-4 bg-white rounded-xl p-4 border border-[#EDE7D9]"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-[#7A6A52]"
                    style={{ background: '#E8DCBB' }}
                  >
                    {d.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-studio-black">{d.label}</p>
                    <p className="text-xs text-[#B5A48A]">{d.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Proces */}
          <div>
            <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-4">
              Het proces
            </p>
            <h3 className="font-serif text-2xl font-semibold text-studio-black mb-6">
              Zo verloopt het
            </h3>
            <div className="space-y-3">
              {PROCESS_STEPS.map((ps, i) => (
                <div key={ps.step} className="flex gap-4">
                  {/* Step indicator + line */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: '#2C2416', color: '#E7C46A' }}
                    >
                      {ps.step}
                    </div>
                    {i < PROCESS_STEPS.length - 1 && (
                      <div className="w-px flex-1 my-1" style={{ background: '#E0D5C5' }} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-semibold text-studio-black">{ps.label}</p>
                    <p className="text-xs text-[#8A7A6A] mt-0.5">{ps.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
