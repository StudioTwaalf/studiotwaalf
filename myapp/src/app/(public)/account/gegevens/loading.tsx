import { SkeletonSectionCard } from '@/components/account/Skeleton'

export default function GegevensLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="mb-8 space-y-2">
        <div className="shimmer h-2.5 w-16 rounded" style={{ animationDelay: '0ms' }} />
        <div className="shimmer h-7 w-32 rounded-lg" style={{ animationDelay: '40ms' }} />
        <div className="shimmer h-4 w-72 rounded" style={{ animationDelay: '80ms' }} />
      </div>

      <SkeletonSectionCard rows={5} />
      <SkeletonSectionCard rows={3} delay={60} />
      <SkeletonSectionCard rows={2} delay={120} />
    </div>
  )
}
