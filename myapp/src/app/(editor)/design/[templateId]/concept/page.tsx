import { redirect, notFound } from 'next/navigation'
import { getToken } from 'next-auth/jwt'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { isTemplateDesign } from '@/types/template'
import { deriveJourneyType } from '@/lib/analytics'
import { normalizeGadgetsPayload } from '@/lib/personalization/effective'
import ConceptPageClient from '@/components/ConceptPageClient'

interface Props {
  params:       { templateId: string }
  searchParams: { design?: string }
}

export default async function ConceptPage({ params, searchParams }: Props) {
  const cookieStore = cookies()
  const token = await getToken({
    req: {
      headers: Object.fromEntries(headers()),
      cookies: Object.fromEntries(cookieStore.getAll().map((c) => [c.name, c.value])),
    } as Parameters<typeof getToken>[0]['req'],
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
    redirect(`/login?next=/design/${params.templateId}/concept${searchParams.design ? `?design=${searchParams.design}` : ''}`)
  }

  if (!searchParams.design) redirect(`/design/${params.templateId}`)

  const [template, design] = await Promise.all([
    prisma.template.findUnique({ where: { id: params.templateId } }),
    prisma.design.findFirst({
      where: { id: searchParams.design, userId: token.id as string },
    }),
  ])

  if (!template || !design) notFound()

  const templateDesign = isTemplateDesign(design.data) ? design.data : null
  const gadgetSelections = normalizeGadgetsPayload(design.gadgets)
  const journeyType = deriveJourneyType(template.category)

  // Paper ID is stored inside the design data under paperId
  const paperId = (
    typeof design.data === 'object' &&
    design.data !== null &&
    'paperId' in (design.data as object)
      ? (design.data as Record<string, unknown>).paperId as string
      : null
  )

  return (
    <ConceptPageClient
      templateId={params.templateId}
      designId={design.id}
      templateName={template.name}
      designName={design.name}
      templateDesign={templateDesign}
      gadgets={gadgetSelections.items}
      paperId={paperId}
      journeyType={journeyType}
    />
  )
}
