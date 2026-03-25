import { prisma } from '@/lib/prisma'

/**
 * Generates the next order number in format ST-YYYY-NNNN.
 * Uses MAX query for simplicity; safe under normal (non-concurrent) load.
 */
export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `ST-${year}-`

  const last = await prisma.shopOrder.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: 'desc' },
    select: { orderNumber: true },
  })

  let seq = 1
  if (last) {
    const parts = last.orderNumber.split('-')
    seq = (parseInt(parts[2] ?? '0', 10) || 0) + 1
  }

  return `${prefix}${String(seq).padStart(4, '0')}`
}
