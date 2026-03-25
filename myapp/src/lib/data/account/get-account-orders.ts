import type { Order } from '@/types/account'

function daysAgo(n: number, base = '2026-03-18T12:00:00Z'): string {
  const d = new Date(base)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

/**
 * Fetch all orders for the authenticated user.
 *
 * TODO — replace mock with:
 *   import { prisma } from '@/lib/prisma'
 *   return prisma.order.findMany({
 *     where:   { userId },
 *     orderBy: { createdAt: 'desc' },
 *     include: { design: { select: { name: true } } },
 *   })
 */
export async function getAccountOrders(userId: string): Promise<Order[]> {
  void userId

  return [
    {
      id:          'order-1',
      reference:   'ST-2026-0041',
      projectId:   'proj-2',
      projectName: 'Huwelijksuitnodiging Sofie & Luca',
      status:      'in_productie',
      createdAt:   daysAgo(7),
      updatedAt:   daysAgo(2),
      totalCents:  28500,
      itemCount:   150,
    },
    {
      id:          'order-2',
      reference:   'ST-2026-0038',
      projectId:   'proj-5',
      projectName: 'Geboortekaartje Floor',
      status:      'geleverd',
      createdAt:   daysAgo(38),
      updatedAt:   daysAgo(22),
      totalCents:  9800,
      itemCount:   75,
    },
    {
      id:          'order-3',
      reference:   'ST-2026-0044',
      projectId:   'proj-1',
      projectName: 'Geboortekaartje Nathalie & Thomas',
      status:      'bevestigd',
      createdAt:   daysAgo(2),
      updatedAt:   daysAgo(1),
      totalCents:  13200,
      itemCount:   100,
    },
    {
      id:          'order-4',
      reference:   'ST-2026-0046',
      projectId:   'proj-3',
      projectName: 'Doopsuiker Emma',
      status:      'offerte',
      createdAt:   daysAgo(4),
      updatedAt:   daysAgo(4),
      totalCents:  null,
      itemCount:   200,
    },
  ]
}
