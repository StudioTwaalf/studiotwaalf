import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import type { TemplateSummary } from '@/components/TemplatesGrid'
import TemplatesPageClient from '@/components/TemplatesPageClient'

export const metadata: Metadata = {
  title: 'Templates — Studio Twaalf',
  description: 'Kies een template en start je gepersonaliseerd ontwerp.',
}

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({
    where:   { status: 'published' },
    orderBy: { createdAt: 'desc' },
    select: {
      id:          true,
      name:        true,
      category:    true,
      description: true,
      thumbnail:   true,
      widthMm:     true,
      heightMm:    true,
    },
  })

  const summaries: TemplateSummary[] = templates.map((t) => ({
    id:          t.id,
    name:        t.name,
    category:    t.category,
    description: t.description,
    thumbnail:   t.thumbnail,
    widthMm:     t.widthMm,
    heightMm:    t.heightMm,
  }))

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#C4B8A0] mb-3">
          Studio Twaalf
        </p>
        <h1 className="font-serif text-[2rem] sm:text-[2.5rem] leading-tight text-[#2C2416] tracking-tight mb-3">
          Kies je template
        </h1>
        <p className="text-sm text-[#9C8F7A] max-w-md">
          Elk ontwerp is volledig aanpasbaar — tekst, kleuren, illustraties en papier.
        </p>
      </div>

      <TemplatesPageClient templates={summaries} />
    </div>
  )
}
