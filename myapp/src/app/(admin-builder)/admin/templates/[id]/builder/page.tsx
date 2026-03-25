import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { isTemplateDesign, type TemplateDesign } from '@/types/template'
import CanvasEditor from '@/components/editor/CanvasEditor'

interface Props {
  params: { id: string }
}

function makeDefaultDesign(w: number, h: number): TemplateDesign {
  return {
    version: 1,
    name: 'Nieuw template',
    artboards: [{
      id:              'front',
      name:            'Voorkant',
      width:           w,
      height:          h,
      unit:            'mm',
      backgroundColor: '#FFFFFF',
    }],
    elements: [],
  }
}

export default async function TemplateBuilderPage({ params }: Props) {
  const cookieStore = cookies()
  if (cookieStore.get('admin_session')?.value !== 'authenticated') {
    redirect(`/admin/login?from=/admin/templates/${params.id}/builder`)
  }

  const template = await prisma.template.findUnique({ where: { id: params.id } })
  if (!template) notFound()

  const raw = template.defaultDesignJson
  const initialDesign: TemplateDesign = isTemplateDesign(raw)
    ? raw
    : makeDefaultDesign(template.widthMm ?? 148, template.heightMm ?? 105)

  return (
    <CanvasEditor
      templateId={template.id}
      templateName={template.name}
      initialDesign={initialDesign}
      adminMode={true}
      adminTemplateId={template.id}
    />
  )
}
