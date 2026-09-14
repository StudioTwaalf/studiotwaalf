import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

function isAdmin(): boolean {
  return cookies().get('admin_session')?.value === 'authenticated'
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseBoolean(v: string, defaultValue: boolean): boolean {
  if (!v) return defaultValue
  return v.toLowerCase() === 'ja' || v === '1' || v.toLowerCase() === 'true'
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  // Auto-detect delimiter
  const sep = lines.join('').split(';').length > lines.join('').split(',').length ? ';' : ','
  // Find header row (first line containing 'naam')
  const headerIdx = lines.findIndex(l => l.toLowerCase().split(sep).includes('naam'))
  if (headerIdx === -1) return []
  const headers = lines[headerIdx].split(sep).map((h) => h.trim())
  return lines.slice(headerIdx + 1).map((line) => {
    const values = line.split(sep)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = (values[i] ?? '').trim() })
    return row
  })
}

export async function POST(req: NextRequest) {
  if (!isAdmin()) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'Geen bestand ontvangen' }, { status: 400 })
  }

  const text = await file.text()
  const rows = parseCSV(text)
  if (!rows.length) {
    return NextResponse.json({ error: 'CSV is leeg of bevat geen datarijen' }, { status: 400 })
  }

  const categories = await prisma.category.findMany({ select: { id: true, slug: true } })
  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c.id]))

  const results = { created: 0, errors: [] as string[] }

  for (let i = 0; i < rows.length; i++) {
    const row     = rows[i]
    const lineNum = i + 2
    const naam = row['naam']
    const prijs = row['prijs_euro']

    if (!naam) { results.errors.push(`Rij ${lineNum}: naam is verplicht`); continue }
    if (!prijs) { results.errors.push(`Rij ${lineNum}: prijs_euro is verplicht`); continue }

    const priceCents = Math.round(parseFloat(prijs.replace(',', '.')) * 100)
    if (isNaN(priceCents)) { results.errors.push(`Rij ${lineNum}: ongeldige prijs "${prijs}"`); continue }

    const catSlug = row['categorie_slug']
    const catId   = catSlug ? catBySlug[catSlug] : undefined
    if (catSlug && !catId) {
      results.errors.push(`Rij ${lineNum}: categorie slug "${catSlug}" niet gevonden`)
      continue
    }

    const slug     = toSlug(naam)
    const widthMm  = row['breedte_mm']  ? parseInt(row['breedte_mm'],  10) : undefined
    const heightMm = row['hoogte_mm']   ? parseInt(row['hoogte_mm'],   10) : undefined
    const depthMm  = row['diepte_mm']   ? parseInt(row['diepte_mm'],   10) : undefined
    const voorraad = row['voorraad']    ? parseInt(row['voorraad'],     10) : null

    const configJson = widthMm && heightMm
      ? { widthMm, heightMm, ...(depthMm ? { depthMm } : {}) }
      : undefined

    try {
      await prisma.product.create({
        data: {
          slug,
          nameNl:           naam,
          basePriceCents:   priceCents,
          isActive:         parseBoolean(row['actief'], true),
          isVisibleInDIY:   parseBoolean(row['diy'], true),
          isVisibleInShop:  parseBoolean(row['shop'], false),
          isPersonalizable: parseBoolean(row['personaliseerbaar'], false),
          stockQuantity:    voorraad,
          ...(catId     ? { categoryId: catId }   : {}),
          ...(configJson ? { configJson }          : {}),
        } as Prisma.ProductUncheckedCreateInput,
      })
      results.created++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const friendly = msg.includes('Unique') || msg.includes('unique')
        ? `slug "${slug}" bestaat al`
        : msg.slice(0, 120)
      results.errors.push(`Rij ${lineNum} (${naam}): ${friendly}`)
    }
  }

  return NextResponse.json(results)
}
