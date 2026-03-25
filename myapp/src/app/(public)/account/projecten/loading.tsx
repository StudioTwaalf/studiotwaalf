import { SkeletonProjectCard } from '@/components/account/Skeleton'

// Filter pill widths — matches real labels (Alle · Geboorte · Huwelijk · Doopsuiker · Cadeau · Concept)
const FILTER_WIDTHS = [48, 78, 78, 90, 68, 72]

// Stagger delay per card
const CARD_DELAYS = [0, 60, 120, 180, 240, 300]

export default function ProjectenLoading() {
  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <div className="shimmer h-2.5 w-16 rounded mb-2" style={{ animationDelay: '0ms' }} />
        <div className="shimmer h-8 w-32 rounded-lg mb-2" style={{ animationDelay: '40ms' }} />
        <div className="shimmer h-4 w-72 rounded" style={{ animationDelay: '80ms' }} />
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {FILTER_WIDTHS.map((w, i) => (
          <div
            key={i}
            className="shimmer h-8 rounded-full"
            style={{ width: w, animationDelay: `${i * 40}ms` }}
          />
        ))}
        <div
          className="shimmer h-3 w-20 rounded ml-auto hidden sm:block"
          style={{ animationDelay: '240ms' }}
        />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {CARD_DELAYS.map((delay, i) => (
          <SkeletonProjectCard key={i} delay={delay} />
        ))}
      </div>
    </div>
  )
}
