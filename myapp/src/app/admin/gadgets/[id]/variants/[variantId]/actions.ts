'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function updateVariantAction(
  productId: string,
  variantId: string,
  formData: FormData,
) {
  const name             = (formData.get('name')            as string)?.trim() || null
  const color            = (formData.get('color')           as string)?.trim() || null
  const sizeLabel        = (formData.get('sizeLabel')       as string)?.trim() || null
  const widthMmRaw       = (formData.get('widthMm')         as string)?.trim()
  const heightMmRaw      = (formData.get('heightMm')        as string)?.trim()
  const depthMmRaw       = (formData.get('depthMm')         as string)?.trim()
  const priceRaw         = (formData.get('priceCents')      as string)?.trim()
  const sortOrderRaw     = (formData.get('sortOrder')       as string)?.trim()
  const mockupScaleRaw   = (formData.get('mockupScale')     as string)?.trim()
  const visualPaddingRaw = (formData.get('visualPadding')   as string)?.trim()
  const thumbnailImageUrl = (formData.get('thumbnailImageUrl') as string)?.trim() || null
  const mockupImageUrl    = (formData.get('mockupImageUrl')    as string)?.trim() || null

  const isActive  = formData.get('isActive')  === 'on'
  const isDefault = formData.get('isDefault') === 'on'

  const widthMm       = widthMmRaw       ? parseFloat(widthMmRaw)                : null
  const heightMm      = heightMmRaw      ? parseFloat(heightMmRaw)               : null
  const depthMm       = depthMmRaw       ? parseFloat(depthMmRaw)                : null
  const priceCents    = priceRaw         ? Math.round(parseFloat(priceRaw) * 100) : null
  const sortOrder     = sortOrderRaw     ? parseInt(sortOrderRaw, 10)             : 0
  const mockupScale   = mockupScaleRaw   ? parseFloat(mockupScaleRaw)            : null
  const visualPadding = visualPaddingRaw ? parseFloat(visualPaddingRaw)          : null

  // If setting as default, clear existing defaults first (excluding this variant)
  if (isDefault) {
    await prisma.gadgetVariant.updateMany({
      where: { productId, isDefault: true, id: { not: variantId } },
      data:  { isDefault: false },
    })
  }

  await prisma.gadgetVariant.update({
    where: { id: variantId },
    data: {
      name, color, sizeLabel,
      widthMm, heightMm, depthMm,
      priceCents, sortOrder,
      isActive, isDefault,
      thumbnailImageUrl, mockupImageUrl,
      mockupScale,
      visualPadding,
    },
  })

  revalidatePath(`/admin/gadgets/${productId}`)
  redirect(`/admin/gadgets/${productId}`)
}

export async function deleteVariantAction(productId: string, variantId: string) {
  await prisma.gadgetVariant.delete({ where: { id: variantId } })
  revalidatePath(`/admin/gadgets/${productId}`)
  redirect(`/admin/gadgets/${productId}`)
}

/** Inline action — no redirect, caller does router.refresh() */
export async function duplicateVariantAction(productId: string, variantId: string) {
  const src = await prisma.gadgetVariant.findUnique({ where: { id: variantId } })
  if (!src || src.productId !== productId) return
  const { id, createdAt, updatedAt, isDefault, sortOrder, name, ...rest } = src
  await prisma.gadgetVariant.create({
    data: {
      ...rest,
      name: name ? `${name} (kopie)` : null,
      isDefault: false,
      sortOrder: sortOrder + 1,
    },
  })
  revalidatePath(`/admin/gadgets/${productId}`)
}

/** Inline action — no redirect */
export async function toggleVariantActiveAction(productId: string, variantId: string, isActive: boolean) {
  await prisma.gadgetVariant.update({ where: { id: variantId }, data: { isActive } })
  revalidatePath(`/admin/gadgets/${productId}`)
}

/** Inline action — no redirect */
export async function setVariantDefaultAction(productId: string, variantId: string) {
  await prisma.$transaction([
    prisma.gadgetVariant.updateMany({ where: { productId, isDefault: true }, data: { isDefault: false } }),
    prisma.gadgetVariant.update({ where: { id: variantId }, data: { isDefault: true } }),
  ])
  revalidatePath(`/admin/gadgets/${productId}`)
}
