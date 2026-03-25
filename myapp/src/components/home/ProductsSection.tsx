const PRODUCTS = [
  {
    title: 'Geboortekaartjes',
    description: 'Unieke aankondigingen met jouw eigen stijl en personalisatie.',
    bg: '#FFCED3',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
  {
    title: 'Huwelijksuitnodigingen',
    description: 'Stijlvolle uitnodigingen voor de mooiste dag van jullie leven.',
    bg: '#E8DCBB',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M12 12v10M8 16l4-4 4 4" />
      </svg>
    ),
  },
  {
    title: 'Doopsuiker',
    description: 'Gepersonaliseerde doopsuiker verpakkingen die passen bij je concept.',
    bg: '#A8BFA3',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: 'Verpakkingen',
    description: 'Dozen, zakjes en wikkels volledig in lijn met je concept.',
    bg: '#E7C46A',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    title: 'Gepersonaliseerde cadeaus',
    description: 'Unieke cadeaus met naam of boodschap, perfect als herinnering.',
    bg: '#F5F0E8',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12" />
        <rect x="2" y="7" width="20" height="5" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
      </svg>
    ),
  },
  {
    title: 'Bedankjes',
    description: 'Stijlvolle dankkaartjes of kleine attenties voor je gasten.',
    bg: '#EDE0D4',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
]

export default function ProductsSection() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-3">
            Wat je kan ontwerpen
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-studio-black leading-tight text-balance mb-4">
            Van kaartje tot volledig concept
          </h2>
          <p className="text-[#7A6A52] text-sm leading-relaxed">
            Studio Twaalf ontwerpt niet alleen kaartjes. Je creëert een volledig afgestemd concept
            dat samenhangt van a tot z.
          </p>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          {PRODUCTS.map((product) => (
            <div
              key={product.title}
              className="group relative rounded-2xl p-6 border border-[#EDE7D9] bg-[#FAFAF7] hover:shadow-soft transition-all hover:-translate-y-0.5"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-[#2C2416]"
                style={{ background: product.bg }}
              >
                {product.icon}
              </div>
              <h3 className="text-sm font-semibold text-studio-black mb-1.5">
                {product.title}
              </h3>
              <p className="text-[0.78rem] text-[#8A7A6A] leading-relaxed">
                {product.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
