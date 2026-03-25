import { redirect, notFound } from 'next/navigation'
import { getToken } from 'next-auth/jwt'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { deriveJourneyType } from '@/lib/analytics'
import { normalizeGadgetsPayload } from '@/lib/personalization/effective'
import OffertePageClient from '@/components/OffertePageClient'

interface Props {
  params:       { templateId: string }
  searchParams: { design?: string }
}

export default async function OffertePage({ params, searchParams }: Props) {
  const cookieStore = cookies()
  const token = await getToken({
    req: {
      headers: Object.fromEntries(headers()),
      cookies: Object.fromEntries(cookieStore.getAll().map((c) => [c.name, c.value])),
    } as Parameters<typeof getToken>[0]['req'],
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
    redirect(`/login?next=/design/${params.templateId}/offerte${searchParams.design ? `?design=${searchParams.design}` : ''}`)
  }

  if (!searchParams.design) redirect(`/design/${params.templateId}`)

  const [template, design] = await Promise.all([
    prisma.template.findUnique({ where: { id: params.templateId } }),
    prisma.design.findFirst({
      where: { id: searchParams.design, userId: token.id as string },
    }),
  ])

  if (!template || !design) notFound()

  const gadgetSelections = normalizeGadgetsPayload(design.gadgets)
  const journeyType = deriveJourneyType(template.category)

  const quoteMeta = design.quoteMetaJson
    ? (design.quoteMetaJson as { expectedDate?: string; notes?: string })
    : null

  return (
    <OffertePageClient
      templateId={params.templateId}
      designId={design.id}
      templateName={template.name}
      designName={design.name}
      gadgets={gadgetSelections.items}
      quoteMeta={quoteMeta}
      journeyType={journeyType}
    />
  )
}
