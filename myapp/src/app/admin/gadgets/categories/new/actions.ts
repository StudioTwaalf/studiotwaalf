'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function createCategoryAction(formData: FormData) {
  const nameNl    = (formData.get('nameNl') as string).trim()
  const sortOrder = parseInt((formData.get('sortOrder') as string) || '0', 10)
  const parentId  = (formData.get('parentId') as string) || null

  if (!nameNl) {
    redirect('/admin/gadgets/categories/new?error=Naam+is+verplicht')
  }

  const slug = toSlug(nameNl)

  try {
    await prisma.category.create({
      data: { nameNl, slug, sortOrder, parentId },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Onbekende fout'
    // Unique constraint = slug bestaat al
    const friendly = msg.includes('Unique') || msg.includes('unique')
      ? `Slug "${slug}" bestaat al. Kies een andere naam.`
      : msg
    redirect(`/admin/gadgets/categories/new?error=${encodeURIComponent(friendly)}`)
  }

  redirect('/admin/gadgets/categories')
}
