'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function deleteCategoryAction(id: string): Promise<{ error?: string }> {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true, children: true } },
    },
  })

  if (!category) return { error: 'Categorie niet gevonden.' }

  if (category._count.products > 0) {
    return { error: `Kan niet verwijderen: ${category._count.products} gadget(s) zijn aan deze categorie gekoppeld.` }
  }

  if (category._count.children > 0) {
    return { error: 'Kan niet verwijderen: verwijder eerst de subcategorieën.' }
  }

  await prisma.category.delete({ where: { id } })
  revalidatePath('/admin/gadgets/categories')
  return {}
}
