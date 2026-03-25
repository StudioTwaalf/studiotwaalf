import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import TemplateEditForm from '@/components/admin/TemplateEditForm'
import { updateAction } from './actions'

interface Props {
  params: { id: string }
}

export default async function EditTemplatePage({ params }: Props) {
  const template = await prisma.template.findUnique({
    where: { id: params.id },
    include: { _count: { select: { designs: true } } },
  })

  if (!template) notFound()

  const boundAction = updateAction.bind(null, template.id)

  return (
    <div className="max-w-5xl">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/admin/templates" className="hover:text-gray-600 transition-colors">
          Templates
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium truncate max-w-xs">{template.name}</span>
      </nav>

      <TemplateEditForm
        templateId={template.id}
        designsCount={template._count.designs}
        initialName={template.name}
        initialDescription={template.description ?? ''}
        initialCategory={template.category ?? ''}
        initialStatus={template.status ?? 'draft'}
        initialWidthMm={template.widthMm}
        initialHeightMm={template.heightMm}
        initialDesignJson={
          template.defaultDesignJson
            ? JSON.stringify(template.defaultDesignJson, null, 2)
            : ''
        }
        action={boundAction}
      />
    </div>
  )
}
