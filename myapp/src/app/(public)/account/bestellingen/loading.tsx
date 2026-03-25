import { SkeletonOrderCard } from '@/components/account/Skeleton'

export default function BestellingenLoading() {
  return (
    <div className="space-y-8">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="shimmer h-2.5 w-16 rounded" style={{ animationDelay: '0ms' }} />
        <div className="shimmer h-7 w-36 rounded-lg" style={{ animationDelay: '40ms' }} />
        <div className="shimmer h-4 w-80 rounded" style={{ animationDelay: '80ms' }} />
      </div>

      {/* Section */}
      <div>
        <div className="shimmer h-3 w-16 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <SkeletonOrderCard key={i} delay={i * 60} />
          ))}
        </div>
      </div>
    </div>
  )
}
