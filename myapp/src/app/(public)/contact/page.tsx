import type { Metadata } from 'next'
import Link from 'next/link'
import ContactForm from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Contact – Studio Twaalf',
  description:
    'Neem contact op met Studio Twaalf voor een geboortekaartje, huwelijksconcept of gepersonaliseerd cadeau. Gevestigd in Deerlijk, levering in België en Nederland.',
}

const INFO_ITEMS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    label: 'Locatie',
    value: 'Deerlijk, Vlaanderen',
    sub: 'Afhalen op afspraak mogelijk',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    label: 'E-mail',
    value: 'hallo@studiotwaalf.be',
    sub: 'We antwoorden binnen 1-2 werkdagen',
    href: 'mailto:hallo@studiotwaalf.be',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    label: 'Instagram',
    value: '@studiotwaalf.be',
    sub: 'Inspiratie en updates',
    href: 'https://www.instagram.com/studiotwaalf.be',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <path d="M16 8l5 3-5 3V8z" />
      </svg>
    ),
    label: 'Levering',
    value: 'België & Nederland',
    sub: 'Afhalen in Deerlijk op afspraak',
  },
]

export default function ContactPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-studio-beige pt-24 pb-12 lg:pt-32 lg:pb-16">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-4">
              Contact
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-studio-black leading-tight text-balance mb-6">
              Laten we kennismaken
            </h1>
            <p className="text-[#8A7A6A] text-lg leading-relaxed max-w-xl">
              Of je nu een vraag hebt over een bestaande template, een maatwerk concept wil bespreken
              of gewoon even wil kennismaken — we helpen je graag verder. Stuur ons een bericht, we
              antwoorden altijd persoonlijk.
            </p>
          </div>
        </div>
      </section>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <section className="bg-studio-beige pb-24 lg:pb-32">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 lg:gap-12 items-start">

            {/* Form */}
            <div className="bg-white border border-[#EDE7D9] rounded-2xl p-8">
              <h2 className="font-serif text-xl font-semibold text-studio-black mb-1">
                Stuur een bericht
              </h2>
              <p className="text-[#8A7A6A] text-sm mb-7">
                Vertel ons over jouw moment en wensen. We nemen snel contact op.
              </p>
              <ContactForm />
            </div>

            {/* Info panel */}
            <div className="space-y-4">
              {/* Contact info card */}
              <div className="bg-white border border-[#EDE7D9] rounded-2xl p-6">
                <h2 className="font-serif text-lg font-semibold text-studio-black mb-5">
                  Contactinformatie
                </h2>
                <div className="space-y-4">
                  {INFO_ITEMS.map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-studio-beige flex items-center justify-center flex-shrink-0 text-[#8A7A6A]">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#C4B8A0] uppercase tracking-widest mb-0.5">
                          {item.label}
                        </p>
                        {item.href ? (
                          <a
                            href={item.href}
                            target={item.href.startsWith('http') ? '_blank' : undefined}
                            rel={item.href.startsWith('http') ? 'noreferrer noopener' : undefined}
                            className="text-sm font-semibold text-studio-black hover:text-[#8A7A6A] transition-colors"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-sm font-semibold text-studio-black">{item.value}</p>
                        )}
                        <p className="text-[0.75rem] text-[#8A7A6A] mt-0.5">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div className="bg-[#2C2416] rounded-2xl p-6 relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-5 pointer-events-none"
                  style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '18px 18px' }}
                />
                <div className="relative">
                  <p className="text-[10px] font-bold text-[#B5A48A] uppercase tracking-widest mb-3">
                    Of start direct
                  </p>
                  <h3 className="font-serif text-base font-semibold text-white mb-4 leading-snug">
                    Liever meteen aan de slag?
                  </h3>
                  <p className="text-[#C4B8A0] text-xs leading-relaxed mb-5">
                    Ontdek onze templates en begin vandaag nog met het samenstellen van jouw concept.
                  </p>
                  <Link
                    href="/templates"
                    className="inline-flex items-center gap-2 bg-studio-yellow text-[#2C2416] text-xs font-semibold px-4 py-2.5 rounded-lg hover:brightness-95 transition-all w-full justify-center"
                  >
                    Bekijk templates
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Practical info */}
              <div className="bg-[#F5F0E8] border border-[#EDE7D9] rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-studio-black mb-4">
                  Praktische info
                </h3>
                <ul className="space-y-2.5">
                  {[
                    'Levering in heel België en Nederland',
                    'Afhalen mogelijk in Deerlijk op afspraak',
                    'Online samenwerken is altijd mogelijk',
                    'Vrijblijvende offerte — geen verplichtingen',
                    'Persoonlijk antwoord, altijd',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[#8A7A6A]">
                      <span className="w-1.5 h-1.5 rounded-full bg-studio-yellow flex-shrink-0 mt-1.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
