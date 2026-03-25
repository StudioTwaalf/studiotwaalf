'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { OfferRequestStatus } from '@prisma/client'

/**
 * Update the status of an offer request.
 * Called from OfferStatusSelector (client component).
 */
export async function updateOfferStatusAction(
  id:     string,
  status: OfferRequestStatus,
): Promise<void> {
  await prisma.offerRequest.update({
    where: { id },
    data:  { status },
  })
  revalidatePath('/admin/offertes')
  revalidatePath(`/admin/offertes/${id}`)
}

/**
 * Save internal admin notes for an offer request.
 */
export async function updateOfferNotesAction(
  id:       string,
  formData: FormData,
): Promise<void> {
  const notes = (formData.get('internalNotes') as string | null)?.trim() ?? null

  await prisma.offerRequest.update({
    where: { id },
    data:  { internalNotes: notes || null },
  })
  revalidatePath(`/admin/offertes/${id}`)
}
