'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function updateAction(id: string, formData: FormData): Promise<void> {
  const name             = (formData.get('name') as string).trim()
  const description      = (formData.get('description') as string)?.trim() || null
  const category         = (formData.get('category') as string)?.trim() || null
  const status           = (formData.get('status') as string)?.trim() || 'draft'
  const widthMmRaw       = formData.get('widthMm') as string
  const heightMmRaw      = formData.get('heightMm') as string
  const defaultDesignRaw = (formData.get('defaultDesignJson') as string)?.trim()

  if (!name) throw new Error('Naam is verplicht')

  const widthMm  = widthMmRaw  ? parseFloat(widthMmRaw)  : null
  const heightMm = heightMmRaw ? parseFloat(heightMmRaw) : null

  let defaultDesignJson = null
  if (defaultDesignRaw) {
    try { defaultDesignJson = JSON.parse(defaultDesignRaw) }
    catch { throw new Error('defaultDesignJson must be valid JSON') }
  }

  await prisma.template.update({
    where: { id },
    data:  { name, description, category, status, widthMm, heightMm, defaultDesignJson },
  })

  revalidatePath('/admin/templates')
  redirect('/admin/templates')
}

export async function deleteTemplateAction(id: string): Promise<void> {
  // Design and OfferRequest both reference Template without onDelete: Cascade
  // — clear child records first before deleting the template.
  const designs = await prisma.design.findMany({
    where:  { templateId: id },
    select: { id: true },
  })
  const designIds = designs.map((d) => d.id)

  await prisma.$transaction([
    // OfferRequest references Design (and possibly Template) — delete first
    prisma.offerRequest.deleteMany({ where: { templateId: id } }),
    // Clear any remaining designs
    prisma.design.deleteMany({ where: { id: { in: designIds } } }),
    // Now safe to delete the template
    prisma.template.delete({ where: { id } }),
  ])

  revalidatePath('/admin/templates')
}
