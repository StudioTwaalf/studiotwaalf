import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── POST /api/admin/templates — create template (from TemplateWizard) ────────

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, category, widthMm, heightMm, defaultDesignJson } = body

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const template = await prisma.template.create({
    data: {
      name,
      category:         category ?? null,
      widthMm:          widthMm ?? null,
      heightMm:         heightMm ?? null,
      defaultDesignJson: defaultDesignJson ?? null,
    },
  })

  return NextResponse.json(template, { status: 201 })
}
