'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function updateGadgetAction(id: string, formData: FormData) {
  const nameNl        = (formData.get('nameNl')        as string).trim()
  const descriptionNl = (formData.get('descriptionNl') as string)?.trim() || null
  const categoryId    = (formData.get('categoryId')    as string).trim()
  const priceRaw      = (formData.get('basePriceCents') as string).trim()
  const sortOrderRaw  = (formData.get('sortOrder')     as string).trim()
  const slugRaw       = (formData.get('slug')          as string)?.trim()
  const imageUrl          = (formData.get('imageUrl')         as string)?.trim() || null
  const mockupImageUrl    = (formData.get('mockupImageUrl')   as string)?.trim() || null
  const thumbnailImageUrl = (formData.get('thumbnailImageUrl') as string)?.trim() || null
  const stockRaw          = (formData.get('stockQuantity')    as string)?.trim()

  const isActive         = formData.get('isActive')         === 'on'
  const isVisibleInDIY   = formData.get('isVisibleInDIY')   === 'on'
  const isVisibleInShop  = formData.get('isVisibleInShop')  === 'on'
  const isPersonalizable = formData.get('isPersonalizable') === 'on'

  const widthMmRaw      = (formData.get('widthMm')       as string)?.trim()
  const heightMmRaw     = (formData.get('heightMm')      as string)?.trim()
  const depthMmRaw      = (formData.get('depthMm')       as string)?.trim()
  const mockupScaleRaw  = (formData.get('mockupScale')   as string)?.trim()
  const visualPaddingRaw = (formData.get('visualPadding') as string)?.trim()

  if (!nameNl)     throw new Error('Naam is verplicht')
  if (!categoryId) throw new Error('Categorie is verplicht')
  if (!priceRaw)   throw new Error('Prijs is verplicht')

  const basePriceCents = Math.round(parseFloat(priceRaw) * 100)
  const sortOrder      = sortOrderRaw ? parseInt(sortOrderRaw, 10) : 0
  const slug           = slugRaw || toSlug(nameNl)
  const stockQuantity  = stockRaw !== '' && stockRaw !== undefined ? parseInt(stockRaw, 10) : null

  const widthMm  = widthMmRaw  ? parseFloat(widthMmRaw)  : undefined
  const heightMm = heightMmRaw ? parseFloat(heightMmRaw) : undefined
  const depthMm  = depthMmRaw  ? parseFloat(depthMmRaw)  : undefined
  const mockupScale   = mockupScaleRaw   ? parseFloat(mockupScaleRaw)   : undefined
  const visualPadding = visualPaddingRaw ? parseFloat(visualPaddingRaw) : undefined

  const dimensions = widthMm && heightMm
    ? {
        widthMm,
        heightMm,
        ...(depthMm  !== undefined ? { depthMm }  : {}),
        ...(mockupScale !== undefined && mockupScale !== 1.0 ? { mockupScale } : {}),
        ...(visualPadding !== undefined && visualPadding > 0 ? { visualPadding } : {}),
      }
    : undefined

  // Preserve existing configJson keys (quantity, previewConfig etc.) while updating dimensions
  const existing = await prisma.product.findUnique({ where: { id }, select: { configJson: true } })
  const existingConfig = (existing?.configJson && typeof existing.configJson === 'object' && !Array.isArray(existing.configJson))
    ? existing.configJson as Record<string, unknown>
    : {}

  const configJson = dimensions
    ? { ...existingConfig, dimensions }
    : (({ dimensions: _d, ...rest }) => Object.keys(rest).length ? rest : null)(existingConfig as Record<string, unknown> & { dimensions?: unknown })

  await prisma.product.update({
    where: { id },
    data: {
      nameNl, descriptionNl, slug, basePriceCents, sortOrder,
      isActive, isVisibleInDIY, isVisibleInShop, isPersonalizable, stockQuantity,
      mockupImageUrl, thumbnailImageUrl,
      category: { connect: { id: categoryId } },
      ...(configJson !== undefined ? { configJson: configJson as object } : {}),
    },
  })

  // Upsert first asset (image)
  if (imageUrl) {
    const existing = await prisma.productAsset.findFirst({ where: { productId: id }, orderBy: { sortOrder: 'asc' } })
    if (existing) {
      await prisma.productAsset.update({ where: { id: existing.id }, data: { url: imageUrl } })
    } else {
      await prisma.productAsset.create({ data: { productId: id, url: imageUrl, sortOrder: 0 } })
    }
  }

  revalidatePath('/admin/gadgets')
  revalidatePath(`/admin/gadgets/${id}`)
  redirect(`/admin/gadgets/${id}?saved=1`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Toggle webshop link (isVisibleInShop flag)
// ─────────────────────────────────────────────────────────────────────────────

export async function toggleShopLinkAction(id: string, link: boolean) {
  await prisma.product.update({
    where: { id },
    data: { isVisibleInShop: link },
  })
  revalidatePath(`/admin/gadgets/${id}`)
  revalidatePath('/admin/producten')
  revalidatePath(`/admin/producten/${id}`)
  redirect(`/admin/gadgets/${id}`)
}

export async function deleteGadgetAction(id: string) {
  // DesignAddonSelection has no onDelete: Cascade — clear it first (table is unused)
  await prisma.designAddonSelection.deleteMany({ where: { productId: id } })
  await prisma.product.delete({ where: { id } })
  revalidatePath('/admin/gadgets')
}
