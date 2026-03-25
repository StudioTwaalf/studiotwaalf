import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Realisaties – Studio Twaalf',
  description:
    'Bekijk gerealiseerde concepten van Studio Twaalf: geboortekaartjes, huwelijksdrukwerk, doopsuiker en meer. Laat je inspireren door onze projecten.',
}

const PROJECTS = [
  {
    id: '01',
    title: 'Geboorte Ella',
    category: 'Geboorte',
    description:
      'Een zacht en warm totaalconcept voor de komst van Ella. Geboortekaartje, doopsuiker met bijpassende labels en een stijlvolle presentatiedoos.',
    tags: ['Geboortekaartje', 'Doopsuiker', 'Labels'],
    color: '#FFCED3',
    image: '/images/realisaties/01.svg',
  },
  {
    id: '02',
    title: 'Huwelijk Bieke & Olivier',
    category: 'Huwelijk',
    description:
      'Een coherent huwelijksconcept in zachte aardtinten. Van uitnodiging tot menukaart, bedankkaartje en gepersonaliseerde cadeautjes voor de gasten.',
    tags: ['Uitnodiging', 'Menukaart', 'Bedankje'],
    color: '#E8DCBB',
    image: '/images/realisaties/02.svg',
  },
  {
    id: '03',
    title: 'Geboorte Lena',
    category: 'Geboorte',
    description:
      'Speels maar verfijnd: een geboorteconcept met sage en roze accenten. Het kaartje, de doopsuiker en de verpakking vormen één samenhangend geheel.',
    tags: ['Geboortekaartje', 'Verpakking', 'Concept'],
    color: '#A8BFA3',
    image: '/images/realisaties/03.svg',
  },
  {
    id: '04',
    title: 'Geboorte Noor',
    category: 'Geboorte',
    description:
      'Minimalistisch en tijdloos — een concept in off-white en zand voor de geboorte van Noor, compleet met zorgvuldig ontworpen bedankdoosjes.',
    tags: ['Geboortekaartje', 'Doopsuiker', 'Doosjes'],
    color: '#E7C46A',
    image: '/images/realisaties/04.svg',
  },
  {
    id: '05',
    title: 'Huwelijk Leonie & Niels',
    category: 'Huwelijk',
    description:
      'Een romantisch en persoonlijk huwelijksconcept met bloemillustraties en een warme kleurpalet. Van save-the-date tot trouwdag-programma.',
    tags: ['Uitnodiging', 'Save the date', 'Programma'],
    color: '#F5F0E8',
    image: '/images/realisaties/05.svg',
  },
  {
    id: '06',
    title: 'Geboorte Tom & Julie',
    category: 'Geboorte',
    description:
      'Een frisse en moderne aanpak voor een geboorteconcept. Strakke lijnen, persoonlijke illustratie en een doopsuiker die gasten bijblijft.',
    tags: ['Geboortekaartje', 'Doopsuiker', 'Illustratie'],
    color: '#EDE0D4',
    image: '/images/realisaties/06.svg',
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  Geboorte: '#FFCED3',
  Huwelijk: '#E8DCBB',
}

export default function RealisatiesPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-studio-beige pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-4">
              Realisaties
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-studio-black leading-tight text-balance mb-6">
              Projecten waar we trots op zijn
            </h1>
            <p className="text-[#8A7A6A] text-lg leading-relaxed mb-8 max-w-xl">
              Elk concept begint bij een verhaal. Hieronder vind je een selectie van gerealiseerde
              projecten — geboortekaartjes, huwelijksconcpeten en totaalconcepten die we met zorg en
              passie hebben samengesteld voor onze klanten.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 bg-studio-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#2C2416] transition-colors"
              >
                Start jouw eigen ontwerp
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

      {/* ── Projects grid ─────────────────────────────────────────────────── */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROJECTS.map((project) => (
              <article key={project.id} className="group bg-[#FAFAF7] border border-[#EDE7D9] rounded-2xl overflow-hidden hover:shadow-soft transition-all duration-300">
                {/* Image / visual */}
                <div
                  className="aspect-[4/3] relative flex items-center justify-center overflow-hidden"
                  style={{ background: project.color + '40' }}
                >
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Category badge */}
                  <div className="absolute top-4 left-4">
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
                      style={{
                        background: CATEGORY_COLORS[project.category] ?? '#E8DCBB',
                        color: '#2C2416',
                      }}
                    >
                      {project.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h2 className="font-serif text-lg font-semibold text-studio-black mb-2">
                    {project.title}
                  </h2>
                  <p className="text-[0.8125rem] text-[#8A7A6A] leading-relaxed mb-4">
                    {project.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#F0EBE0] text-[#7A6A52]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial strip ─────────────────────────────────────────────── */}
      <section className="bg-[#F5F0E8] py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                quote: 'Onze gasten waren onder de indruk van het totaalconcept. Elk detail klopte.',
                name: 'Leonie & Niels',
                context: 'Geboortekaartje + doopsuiker',
                initials: 'LN',
                color: '#FFCED3',
              },
              {
                quote: 'Prachtig werk. De uitnodiging en het menukaartje pasten perfect bij elkaar.',
                name: 'Bieke & Olivier',
                context: 'Huwelijksconcept',
                initials: 'BO',
                color: '#A8BFA3',
              },
              {
                quote: 'Snel, vriendelijk en het resultaat overtrof onze verwachtingen.',
                name: 'Jonith',
                context: 'Geboortekaartje',
                initials: 'JH',
                color: '#E8DCBB',
              },
            ].map((t) => (
              <div key={t.name} className="bg-white border border-[#EDE7D9] rounded-2xl p-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mb-4 opacity-40" style={{ color: '#B5A48A' }}>
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" fill="currentColor" />
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" fill="currentColor" />
                </svg>
                <p className="text-sm text-[#5A4A3A] italic leading-relaxed mb-5">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-[#2C2416]"
                    style={{ background: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-studio-black">{t.name}</p>
                    <p className="text-xs text-[#8A7A6A]">{t.context}</p>
                  </div>
                </div>
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
          className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #FFCED3 0%, transparent 60%)' }}
        />
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative max-w-3xl mx-auto px-6 sm:px-8 text-center">
          <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-4">
            Jouw beurt
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-white leading-tight text-balance mb-6">
            Start jouw eigen ontwerp
          </h2>
          <p className="text-[#C4B8A0] text-base leading-relaxed mb-10 max-w-xl mx-auto">
            Laat je inspireren door onze realisaties en begin vandaag met het samenstellen van jouw
            uniek geboorte- of huwelijksconcept.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 bg-studio-yellow text-[#2C2416] text-sm font-semibold px-7 py-3.5 rounded-xl hover:brightness-95 transition-all"
            >
              Bekijk templates
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
