'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

// ─── Slug helper ──────────────────────────────────────────────────────────────

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ─────────────────────────────────────────────────────────────────────────────
// Create category
// ─────────────────────────────────────────────────────────────────────────────

export async function createCategoryAction(formData: FormData) {
  const nameNl       = (formData.get('nameNl') as string).trim()
  const slugRaw      = (formData.get('slug') as string | null)?.trim() ?? ''
  const descriptionNl = (formData.get('descriptionNl') as string | null)?.trim() || null
  const sortOrderStr = formData.get('sortOrder') as string
  const isActive     = formData.get('isActive') === 'on'

  const slug      = slugRaw || toSlug(nameNl)
  const sortOrder = parseInt(sortOrderStr) || 0

  const category = await prisma.category.create({
    data: { nameNl, slug, descriptionNl, sortOrder, isActive },
  })

  revalidatePath('/admin/producten/categorieen')
  revalidatePath('/admin/producten')
  revalidatePath('/webshop')
  redirect(`/admin/producten/categorieen/${category.id}?saved=1`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Update category
// ─────────────────────────────────────────────────────────────────────────────

export async function updateCategoryAction(id: string, formData: FormData) {
  const nameNl       = (formData.get('nameNl') as string).trim()
  const slugRaw      = (formData.get('slug') as string | null)?.trim() ?? ''
  const descriptionNl = (formData.get('descriptionNl') as string | null)?.trim() || null
  const sortOrderStr = formData.get('sortOrder') as string
  const isActive     = formData.get('isActive') === 'on'

  const slug      = slugRaw || toSlug(nameNl)
  const sortOrder = parseInt(sortOrderStr) || 0

  await prisma.category.update({
    where: { id },
    data: { nameNl, slug, descriptionNl, sortOrder, isActive },
  })

  revalidatePath('/admin/producten/categorieen')
  revalidatePath(`/admin/producten/categorieen/${id}`)
  revalidatePath('/admin/producten')
  revalidatePath('/webshop')
  redirect(`/admin/producten/categorieen/${id}?saved=1`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete category
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteCategoryAction(id: string) {
  // Safety: refuse deletion if any products are still linked to this category.
  // Products must be reassigned first to prevent broken references.
  const productCount = await prisma.product.count({ where: { categoryId: id } })
  if (productCount > 0) {
    throw new Error(
      `Deze categorie heeft nog ${productCount} product${productCount !== 1 ? 'en' : ''}. ` +
      `Wijs ze opnieuw in voor je deze categorie verwijdert.`
    )
  }

  await prisma.category.delete({ where: { id } })

  revalidatePath('/admin/producten/categorieen')
  revalidatePath('/admin/producten')
  revalidatePath('/webshop')
  redirect('/admin/producten/categorieen')
}
