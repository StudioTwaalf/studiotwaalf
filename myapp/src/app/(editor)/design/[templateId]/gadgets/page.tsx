import { redirect, notFound } from 'next/navigation'
import { getToken } from 'next-auth/jwt'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { isTemplateDesign } from '@/types/template'
import { deriveJourneyType } from '@/lib/analytics'
import { normalizeGadgetsPayload } from '@/lib/personalization/effective'
import { parsePreviewConfig } from '@/lib/personalization/previewConfig'
import { parseProductDimensions } from '@/lib/product-dimensions'
import { parseQuantityConfig } from '@/lib/quantity-config'
import type { GadgetItem } from '@/lib/gadget-personalization'
import GadgetsPageClient from '@/components/GadgetsPageClient'

interface Props {
  params:       { templateId: string }
  searchParams: { design?: string; paper?: string }
}

export default async function GadgetsPage({ params, searchParams }: Props) {
  const cookieStore = cookies()
  const token = await getToken({
    req: {
      headers: Object.fromEntries(headers()),
      cookies: Object.fromEntries(cookieStore.getAll().map((c) => [c.name, c.value])),
    } as Parameters<typeof getToken>[0]['req'],
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
    redirect(`/login?next=/design/${params.templateId}/gadgets${searchParams.design ? `?design=${searchParams.design}` : ''}`)
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

  // Fetch active gadget products and map to GadgetItem shape
  const products = await prisma.product.findMany({
    where:   { isActive: true, isVisibleInDIY: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      category: true,
      assets: { take: 1, orderBy: { sortOrder: 'asc' } },
      variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
    },
  })

  const gadgets: GadgetItem[] = products.map((p) => ({
    id:             p.id,
    title:          p.nameNl,
    description:    p.descriptionNl ?? '',
    fromPriceCents: p.basePriceCents,
    personalizable: p.isPersonalizable,
    emoji:          p.assets[0]?.url ?? undefined,
    category:       p.category?.nameNl ?? undefined,
    previewConfig:  parsePreviewConfig(p.configJson),
    quantityConfig: parseQuantityConfig(p.configJson),
    dimensions:     parseProductDimensions(p.configJson) ?? undefined,
    stockQuantity:     p.stockQuantity,
    mockupImageUrl:    p.mockupImageUrl,
    thumbnailImageUrl: p.thumbnailImageUrl,
    variants: p.variants.length > 0
      ? p.variants.map((v) => ({
          id:                v.id,
          name:              v.name ?? v.id,
          color:             v.color,
          sizeLabel:         v.sizeLabel,
          priceCents:        v.priceCents,
          thumbnailImageUrl: v.thumbnailImageUrl,
          mockupImageUrl:    v.mockupImageUrl,
          widthMm:           v.widthMm,
          heightMm:          v.heightMm,
          depthMm:           v.depthMm,
          mockupScale:       v.mockupScale,
          visualPadding:     v.visualPadding,
          isDefault:         v.isDefault,
        }))
      : undefined,
  }))

  // Convert items array → Record<id, SelectedGadget> for initialSelected
  const initialSelected = Object.fromEntries(
    gadgetSelections.items.map((g) => [g.id, g]),
  )

  return (
    <GadgetsPageClient
      templateId={params.templateId}
      designId={design.id}
      templateName={template.name}
      templateDesign={templateDesign}
      gadgets={gadgets}
      initialSelected={initialSelected}
      initialGlobal={gadgetSelections.global}
      initialOverrides={gadgetSelections.overrides}
      paperParam={searchParams.paper ?? null}
      journeyType={journeyType}
    />
  )
}
