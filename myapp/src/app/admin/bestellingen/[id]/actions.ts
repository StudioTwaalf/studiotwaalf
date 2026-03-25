'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { ShopOrderStatus } from '@prisma/client'

export async function updateOrderStatusAction(id: string, status: ShopOrderStatus) {
  await prisma.shopOrder.update({ where: { id }, data: { status } })
  revalidatePath(`/admin/bestellingen/${id}`)
  revalidatePath('/admin/bestellingen')
}

export async function updateOrderNotesAction(id: string, formData: FormData) {
  const internalNotes = formData.get('internalNotes') as string | null
  await prisma.shopOrder.update({ where: { id }, data: { internalNotes: internalNotes ?? '' } })
  revalidatePath(`/admin/bestellingen/${id}`)
}
