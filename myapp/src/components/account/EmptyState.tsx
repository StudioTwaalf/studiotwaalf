import Link from 'next/link'

interface Props {
  /**
   * true  → filter is active but returned zero results.
   *         Handled inline by ProjectsGrid (with a reset button).
   *         This component only handles the true zero-data state.
   * false → user has no projects at all (default).
   */
  filtered?: boolean
}

/**
 * Premium editorial empty state — only shown when the user has zero projects.
 * The filtered-zero case is handled inline in ProjectsGrid.
 */
export default function EmptyState({ filtered = false }: Props) {
  // Filter-empty is owned by ProjectsGrid — return nothing here
  if (filtered) return null

  return (
    <div className="col-span-full">
      <div className="relative overflow-hidden rounded-3xl bg-white border border-neutral-200 py-24 px-8 text-center">

        {/* ── Background — large decorative glyph ──────────────────────── */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
          aria-hidden
        >
          <span className="font-serif text-[22rem] leading-none text-neutral-50 translate-y-16">
            ✦
          </span>
        </div>

        {/* Subtle warm radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 65% 55% at 50% 65%, rgba(231,196,106,0.06) 0%, transparent 70%)',
          }}
          aria-hidden
        />

        {/* ── Foreground content ─────────────────────────────────────── */}
        <div className="relative z-10 flex flex-col items-center">

          {/* Eyebrow label */}
          <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#C4B8A0] mb-8">
            Studio Twaalf
          </p>

          {/* Serif headline */}
          <h2 className="font-serif text-[2rem] sm:text-[2.4rem] leading-[1.12] text-[#2C2416] mb-5 tracking-tight">
            Begin met je<br />eerste ontwerp
          </h2>

          {/* Body copy */}
          <p className="text-sm text-[#9C8F7A] max-w-[30ch] mx-auto leading-relaxed mb-10">
            Kies een template, personaliseer het volledig en sla je ontwerp op —
            dan verschijnt het hier.
          </p>

          {/* Text-link CTA with animated gold circle-arrow */}
          <Link
            href="/templates"
            className="group inline-flex items-center gap-3 text-[13px] font-semibold text-[#2C2416]"
          >
            Bekijk alle templates

            <span
              className="w-9 h-9 rounded-full bg-[#E7C46A] flex items-center justify-center
                         group-hover:bg-[#D4B055] group-hover:scale-110
                         transition-all duration-200 ease-out"
            >
              <svg
                width="13" height="13" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                className="group-hover:translate-x-0.5 transition-transform duration-200"
                aria-hidden
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </Link>

          {/* Micro-caption */}
          <p className="mt-7 text-[11px] text-[#D4C9B8]">
            Je ontwerpen worden automatisch opgeslagen
          </p>
        </div>
      </div>
    </div>
  )
}
