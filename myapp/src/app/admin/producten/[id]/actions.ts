'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ─────────────────────────────────────────────────────────────────────────────
// Update product (main form)
// ─────────────────────────────────────────────────────────────────────────────

export async function updateProductAction(id: string, formData: FormData) {
  const nameNl         = (formData.get('nameNl') as string).trim()
  const slugRaw        = (formData.get('slug') as string | null)?.trim() ?? ''
  const descriptionNl  = (formData.get('descriptionNl') as string | null)?.trim() ?? null
  const categoryId     = formData.get('categoryId') as string
  const priceStr       = formData.get('basePriceCents') as string
  const sortOrderStr   = formData.get('sortOrder') as string
  const stockStr       = (formData.get('stockQuantity') as string | null)?.trim() ?? ''

  const thumbnailImageUrl = (formData.get('thumbnailImageUrl') as string | null)?.trim() || null
  const mockupImageUrl    = (formData.get('mockupImageUrl') as string | null)?.trim() || null
  const imageUrl          = (formData.get('imageUrl') as string | null)?.trim() || null

  const widthMm      = parseFloat(formData.get('widthMm') as string)   || null
  const heightMm     = parseFloat(formData.get('heightMm') as string)  || null
  const depthMm      = parseFloat(formData.get('depthMm') as string)   || null
  const mockupScale  = parseFloat(formData.get('mockupScale') as string) || null
  const visualPadding = parseFloat(formData.get('visualPadding') as string)

  const isActive          = formData.get('isActive')          === 'on'
  const isVisibleInShop   = formData.get('isVisibleInShop')   === 'on'
  const isVisibleInDIY    = formData.get('isVisibleInDIY')    === 'on'
  const isPersonalizable  = formData.get('isPersonalizable')  === 'on'
  const requiresDiyFlow   = formData.get('requiresDiyFlow')   === 'on'
  // Only present in form when requiresDiyFlow is true + template section is rendered
  const diyTemplateId     = (formData.get('diyTemplateId') as string | null)?.trim() || null

  const slug           = slugRaw || toSlug(nameNl)
  const basePriceCents = Math.round(parseFloat(priceStr) * 100)
  const sortOrder      = parseInt(sortOrderStr) || 0
  const stockQuantity  = stockStr !== '' ? parseInt(stockStr) : null

  // Preserve existing configJson and update dimensions section only
  const existing = await prisma.product.findUnique({ where: { id }, select: { configJson: true } })
  const existingConfig = (existing?.configJson ?? {}) as Record<string, unknown>

  const hasDimensions = widthMm !== null && heightMm !== null
  const updatedConfig = {
    ...existingConfig,
    ...(hasDimensions ? {
      dimensions: {
        widthMm,
        heightMm,
        ...(depthMm !== null ? { depthMm } : {}),
        ...(mockupScale !== null ? { mockupScale } : {}),
        ...(isFinite(visualPadding) && !isNaN(visualPadding) ? { visualPadding } : {}),
      }
    } : {}),
  }

  await prisma.product.update({
    where: { id },
    data: {
      nameNl,
      slug,
      descriptionNl,
      categoryId,
      basePriceCents,
      sortOrder,
      stockQuantity,
      thumbnailImageUrl,
      mockupImageUrl,
      isActive,
      isVisibleInShop,
      isVisibleInDIY,
      isPersonalizable,
      requiresDiyFlow,
      diyTemplateId,
      configJson: updatedConfig,
    },
  })

  // Upsert the primary asset (fallback image URL)
  if (imageUrl) {
    const first = await prisma.productAsset.findFirst({ where: { productId: id }, orderBy: { sortOrder: 'asc' } })
    if (first) {
      await prisma.productAsset.update({ where: { id: first.id }, data: { url: imageUrl } })
    } else {
      await prisma.productAsset.create({ data: { productId: id, url: imageUrl, sortOrder: 0 } })
    }
  }

  revalidatePath('/admin/producten')
  revalidatePath(`/admin/producten/${id}`)
  redirect(`/admin/producten/${id}?saved=1`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete product
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteProductAction(id: string) {
  await prisma.product.delete({ where: { id } })
  revalidatePath('/admin/producten')
  redirect('/admin/producten')
}

// ─────────────────────────────────────────────────────────────────────────────
// Save personalization schema
// ─────────────────────────────────────────────────────────────────────────────

export async function savePersonalizationAction(id: string, formData: FormData) {
  const schemaJsonStr = (formData.get('schemaJson') as string | null)?.trim() ?? '{}'
  const isPersonalizable = formData.get('isPersonalizable') === 'on'

  let schemaJson: Prisma.InputJsonValue
  try {
    schemaJson = JSON.parse(schemaJsonStr) as Prisma.InputJsonValue
  } catch {
    throw new Error('Ongeldige JSON in personalisatieschema')
  }

  // Update product flag
  await prisma.product.update({
    where: { id },
    data: { isPersonalizable },
  })

  // Upsert the personalization template (max one per product)
  const existing = await prisma.productPersonalizationTemplate.findFirst({ where: { productId: id } })
  if (existing) {
    await prisma.productPersonalizationTemplate.update({
      where: { id: existing.id },
      data: { schemaJson: schemaJson as any },
    })
  } else {
    await prisma.productPersonalizationTemplate.create({
      data: { productId: id, schemaJson },
    })
  }

  revalidatePath(`/admin/producten/${id}`)
  redirect(`/admin/producten/${id}?saved=1`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Toggle DIY tool link (isVisibleInDIY flag)
// ─────────────────────────────────────────────────────────────────────────────

export async function toggleDIYLinkAction(id: string, link: boolean) {
  await prisma.product.update({
    where: { id },
    data: { isVisibleInDIY: link },
  })
  revalidatePath(`/admin/producten/${id}`)
  revalidatePath('/admin/gadgets')
  revalidatePath(`/admin/gadgets/${id}`)
  redirect(`/admin/producten/${id}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Duplicate variant
// ─────────────────────────────────────────────────────────────────────────────

export async function duplicateVariantAction(productId: string, variantId: string) {
  const source = await prisma.gadgetVariant.findUnique({ where: { id: variantId } })
  if (!source) throw new Error('Variant niet gevonden')

  const { id: _id, createdAt: _c, updatedAt: _u, isDefault, ...rest } = source

  const maxOrder = await prisma.gadgetVariant.aggregate({
    where: { productId },
    _max: { sortOrder: true },
  })

  await prisma.gadgetVariant.create({
    data: {
      ...rest,
      name: rest.name ? `${rest.name} (kopie)` : 'Kopie',
      isDefault: false,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
  })

  revalidatePath(`/admin/producten/${productId}`)
  redirect(`/admin/producten/${productId}#varianten`)
}
