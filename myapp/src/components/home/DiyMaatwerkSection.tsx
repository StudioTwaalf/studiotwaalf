import Link from 'next/link'

export default function DiyMaatwerkSection() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-12">
          <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-3">
            Jouw keuze
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-studio-black leading-tight text-balance mb-4">
            Zelf ontwerpen of samen creëren
          </h2>
          <p className="text-[#7A6A52] text-sm leading-relaxed">
            Bij Studio Twaalf kies je wat het best bij je past.
            Of je nu graag zelf aan de slag gaat of liever alles uitbesteedt — beide zijn mogelijk.
          </p>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* DIY */}
          <div
            className="rounded-2xl p-8 border border-[#EDE7D9]"
            style={{ background: '#FAFAF7' }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
              style={{ background: '#E8DCBB' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2C2416" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <p className="text-xs font-bold text-[#B5A48A] uppercase tracking-widest mb-2">DIY</p>
            <h3 className="font-serif text-xl font-semibold text-studio-black mb-3">
              Gebruik de design tool
            </h3>
            <p className="text-sm text-[#7A6A52] leading-relaxed mb-6">
              Kies een template, pas aan naar jouw smaak en stel zelf je concept samen.
              Volledig in jouw tempo, met onmiddellijke preview.
            </p>
            <ul className="space-y-2 mb-8">
              {[
                'Directe start, geen wachttijd',
                'Volledig aanpasbaar',
                'Realtime preview',
                'Offerte in een klik',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-[0.8125rem] text-[#5A4A3A]">
                  <span className="w-1.5 h-1.5 rounded-full bg-studio-yellow flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 bg-studio-black text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#2C2416] transition-colors"
            >
              Start met ontwerpen
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Maatwerk */}
          <div
            className="rounded-2xl p-8 border border-[#EDE7D9] relative overflow-hidden"
            style={{ background: '#2C2416' }}
          >
            {/* Subtle texture */}
            <div
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
            <div className="relative">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                style={{ background: 'rgba(231,196,106,0.2)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E7C46A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <p className="text-xs font-bold text-[#B5A48A] uppercase tracking-widest mb-2">Maatwerk</p>
              <h3 className="font-serif text-xl font-semibold text-white mb-3">
                Samen creëren
              </h3>
              <p className="text-sm text-[#C4B8A0] leading-relaxed mb-6">
                Samen werken we een volledig uniek ontwerp uit, afgestemd op jouw wensen
                en stijl. Persoonlijk contact, van begin tot einde.
              </p>
              <ul className="space-y-2 mb-8">
                {[
                  'Volledig uniek ontwerp',
                  'Persoonlijk advies en begeleiding',
                  'Coherent concept van a tot z',
                  'Flexibel en op maat',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[0.8125rem] text-[#C4B8A0]">
                    <span className="w-1.5 h-1.5 rounded-full bg-studio-yellow flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:hallo@studiotwaalf.be"
                className="inline-flex items-center gap-2 bg-studio-yellow text-[#2C2416] text-sm font-semibold px-5 py-2.5 rounded-xl hover:brightness-95 transition-all"
              >
                Neem contact op
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
