'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function updateVariantAction(productId: string, variantId: string, formData: FormData) {
  const name         = (formData.get('name') as string | null)?.trim() || null
  const color        = (formData.get('color') as string | null)?.trim() || null
  const sizeLabel    = (formData.get('sizeLabel') as string | null)?.trim() || null
  const priceStr     = (formData.get('priceCents') as string | null)?.trim() ?? ''
  const widthMm      = parseFloat(formData.get('widthMm') as string)  || null
  const heightMm     = parseFloat(formData.get('heightMm') as string) || null
  const depthMm      = parseFloat(formData.get('depthMm') as string)  || null
  const mockupScale  = parseFloat(formData.get('mockupScale') as string)  || null
  const visualPadding = parseFloat(formData.get('visualPadding') as string)
  const thumbnailImageUrl = (formData.get('thumbnailImageUrl') as string | null)?.trim() || null
  const mockupImageUrl    = (formData.get('mockupImageUrl') as string | null)?.trim() || null
  const isActive     = formData.get('isActive')  === 'on'
  const isDefault    = formData.get('isDefault') === 'on'
  const sortOrder    = parseInt(formData.get('sortOrder') as string) || 0

  const priceCents = priceStr !== '' ? Math.round(parseFloat(priceStr) * 100) : null

  // If setting as default, unset all others first
  if (isDefault) {
    await prisma.gadgetVariant.updateMany({
      where: { productId, id: { not: variantId } },
      data: { isDefault: false },
    })
  }

  await prisma.gadgetVariant.update({
    where: { id: variantId },
    data: {
      name,
      color,
      sizeLabel,
      priceCents,
      widthMm,
      heightMm,
      depthMm,
      mockupScale,
      visualPadding: isFinite(visualPadding) && !isNaN(visualPadding) ? visualPadding : null,
      thumbnailImageUrl,
      mockupImageUrl,
      isActive,
      isDefault,
      sortOrder,
    },
  })

  revalidatePath(`/admin/producten/${productId}`)
  redirect(`/admin/producten/${productId}/variants/${variantId}?saved=1`)
}

export async function deleteVariantAction(productId: string, variantId: string) {
  await prisma.gadgetVariant.delete({ where: { id: variantId } })
  revalidatePath(`/admin/producten/${productId}`)
  redirect(`/admin/producten/${productId}#varianten`)
}
