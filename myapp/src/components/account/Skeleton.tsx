// ─── Primitive ────────────────────────────────────────────────────────────────
// Uses the `.shimmer` CSS class (defined in globals.css) for a warm sweep
// instead of the default neutral-100 pulse.

interface BarProps {
  className?: string
  delay?:     number   // animation-delay in ms for staggered entrances
}

function Bar({ className = '', delay = 0 }: BarProps) {
  return (
    <div
      className={`shimmer rounded-lg ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
      aria-hidden
    />
  )
}

// ─── Text skeletons ───────────────────────────────────────────────────────────

export function SkeletonText({
  className = 'h-4 w-48',
  delay = 0,
}: {
  className?: string
  delay?: number
}) {
  return <Bar className={className} delay={delay} />
}

export function SkeletonParagraph({ lines = 3, startDelay = 0 }: { lines?: number; startDelay?: number }) {
  const widths = ['w-full', 'w-4/5', 'w-3/5']
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }, (_, i) => (
        <Bar key={i} className={`h-3.5 ${widths[i % widths.length]}`} delay={startDelay + i * 60} />
      ))}
    </div>
  )
}

// ─── Project card skeleton ────────────────────────────────────────────────────
// Matches the exact layout of ProjectCard:
//   • 2px status accent strip
//   • aspect-[4/3] thumbnail
//   • px-5 pt-4 pb-5 body
//   • name, status+date row, divider, CTA

export function SkeletonProjectCard({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="flex flex-col bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden"
      aria-hidden
    >
      {/* Status accent strip */}
      <div className="h-0.5 shimmer w-full flex-shrink-0" style={{ animationDelay: `${delay}ms` }} />

      {/* Thumbnail */}
      <div
        className="aspect-[4/3] shimmer"
        style={{ animationDelay: `${delay}ms` }}
      />

      {/* Body */}
      <div className="px-5 pt-4 pb-5 flex flex-col gap-0">
        {/* Name */}
        <Bar className="h-[14px] w-3/4 mb-2.5" delay={delay + 40} />
        <Bar className="h-[14px] w-2/5 mb-3.5" delay={delay + 60} />

        {/* Status + date */}
        <div className="flex items-center gap-2.5">
          <Bar className="h-5 w-24 rounded-full" delay={delay + 80} />
          <Bar className="h-3 w-1 rounded-full" delay={delay + 80} />
          <Bar className="h-3 w-20" delay={delay + 100} />
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-neutral-100" />

        {/* CTA row */}
        <div className="flex items-center gap-3">
          <Bar className="h-[13px] w-32" delay={delay + 120} />
          <Bar className="ml-auto h-7 w-7 rounded-full flex-shrink-0" delay={delay + 140} />
        </div>
      </div>
    </div>
  )
}

// ─── Order card skeleton ──────────────────────────────────────────────────────

export function SkeletonOrderCard({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="bg-white rounded-2xl border border-neutral-200 px-5 py-4 shadow-sm"
      aria-hidden
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2.5">
            <Bar className="h-4 w-24" delay={delay} />
            <Bar className="h-5 w-20 rounded-full" delay={delay + 40} />
          </div>
          <Bar className="h-[14px] w-48" delay={delay + 60} />
          <div className="flex items-center gap-4 pt-0.5">
            <Bar className="h-3 w-24" delay={delay + 80} />
            <Bar className="h-3 w-12" delay={delay + 90} />
            <Bar className="h-3 w-16" delay={delay + 100} />
          </div>
        </div>
        <Bar className="h-8 w-20 rounded-xl flex-shrink-0" delay={delay + 60} />
      </div>
    </div>
  )
}

// ─── Section card skeleton ────────────────────────────────────────────────────

export function SkeletonSectionCard({ rows = 4, delay = 0 }: { rows?: number; delay?: number }) {
  return (
    <div
      className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden"
      aria-hidden
    >
      <div className="px-6 py-5 border-b border-neutral-100">
        <Bar className="h-[14px] w-36" delay={delay} />
      </div>
      <div className="px-6 py-5 space-y-5">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Bar className="h-3 w-24 flex-shrink-0" delay={delay + i * 50} />
            <Bar className="h-3 flex-1" delay={delay + i * 50 + 30} />
          </div>
        ))}
      </div>
    </div>
  )
}
