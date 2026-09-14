/**
 * /design/[templateId]/quick-gadgets
 *
 * Server-side "skip card design" shortcut.
 * Creates an empty design for the authenticated user and immediately
 * redirects to the gadgets page — skipping the card design step.
 *
 * Used from DiyRedirectBlock when the user clicks "Sla kaartje over".
 */

import { redirect } from 'next/navigation'
import { getToken } from 'next-auth/jwt'
import { headers, cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

interface Props {
  params:       { templateId: string }
  searchParams: { product?: string }
}

export default async function QuickGadgetsPage({ params, searchParams }: Props) {
  const cookieStore = cookies()
  const token = await getToken({
    req: {
      headers: Object.fromEntries(headers()),
      cookies: Object.fromEntries(cookieStore.getAll().map((c) => [c.name, c.value])),
    } as Parameters<typeof getToken>[0]['req'],
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Not logged in → go to login, come back here after
  if (!token) {
    redirect(`/login?next=/design/${params.templateId}/quick-gadgets`)
  }

  // Verify template exists
  const template = await prisma.template.findUnique({
    where: { id: params.templateId },
  })
  if (!template) redirect('/templates')

  // Create a minimal empty design (no card design yet)
  const design = await prisma.design.create({
    data: {
      templateId: params.templateId,
      userId:     token.id as string,
      name:       `Gadgets – ${template.name}`,
      data:       {},   // empty — no card drawn
      gadgets:    undefined,
    },
  })

  // Go straight to gadgets; if a product was specified, auto-open its modal
  const openParam = searchParams.product ? `&open=${searchParams.product}` : ''
  redirect(`/design/${params.templateId}/gadgets?design=${design.id}${openParam}`)
}
