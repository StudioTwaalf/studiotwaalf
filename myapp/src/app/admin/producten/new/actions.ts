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

export async function createProductAction(formData: FormData) {
  const nameNl         = (formData.get('nameNl') as string).trim()
  const slugRaw        = (formData.get('slug') as string | null)?.trim() ?? ''
  const categoryId     = formData.get('categoryId') as string
  const priceStr       = formData.get('basePriceCents') as string

  const slug           = slugRaw || toSlug(nameNl)
  const basePriceCents = Math.round(parseFloat(priceStr) * 100)

  const product = await prisma.product.create({
    data: {
      nameNl,
      slug,
      categoryId,
      basePriceCents,
      isVisibleInShop: true,
      isVisibleInDIY:  false,
      isActive:        true,
    },
  })

  redirect(`/admin/producten/${product.id}?nieuw=1`)
}
