import { redirect, notFound } from 'next/navigation'
import { getToken } from 'next-auth/jwt'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { isTemplateDesign, type TemplateDesign } from '@/types/template'
import CanvasEditor from '@/components/editor/CanvasEditor'

interface Props {
  params:       { templateId: string }
  searchParams: { design?: string }
}

function makeDefaultDesign(widthMm: number, heightMm: number): TemplateDesign {
  return {
    version:  1,
    name:     'Nieuw ontwerp',
    artboards: [{
      id:              'front',
      name:            'Voorkant',
      width:           widthMm,
      height:          heightMm,
      unit:            'mm',
      backgroundColor: '#FFFFFF',
    }],
    elements: [],
  }
}

export default async function DesignEditorPage({ params, searchParams }: Props) {
  const cookieStore = cookies()
  const token = await getToken({
    req: {
      headers: Object.fromEntries(headers()),
      cookies: Object.fromEntries(cookieStore.getAll().map((c) => [c.name, c.value])),
    } as Parameters<typeof getToken>[0]['req'],
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
    redirect(`/login?next=/design/${params.templateId}${searchParams.design ? `?design=${searchParams.design}` : ''}`)
  }

  const template = await prisma.template.findUnique({ where: { id: params.templateId } })
  if (!template) notFound()

  let design = null
  if (searchParams.design) {
    design = await prisma.design.findFirst({
      where: { id: searchParams.design, userId: token.id as string },
    })
  }

  const raw = design?.data ?? template.defaultDesignJson
  const initialDesign: TemplateDesign = isTemplateDesign(raw)
    ? raw
    : makeDefaultDesign(template.widthMm ?? 148, template.heightMm ?? 210)

  return (
    <CanvasEditor
      templateId={params.templateId}
      templateName={template.name}
      initialDesign={initialDesign}
      initialDesignId={design?.id ?? null}
    />
  )
}
