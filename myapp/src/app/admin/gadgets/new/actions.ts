'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function createGadgetAction(formData: FormData) {
  const nameNl      = (formData.get('nameNl')      as string).trim()
  const descriptionNl = (formData.get('descriptionNl') as string)?.trim() || null
  const categoryId  = (formData.get('categoryId')  as string).trim()
  const priceRaw    = (formData.get('basePriceCents') as string).trim()
  const sortOrderRaw = (formData.get('sortOrder')  as string).trim()
  const slugRaw     = (formData.get('slug')         as string)?.trim()
  const imageUrl          = (formData.get('imageUrl')          as string)?.trim() || null
  const mockupImageUrl    = (formData.get('mockupImageUrl')    as string)?.trim() || null
  const thumbnailImageUrl = (formData.get('thumbnailImageUrl') as string)?.trim() || null
  const stockRaw          = (formData.get('stockQuantity')     as string)?.trim()

  const isActive        = formData.get('isActive')        === 'on'
  const isVisibleInDIY  = formData.get('isVisibleInDIY')  === 'on'
  const isVisibleInShop = formData.get('isVisibleInShop') === 'on'
  const isPersonalizable = formData.get('isPersonalizable') === 'on'

  const widthMmRaw   = (formData.get('widthMm')   as string)?.trim()
  const heightMmRaw  = (formData.get('heightMm')  as string)?.trim()
  const depthMmRaw   = (formData.get('depthMm')   as string)?.trim()
  const mockupScaleRaw = (formData.get('mockupScale') as string)?.trim()
  const visualPaddingRaw = (formData.get('visualPadding') as string)?.trim()

  if (!nameNl)      throw new Error('Naam is verplicht')
  if (!categoryId)  throw new Error('Categorie is verplicht')
  if (!priceRaw)    throw new Error('Prijs is verplicht')

  const basePriceCents  = Math.round(parseFloat(priceRaw) * 100)
  const sortOrder       = sortOrderRaw ? parseInt(sortOrderRaw, 10) : 0
  const stockQuantity   = stockRaw !== '' && stockRaw !== undefined ? parseInt(stockRaw, 10) : null
  const slug = slugRaw || toSlug(nameNl)

  const widthMm  = widthMmRaw  ? parseFloat(widthMmRaw)  : undefined
  const heightMm = heightMmRaw ? parseFloat(heightMmRaw) : undefined
  const depthMm  = depthMmRaw  ? parseFloat(depthMmRaw)  : undefined
  const mockupScale = mockupScaleRaw ? parseFloat(mockupScaleRaw) : undefined
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

  const configJson = dimensions ? { dimensions } : undefined

  const product = await prisma.product.create({
    data: {
      nameNl,
      descriptionNl,
      slug,
      categoryId,
      basePriceCents,
      sortOrder,
      isActive,
      isVisibleInDIY,
      isVisibleInShop,
      isPersonalizable,
      stockQuantity,
      mockupImageUrl,
      thumbnailImageUrl,
      ...(configJson ? { configJson } : {}),
    },
  })

  if (imageUrl) {
    await prisma.productAsset.create({
      data: { productId: product.id, url: imageUrl, sortOrder: 0 },
    })
  }

  redirect(`/admin/gadgets/${product.id}`)
}
