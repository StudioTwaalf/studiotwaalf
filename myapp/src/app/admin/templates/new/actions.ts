'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

function parseFormData(formData: FormData) {
  const name             = (formData.get('name') as string).trim()
  const description      = (formData.get('description') as string)?.trim() || null
  const category         = (formData.get('category') as string)?.trim() || null
  const widthMmRaw       = formData.get('widthMm') as string
  const heightMmRaw      = formData.get('heightMm') as string
  const defaultDesignRaw = (formData.get('defaultDesignJson') as string)?.trim()

  if (!name) throw new Error('Name is required')

  const widthMm  = widthMmRaw  ? parseFloat(widthMmRaw)  : null
  const heightMm = heightMmRaw ? parseFloat(heightMmRaw) : null

  let defaultDesignJson = null
  if (defaultDesignRaw) {
    try { defaultDesignJson = JSON.parse(defaultDesignRaw) }
    catch { throw new Error('defaultDesignJson must be valid JSON') }
  }

  return { name, description, category, widthMm, heightMm, defaultDesignJson }
}

export async function createTemplateAction(formData: FormData) {
  const data = parseFormData(formData)
  await prisma.template.create({ data })
  redirect('/admin/templates')
}

export async function createAndBuildAction(formData: FormData) {
  const data = parseFormData(formData)
  const template = await prisma.template.create({ data })
  redirect(`/admin/templates/${template.id}/builder`)
}
