'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const IMAGES = [
  '/images/hero/hero1.jpg',
  '/images/hero/hero2.jpg',
  '/images/hero/hero3.jpg',
  '/images/hero/hero4.jpg',
]

const TRUST = [
  'Levering in België & Nederland',
  'DIY of maatwerk mogelijk',
]

export default function HeroSection() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % IMAGES.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative h-[80vh] min-h-[520px] overflow-hidden">
      {/* Slideshow images */}
      {IMAGES.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={src}
            alt=""
            fill
            priority={i === 0}
            className="object-cover"
            style={
              i === current
                ? { animation: 'kenburns 4s ease-out forwards' }
                : { transform: 'scale(1)' }
            }
          />
        </div>
      ))}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center px-6 text-center">
        <p className="text-xs font-semibold text-white/70 uppercase tracking-[0.2em] mb-5">
          Studio Twaalf
        </p>

        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.1] tracking-tight text-balance max-w-3xl mb-6">
          Ontwerp jouw unieke geboorte- of huwelijksconcept
        </h1>

        <p className="font-sans text-white/80 text-base sm:text-lg leading-relaxed max-w-xl mb-10 text-balance">
          Van kaartje tot doopsuiker en verpakking. Met onze design tool stel je eenvoudig
          een volledig gepersonaliseerd concept samen.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 bg-white text-studio-black text-sm font-semibold px-6 py-3 rounded-xl hover:bg-neutral-200 transition-colors"
          >
            Start met ontwerpen
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/realisaties"
            className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-white/25 transition-colors backdrop-blur-sm"
          >
            Bekijk inspiratie
          </Link>
          <a
            href="mailto:hallo@studiotwaalf.be"
            className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-white/25 transition-colors backdrop-blur-sm"
          >
            Vraag maatwerk aan
          </a>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-3">
          {TRUST.map((label) => (
            <span
              key={label}
              className="text-xs text-white/75 font-medium bg-black/20 border border-white/15 backdrop-blur-sm rounded-full px-4 py-1.5"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
        {IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
