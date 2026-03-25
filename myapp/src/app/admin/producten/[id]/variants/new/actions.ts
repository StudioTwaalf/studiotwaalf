'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function createVariantAction(productId: string, formData: FormData) {
  const name         = (formData.get('name') as string | null)?.trim() || null
  const color        = (formData.get('color') as string | null)?.trim() || null
  const sizeLabel    = (formData.get('sizeLabel') as string | null)?.trim() || null
  const priceStr     = (formData.get('priceCents') as string | null)?.trim() ?? ''
  const widthMm      = parseFloat(formData.get('widthMm') as string)  || null
  const heightMm     = parseFloat(formData.get('heightMm') as string) || null
  const depthMm      = parseFloat(formData.get('depthMm') as string)  || null
  const thumbnailImageUrl = (formData.get('thumbnailImageUrl') as string | null)?.trim() || null
  const mockupImageUrl    = (formData.get('mockupImageUrl') as string | null)?.trim() || null
  const isActive     = formData.get('isActive')  === 'on'
  const isDefault    = formData.get('isDefault') === 'on'

  const priceCents = priceStr !== '' ? Math.round(parseFloat(priceStr) * 100) : null

  // Get next sortOrder
  const maxOrder = await prisma.gadgetVariant.aggregate({
    where: { productId },
    _max: { sortOrder: true },
  })

  // If setting as default, unset all others
  if (isDefault) {
    await prisma.gadgetVariant.updateMany({ where: { productId }, data: { isDefault: false } })
  }

  await prisma.gadgetVariant.create({
    data: {
      productId,
      name,
      color,
      sizeLabel,
      priceCents,
      widthMm,
      heightMm,
      depthMm,
      thumbnailImageUrl,
      mockupImageUrl,
      isActive,
      isDefault,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
  })

  revalidatePath(`/admin/producten/${productId}`)
  redirect(`/admin/producten/${productId}#varianten`)
}
