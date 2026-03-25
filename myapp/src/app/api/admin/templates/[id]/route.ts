import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── GET /api/admin/templates/[id] — used by TemplateWizard in editor ─────────

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const template = await prisma.template.findUnique({ where: { id: params.id } })
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(template)
}

// ─── PUT /api/admin/templates/[id] — update template (TemplateWizard) ─────────

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const {
    name, description, category, tags, thumbnail,
    widthMm, heightMm, defaultDesignJson,
  } = body

  const template = await prisma.template.update({
    where: { id: params.id },
    data: {
      ...(name              !== undefined && { name }),
      ...(description       !== undefined && { description }),
      ...(category          !== undefined && { category }),
      ...(tags              !== undefined && { tags }),
      ...(thumbnail         !== undefined && { thumbnail }),
      ...(widthMm           !== undefined && { widthMm }),
      ...(heightMm          !== undefined && { heightMm }),
      ...(defaultDesignJson !== undefined && { defaultDesignJson }),
    },
  })

  return NextResponse.json(template)
}
