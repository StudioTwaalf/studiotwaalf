'use client'

/**
 * RouteChangeTracker
 *
 * Fires a typed `page_view` GTM event on every client-side route change.
 * Renders nothing — mount once in the root layout inside <body>.
 *
 * Works with Next.js App Router: usePathname() updates on every navigation.
 * Admin routes (/admin/*) are excluded so internal usage doesn't pollute
 * webshop / DIY conversion reporting in GA4.
 */

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackEvent, derivePageType } from '@/lib/analytics'

export default function RouteChangeTracker() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const page_type = derivePageType(pathname)

    // Exclude admin routes — don't distort public analytics
    if (page_type === null) return

    const url = searchParams.size > 0
      ? `${pathname}?${searchParams.toString()}`
      : pathname

    trackEvent({ event: 'page_view', page_path: url, page_type })
  }, [pathname, searchParams])

  return null
}
