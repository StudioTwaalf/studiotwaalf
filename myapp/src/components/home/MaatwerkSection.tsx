import Link from 'next/link'
import Image from 'next/image'

const BENEFITS = [
  {
    title: 'Eén aanspreekpunt',
    description: 'Van eerste gesprek tot levering begeleiden we je persoonlijk. Geen ruis, geen tussenpersonen — gewoon eerlijk contact.',
    image: '/images/home/hanne-vangheluwe.jpeg',
    imageAlt: 'Hanne Vangheluwe – Studio Twaalf',
    imageFocus: '50% 20%',
  },
  {
    title: 'Coherent van kaartje tot cadeau',
    description: 'Geboortekaartje, doopsuiker, verpakking en bijpassende cadeautjes — alles ademt dezelfde sfeer en vertelt hetzelfde verhaal.',
    image: '/images/home/stock-stationery.jpg',
    imageAlt: 'Coherent concept – Studio Twaalf',
    imageFocus: '50% 50%',
  },
  {
    title: 'Jouw stijl, vertaald door ons',
    description: 'Je hoeft niet precies te weten wat je wil. Wij stellen de juiste vragen en vertalen jouw ideeën naar een concept dat voelt als jij.',
    image: '/images/home/stock-design.jpg',
    imageAlt: 'Stijl vertaald – Studio Twaalf',
    imageFocus: '50% 50%',
  },
  {
    title: 'Volledig ontzorgd',
    description: 'Papierkeuze, kleurpalet, afwerking — wij denken over elk detail na zodat jij je nergens zorgen over hoeft te maken.',
    image: '/images/home/stock-ontzorgd.jpg',
    imageAlt: 'Volledig ontzorgd – Studio Twaalf',
    imageFocus: '50% 50%',
  },
]

export default function MaatwerkSection() {
  return (
    <section className="bg-[#F5F0E8] py-20 lg:py-28 relative overflow-hidden">
      {/* Subtle warm accent */}
      <div
        className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full opacity-30 pointer-events-none -translate-y-1/2 translate-x-1/3"
        style={{ background: 'radial-gradient(circle, #FFCED3 0%, transparent 65%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-[360px] h-[360px] rounded-full opacity-20 pointer-events-none translate-y-1/2 -translate-x-1/3"
        style={{ background: 'radial-gradient(circle, #E8DCBB 0%, transparent 65%)' }}
      />

      <div className="relative max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ── Left: copy ─────────────────────────────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-4">
              Persoonlijke begeleiding
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.6rem] font-semibold text-studio-black leading-tight text-balance mb-6">
              Volledig op maat werken?
              <br className="hidden sm:block" />
              Wij denken met je mee.
            </h2>
            <p className="text-[#7A6A52] text-base leading-relaxed mb-5">
              Wil je het liever samen aanpakken? Dat kan! Ikzelf, Hanne, oprichtster van Studio Twaalf help je graag met een persoonlijk totaalconcept uit te werken dat écht bij jou past.
            </p>
            <p className="text-[#7A6A52] text-base leading-relaxed mb-5">
              Van geboortekaartjes en huwelijksdrukwerk tot doopsuiker, verpakking en gepersonaliseerde cadeautjes. Elk detail wordt zorgvuldig op elkaar afgestemd.
            </p>
            <p className="text-[#7A6A52] text-base leading-relaxed mb-10">
              Ik begeleid je stap voor stap, zodat alles niet alleen mooi oogt, maar ook helemaal juist aanvoelt.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:hallo@studiotwaalf.be"
                className="inline-flex items-center gap-2 bg-studio-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#2C2416] transition-colors"
              >
                Vraag vrijblijvend advies
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <Link
                href="/aanpak"
                className="inline-flex items-center gap-2 border border-[#D4C9B4] text-[#7A6A52] text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#EDE7D9] transition-colors"
              >
                Ontdek onze aanpak
              </Link>
            </div>

            {/* Soft reassurance line */}
            <p className="mt-6 text-[0.8125rem] text-[#B5A48A] leading-relaxed flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B5A48A] flex-shrink-0" />
              Altijd vrijblijvend, altijd persoonlijk. Gevestigd in Deerlijk, actief in heel Vlaanderen.
            </p>
          </div>

          {/* ── Right: benefit tiles ───────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="bg-white border border-[#EDE7D9] rounded-2xl overflow-hidden hover:shadow-soft transition-shadow"
              >
                <div className="relative w-full h-36 overflow-hidden">
                  <Image
                    src={b.image}
                    alt={b.imageAlt}
                    fill
                    className="object-cover"
                    style={{ objectPosition: b.imageFocus }}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-sm font-semibold text-studio-black mb-1.5 leading-snug">
                    {b.title}
                  </h3>
                  <p className="text-[0.8rem] text-[#8A7A6A] leading-relaxed">
                    {b.description}
                  </p>
                </div>
              </div>
            ))}

            {/* Bottom quote card */}
            <div className="sm:col-span-2 rounded-2xl p-5 flex items-start gap-4" style={{ background: 'rgba(231,196,106,0.18)' }}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="flex-shrink-0 opacity-50 mt-0.5"
                style={{ color: '#A07C30' }}
              >
                <path
                  d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"
                  fill="currentColor"
                />
                <path
                  d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"
                  fill="currentColor"
                />
              </svg>
              <p className="text-[0.8125rem] text-[#7A6040] italic leading-relaxed">
                &ldquo;Je hoeft het niet alleen te doen. Ik begeleid je met zorg
                en oog voor elk detail — van het eerste gesprek tot de laatste sticker.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
