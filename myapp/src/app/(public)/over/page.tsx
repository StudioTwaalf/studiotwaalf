import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Over Studio Twaalf – Deerlijk, Vlaanderen',
  description:
    'Leer Studio Twaalf kennen: een premium ontwerpstudio voor geboortekaartjes, huwelijksdrukwerk en gepersonaliseerde concepten, gevestigd in Deerlijk.',
}

const VALUES = [
  {
    title: 'Zacht en premium',
    description:
      'Elk ontwerp ademt rust en verfijning. We kiezen bewust voor zachte kleuren, elegante typografie en een stijl die de tijd doorstaat.',
    color: '#FFCED3',
  },
  {
    title: 'Persoonlijk',
    description:
      'Geen twee concepten zijn hetzelfde. We luisteren naar jouw verhaal en vertalen dat in een ontwerp dat écht van jou is.',
    color: '#E8DCBB',
  },
  {
    title: 'Oog voor detail',
    description:
      'Van de keuze van het papier tot de plaatsing van een komma — elk detail telt. Want het zijn net die kleine dingen die het grote verschil maken.',
    color: '#A8BFA3',
  },
  {
    title: 'Coherent',
    description:
      'We denken verder dan het kaartje. Doopsuiker, verpakking, labels — alles ademt dezelfde sfeer en vormt één samenhangend geheel.',
    color: '#E7C46A',
  },
]

const REASONS = [
  'Persoonlijke begeleiding van begin tot levering',
  'Ontwerp tool én maatwerk — jij kiest',
  'Samenhangend totaalconcept met bijpassende producten',
  'Premium materialen en zorgvuldige afwerking',
  'Levering in België en Nederland, afhalen in Deerlijk',
  'Meer dan 11 gerealiseerde concepten voor tevreden klanten',
]

export default function OverPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-studio-beige pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-4">
              Over ons
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-studio-black leading-tight text-balance mb-6">
              Over Studio Twaalf
            </h1>
            <p className="text-[#8A7A6A] text-lg leading-relaxed max-w-xl">
              Elk kaartje vertelt een verhaal. Studio Twaalf werd opgericht vanuit een oprechte
              passie voor mooi drukwerk, persoonlijke beleving en de kleine details die een groot
              verschil maken.
            </p>
          </div>
        </div>
      </section>

      {/* ── Story ─────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Visual */}
            <div className="order-2 lg:order-1">
              <div className="relative">
                <div className="bg-studio-beige rounded-3xl aspect-square flex items-center justify-center overflow-hidden">
                  {/* Decorative composition */}
                  <div className="relative w-full h-full p-10 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                      {[
                        { bg: '#FFCED3', text: 'Geboorte', size: 'text-xs' },
                        { bg: '#E8DCBB', text: 'Huwelijk', size: 'text-xs' },
                        { bg: '#A8BFA3', text: 'Doopsuiker', size: 'text-xs' },
                        { bg: '#E7C46A', text: 'Cadeaus', size: 'text-xs' },
                      ].map((item) => (
                        <div
                          key={item.text}
                          className="rounded-2xl aspect-square flex items-end p-3"
                          style={{ background: item.bg }}
                        >
                          <span className="text-[#2C2416] font-semibold text-xs">{item.text}</span>
                        </div>
                      ))}
                    </div>
                    {/* Studio Twaalf label */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                      <div className="bg-[#2C2416] text-white text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap">
                        Studio Twaalf · Deerlijk
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating detail */}
                <div className="absolute -bottom-4 -right-4 bg-white border border-[#EDE7D9] rounded-2xl px-4 py-3 shadow-soft">
                  <p className="text-[10px] font-bold text-[#C4B8A0] uppercase tracking-widest mb-1">Actief in</p>
                  <p className="text-sm font-semibold text-studio-black">Heel Vlaanderen</p>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="order-1 lg:order-2">
              <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-3">
                Ons verhaal
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-studio-black leading-tight text-balance mb-6">
                Passie voor detail, liefde voor het ambacht
              </h2>
              <div className="space-y-4 text-[#8A7A6A] text-base leading-relaxed">
                <p>
                  Studio Twaalf is ontstaan vanuit een diepe fascinatie voor mooie dingen. De overtuiging
                  dat een kaartje meer is dan papier — dat het een gevoel oproept, een herinnering inleidt
                  en een boodschap draagt die woorden soms niet kunnen.
                </p>
                <p>
                  Vanuit Deerlijk, in het hart van Vlaanderen, ontwerpen we concepten voor mensen die
                  willen dat elk detail klopt. Nieuwe ouders die een geboortekaartje op maat willen dat
                  past bij hun stijl. Koppels die op hun huwelijksdag alles tot in de puntjes verzorgd
                  willen hebben. Mensen die een origineel, persoonlijk cadeau zoeken.
                </p>
                <p>
                  We geloven in rust, kwaliteit en samenhang. In een stijl die zacht aanvoelt maar sterk
                  is in boodschap. In concepten die lang bijblijven, lang na het moment zelf.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────────────────────── */}
      <section className="bg-studio-beige py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-3">
              Waar we in geloven
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-studio-black leading-tight text-balance">
              Onze waarden
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white border border-[#EDE7D9] rounded-2xl p-6 hover:shadow-soft transition-shadow">
                <div
                  className="w-10 h-10 rounded-xl mb-5"
                  style={{ background: v.color }}
                />
                <h3 className="text-sm font-semibold text-studio-black mb-2">{v.title}</h3>
                <p className="text-[0.8125rem] text-[#8A7A6A] leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why us ────────────────────────────────────────────────────────── */}
      <section className="bg-[#F5F0E8] py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-3">
                Waarom Studio Twaalf
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-studio-black leading-tight text-balance mb-6">
                Wat klanten bij ons vinden
              </h2>
              <p className="text-[#8A7A6A] text-base leading-relaxed mb-8">
                Mensen kiezen voor Studio Twaalf omdat ze iets zoeken dat verder gaat dan een standaard
                kaartje. Ze zoeken een concept dat past bij wie ze zijn — en dat rust en zekerheid geeft
                doorheen het hele proces.
              </p>
              <Link
                href="/realisaties"
                className="inline-flex items-center gap-2 bg-studio-yellow text-[#2C2416] text-sm font-semibold px-6 py-3 rounded-xl hover:brightness-95 transition-all"
              >
                Bekijk realisaties
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="space-y-3">
              {REASONS.map((r) => (
                <div key={r} className="flex items-start gap-3 bg-white border border-[#EDE7D9] rounded-xl px-5 py-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-studio-yellow flex-shrink-0 mt-1.5" />
                  <p className="text-sm text-[#5A4A3A] font-medium">{r}</p>
                </div>
              ))}
            </div>
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
            Laten we kennismaken
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-white leading-tight text-balance mb-6">
            Nieuwsgierig naar wat we voor jou kunnen doen?
          </h2>
          <p className="text-[#C4B8A0] text-base leading-relaxed mb-10 max-w-xl mx-auto">
            We horen graag over jouw moment, jouw wensen en jouw stijl. Neem gerust contact op —
            geheel vrijblijvend, altijd warm.
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
              Start met ontwerpen
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
