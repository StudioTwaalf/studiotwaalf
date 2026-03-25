import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── PATCH /api/admin/templates/[id] — update template design JSON ────────────

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { name, category, widthMm, heightMm, defaultDesignJson, thumbnail } = body

  const template = await prisma.template.update({
    where: { id: params.id },
    data: {
      ...(name              !== undefined && { name }),
      ...(category          !== undefined && { category }),
      ...(widthMm           !== undefined && { widthMm }),
      ...(heightMm          !== undefined && { heightMm }),
      ...(defaultDesignJson !== undefined && { defaultDesignJson }),
      ...(thumbnail         !== undefined && { thumbnail }),
    },
  })

  return NextResponse.json(template)
}
