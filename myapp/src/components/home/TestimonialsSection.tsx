import Link from 'next/link'

const TESTIMONIALS = [
  {
    name: 'Leonie & Niels',
    context: 'Geboortekaartje + doopsuiker',
    quote:
      'De samenwerking verliep super vlot. Het kaartje en de doopsuiker waren prachtig uitgewerkt. Elk detail klopte.',
    initial: 'L',
    color: '#FFCED3',
  },
  {
    name: 'Bieke & Olivier',
    context: 'Huwelijksconcept',
    quote:
      'Ons idee werd perfect vertaald naar een volledig concept. Van uitnodiging tot verpakking — alles paste perfect samen.',
    initial: 'B',
    color: '#A8BFA3',
  },
  {
    name: 'Jonith',
    context: 'Geboortekaartje',
    quote:
      'Alles was tot in de details uitgewerkt. Echt een aanrader voor iedereen die iets bijzonders zoekt.',
    initial: 'J',
    color: '#E8DCBB',
  },
]

function StarRating() {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#E7C46A">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

export default function TestimonialsSection() {
  return (
    <section className="bg-studio-beige py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-3">
            Wat klanten zeggen
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-studio-black leading-tight text-balance mb-4">
            Realisaties van Studio Twaalf
          </h2>
          <p className="text-[#7A6A52] text-sm leading-relaxed">
            Al{' '}
            <span className="font-semibold text-studio-black">11 concepten</span>{' '}
            mochten we uitwerken voor gezinnen en koppels in België en Nederland.
          </p>
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl p-7 border border-[#EDE7D9] flex flex-col gap-5"
              style={{ boxShadow: '0 4px 20px rgba(44,36,22,0.05)' }}
            >
              {/* Quote mark */}
              <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
                <path
                  d="M0 20V12.4C0 8.533 1.067 5.4 3.2 3C5.333.6 8.267-.4 12 0v3.6C10.133 3.467 8.6 4.2 7.4 5.8 6.2 7.4 5.6 9.4 5.6 11.8H11.2V20H0zm16.8 0V12.4C16.8 8.533 17.867 5.4 20 3 22.133.6 25.067-.4 28.8 0v3.6c-1.867-.133-3.4.6-4.6 2.2C23 7.4 22.4 9.4 22.4 11.8H28V20H16.8z"
                  fill="#E8DCBB"
                />
              </svg>

              {/* Quote */}
              <p className="text-[#3A2E22] text-sm leading-relaxed flex-1 italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Stars */}
              <StarRating />

              {/* Author */}
              <div className="flex items-center gap-3 pt-1 border-t border-[#F0EBE0]">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-[#2C2416] flex-shrink-0"
                  style={{ background: t.color }}
                >
                  {t.initial}
                </div>
                <div>
                  <p className="text-xs font-semibold text-studio-black">{t.name}</p>
                  <p className="text-[10px] text-[#B5A48A]">{t.context}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 bg-white border border-[#E0D5C5] text-[#2C2416] text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#F5F0E8] transition-colors"
          >
            Bekijk realisaties
          </Link>
        </div>
      </div>
    </section>
  )
}
