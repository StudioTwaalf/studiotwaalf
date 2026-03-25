import Link from 'next/link'

export default function FinalCTA() {
  return (
    <section className="bg-[#2C2416] py-20 lg:py-28 relative overflow-hidden">
      {/* Background accents */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #E7C46A 0%, transparent 60%)' }}
      />
      <div
        className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #FFCED3 0%, transparent 60%)' }}
      />
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative max-w-3xl mx-auto px-6 sm:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-studio-yellow flex-shrink-0" />
          <span className="text-xs font-semibold text-[#C4B8A0] tracking-wide uppercase">
            Klaar om te starten?
          </span>
        </div>

        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-tight text-balance mb-6">
          Klaar om jouw concept te ontwerpen?
        </h2>

        <p className="text-[#C4B8A0] text-base leading-relaxed mb-10 max-w-xl mx-auto">
          Begin vandaag met het samenstellen van jouw geboorte- of huwelijksconcept.
          Kies een template en start in minder dan een minuut.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 bg-studio-yellow text-[#2C2416] text-sm font-semibold px-7 py-3.5 rounded-xl hover:brightness-95 transition-all"
          >
            Start jouw ontwerp
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <a
            href="mailto:hallo@studiotwaalf.be"
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm font-semibold px-7 py-3.5 rounded-xl hover:bg-white/15 transition-colors"
          >
            Vraag maatwerk aan
          </a>
        </div>

        {/* Trust row */}
        <div className="flex flex-wrap justify-center gap-6 mt-12 pt-10 border-t border-white/10">
          {[
            '✦  11+ gerealiseerde concepten',
            '🚚  België & Nederland',
            '✏️  DIY of maatwerk',
          ].map((item) => (
            <span key={item} className="text-xs text-[#8A7A6A] font-medium">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
