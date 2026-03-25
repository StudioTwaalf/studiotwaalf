/**
 * POST /api/shop/abandoned-designs/notify
 *
 * Finds designs that were last updated more than `staleHours` ago (default 48h),
 * have no submitted offer request, and belong to a user with an email address.
 * Sends one abandoned-design reminder per qualifying design, guarded by idempotency.
 *
 * Securing this route:
 *   - Protected by CRON_SECRET env var (pass as ?secret=... query param)
 *   - Can also be called manually by an admin
 *
 * Cron usage (e.g. Vercel cron or external scheduler):
 *   POST https://studiotwaalf.be/api/shop/abandoned-designs/notify?secret=<CRON_SECRET>
 *
 * Manual trigger for a specific design:
 *   POST /api/shop/abandoned-designs/notify?secret=<secret>
 *   Body: { "designId": "cmabc123" }
 *
 * Each week generates a unique referenceId key (`${designId}-W${year}-${week}`) so
 * reminders can repeat weekly without duplicating within the same week.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendAbandonedDesignEmail } from '@/lib/email'

const DEFAULT_STALE_HOURS = 48
const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://studiotwaalf.be'

// ISO week key: "2026-W12"
function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  // ── Auth guard ─────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const provided = req.nextUrl.searchParams.get('secret')
    if (provided !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const body = await req.json().catch(() => ({}))
  const specificDesignId: string | undefined = body?.designId

  const staleHours: number = body?.staleHours ?? DEFAULT_STALE_HOURS
  const staleBefore = new Date(Date.now() - staleHours * 60 * 60 * 1000)
  const weekKey = isoWeekKey(new Date())

  // ── Find qualifying designs ─────────────────────────────────────────────────
  // email is required (non-nullable) in the User model — no null filter needed
  const rawDesigns = await prisma.design.findMany({
    where: {
      ...(specificDesignId ? { id: specificDesignId } : {}),
      updatedAt: { lt: staleBefore },
      // Only designs that have no offer request submitted
      offerRequests: { none: {} },
    },
    select: {
      id:        true,
      updatedAt: true,
      userId:    true,
    },
    take: 50, // process max 50 at a time to stay within function timeout
  })

  if (rawDesigns.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, message: 'No qualifying designs found.' })
  }

  // Fetch user data for each design owner
  const userIds = Array.from(new Set(rawDesigns.map((d) => d.userId)))
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, firstName: true, name: true },
  })
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))
  const designs = rawDesigns.map((d) => ({ ...d, user: userMap[d.userId] ?? null }))

  const results = await Promise.allSettled(
    designs.map(async (design) => {
      const user = design.user
      if (!user?.email) return { skipped: true, reason: 'no email' }

      const voornaam = user.firstName ?? user.name?.split(' ')[0] ?? 'daar'
      const designUrl = `${BASE_URL}/diy?designId=${design.id}`

      // Weekly idempotency key — one reminder per design per ISO week
      const referenceId = `${design.id}-${weekKey}`

      const result = await sendAbandonedDesignEmail({
        designId:    design.id,
        referenceId,
        to:          user.email,
        voornaam,
        designUrl,
      })

      return { designId: design.id, ...result }
    })
  )

  const sent    = results.filter((r) => r.status === 'fulfilled' && (r.value as { sent?: boolean }).sent).length
  const skipped = results.filter((r) => r.status === 'fulfilled' && (r.value as { skipped?: boolean }).skipped).length
  const failed  = results.filter((r) => r.status === 'rejected').length

  console.log(`[abandoned-designs] processed=${designs.length} sent=${sent} skipped=${skipped} failed=${failed}`)

  return NextResponse.json({
    ok:        true,
    processed: designs.length,
    sent,
    skipped,
    failed,
    week:      weekKey,
  })
}
