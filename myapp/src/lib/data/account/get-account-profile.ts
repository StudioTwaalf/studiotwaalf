import type { AccountUser } from '@/types/account'

/**
 * Fetch the authenticated user's profile.
 *
 * TODO — replace mock with:
 *   import { prisma } from '@/lib/prisma'
 *   return prisma.user.findUnique({
 *     where: { id: userId },
 *     select: { id, name, email, phone, company, address, billing, preferences, createdAt },
 *   })
 */
export async function getAccountProfile(userId: string): Promise<AccountUser | null> {
  // Silence unused-param warning until Prisma is wired up
  void userId

  return {
    id:      userId,
    name:    'Nathalie De Smedt',
    email:   'nathalie@example.be',
    phone:   '+32 479 12 34 56',
    company: null,
    address: {
      street:  'Kerkstraat 12',
      city:    'Gent',
      zip:     '9000',
      country: 'België',
    },
    billing: {
      sameAsShipping: true,
      vatNumber:      null,
      companyName:    null,
    },
    preferences: {
      newsletter: true,
      language:   'nl',
    },
    createdAt: '2025-09-14T10:00:00Z',
  }
}
