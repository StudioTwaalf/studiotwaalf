'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// ─── Slides ───────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    src: '/images/hero/hero1.jpg',
    alt: 'Studio Twaalf – geboortekaartje en doopsuiker concept',
  },
  {
    src: '/images/hero/hero2.jpg',
    alt: 'Studio Twaalf – huwelijksuitnodiging concept',
  },
  {
    src: '/images/hero/hero3.jpg',
    alt: 'Studio Twaalf – gepersonaliseerde verpakkingen',
  },
]

const INTERVAL_MS = 4000

// ─── ArrowRight icon ──────────────────────────────────────────────────────────
function ArrowRight() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function HeroSlideshow() {
  const [current, setCurrent] = useState(0)

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length)
    }, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative h-[80vh] min-h-[560px] overflow-hidden">

      {/* ── Slides ─────────────────────────────────────────────────────────── */}
      {SLIDES.map((slide, i) => {
        const isActive = i === current
        return (
          <div
            key={i}
            aria-hidden={!isActive}
            className={[
              'absolute inset-0',
              'transition-opacity duration-1000 ease-in-out',
              isActive ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
          >
            {/* Ken Burns zoom: scale slowly while active */}
            <div
              className={[
                'absolute inset-0',
                'transition-transform duration-[6000ms] ease-out',
                isActive ? 'scale-110' : 'scale-100',
              ].join(' ')}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="100vw"
                className="object-cover"
                priority={i === 0}
              />
            </div>
          </div>
        )
      })}

      {/* ── Dark overlay ───────────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-black/20 z-10" />

      {/* ── Hero content ───────────────────────────────────────────────────── */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">

          {/* Category pill */}
          <p className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-5 py-2 text-sm text-white/90 mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-studio-yellow flex-shrink-0" />
            Geboortekaartjes · Doopsuiker · Huwelijksdrukwerk
          </p>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-[1.06] tracking-tight mb-7">
            Jouw mooiste moment, volledig op maat
          </h1>

          <p className="text-lg sm:text-xl text-white/80 font-sans max-w-xl mx-auto mb-12 leading-[1.8]">
            Stel je eigen geboorte- of huwelijksconcept samen — van kaartje
            tot doopsuiker — met onze intuïtieve design tool.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/templates"
              className="inline-flex items-center justify-center gap-2 bg-white text-studio-black px-7 py-3.5 rounded-xl font-semibold hover:bg-neutral-100 transition duration-200"
            >
              Start met ontwerpen
              <ArrowRight />
            </Link>
            <a
              href="#realisaties"
              className="inline-flex items-center justify-center bg-white/15 backdrop-blur-sm text-white px-7 py-3.5 rounded-xl font-semibold border border-white/30 hover:bg-white/25 transition duration-200"
            >
              Bekijk realisaties
            </a>
          </div>
        </div>
      </div>

      {/* ── Slide indicators ───────────────────────────────────────────────── */}
      <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Ga naar slide ${i + 1}`}
            className={[
              'h-1 rounded-full transition-all duration-500',
              i === current
                ? 'w-8 bg-white'
                : 'w-2 bg-white/40 hover:bg-white/60',
            ].join(' ')}
          />
        ))}
      </div>
    </section>
  )
}
