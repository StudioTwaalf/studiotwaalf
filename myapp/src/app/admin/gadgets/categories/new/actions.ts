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

  if (!nameNl) throw new Error('Naam is verplicht')

  const slug = toSlug(nameNl)

  await prisma.category.create({
    data: { nameNl, slug, sortOrder },
  })

  redirect('/admin/gadgets/categories')
}
