import { PrismaClient, GadgetType } from '@prisma/client'

const prisma = new PrismaClient()

const A6_SINGLE_DESIGN = {
  background: '#ffffff',
  elements: [
    {
      id: 'el-name',
      type: 'text',
      x: 10,
      y: 20,
      text: 'Your Name',
      fontFamily: 'Playfair Display',
      fontSize: 28,
      color: '#1a1a1a',
      fontWeight: 700,
      letterSpacing: 0,
    },
    {
      id: 'el-subtitle',
      type: 'text',
      x: 10,
      y: 58,
      text: 'Job Title or Tagline',
      fontFamily: 'Inter',
      fontSize: 14,
      color: '#555555',
      fontWeight: 400,
      letterSpacing: 1,
    },
  ],
}

const A5_FOLDED_DESIGN = {
  background: '#f8f4ef',
  elements: [
    {
      id: 'el-name',
      type: 'text',
      x: 15,
      y: 30,
      text: 'Studio Twaalf',
      fontFamily: 'Montserrat',
      fontSize: 32,
      color: '#2d2d2d',
      fontWeight: 700,
      letterSpacing: 2,
    },
    {
      id: 'el-subtitle',
      type: 'text',
      x: 15,
      y: 75,
      text: 'Custom print & design studio',
      fontFamily: 'Open Sans',
      fontSize: 16,
      color: '#666666',
      fontWeight: 400,
      letterSpacing: 0.5,
    },
  ],
}

async function main() {
  console.log('Seeding demo templates...')

  const a6 = await prisma.template.upsert({
    where: { id: 'seed-template-a6-single' },
    update: {
      name: 'A6 Business Card (Single)',
      description: 'Clean single-sided A6 card template.',
      category: 'business-card',
      widthMm: 105,
      heightMm: 148,
      defaultDesignJson: A6_SINGLE_DESIGN,
    },
    create: {
      id: 'seed-template-a6-single',
      name: 'A6 Business Card (Single)',
      description: 'Clean single-sided A6 card template.',
      category: 'business-card',
      widthMm: 105,
      heightMm: 148,
      defaultDesignJson: A6_SINGLE_DESIGN,
    },
  })

  const a5 = await prisma.template.upsert({
    where: { id: 'seed-template-a5-folded' },
    update: {
      name: 'A5 Folded Card',
      description: 'A5 folded greeting or invite card.',
      category: 'card',
      widthMm: 148,
      heightMm: 210,
      defaultDesignJson: A5_FOLDED_DESIGN,
    },
    create: {
      id: 'seed-template-a5-folded',
      name: 'A5 Folded Card',
      description: 'A5 folded greeting or invite card.',
      category: 'card',
      widthMm: 148,
      heightMm: 210,
      defaultDesignJson: A5_FOLDED_DESIGN,
    },
  })

  console.log(`  ✓ ${a6.name} (${a6.id})`)
  console.log(`  ✓ ${a5.name} (${a5.id})`)

  // ── Legacy gadget products (keep for backward compat) ──────────────────────

  console.log('\nSeeding legacy gadget products...')

  const gadgets: Array<{
    id: string
    name: string
    type: GadgetType
    basePriceCents: number
    previewConfigJson: object
  }> = [
    {
      id: 'seed-gadget-rond-sticker',
      name: 'Rond sticker',
      type: GadgetType.STICKER,
      basePriceCents: 75,
      previewConfigJson: {
        shape: 'circle',
        diameterMm: 45,
        textPosition: { x: 50, y: 50 },
        textAnchor: 'center',
      },
    },
    {
      id: 'seed-gadget-rechthoekig-label',
      name: 'Rechthoekig label',
      type: GadgetType.LABEL,
      basePriceCents: 60,
      previewConfigJson: {
        shape: 'rectangle',
        widthMm: 60,
        heightMm: 40,
        textPosition: { x: 50, y: 50 },
        textAnchor: 'center',
      },
    },
    {
      id: 'seed-gadget-bedankkaartje',
      name: 'Bedankkaartje',
      type: GadgetType.KAARTJE,
      basePriceCents: 120,
      previewConfigJson: {
        shape: 'rectangle',
        widthMm: 85,
        heightMm: 55,
        textPosition: { x: 50, y: 40 },
        textAnchor: 'center',
      },
    },
    {
      id: 'seed-gadget-sleutelhanger',
      name: 'Sleutelhanger',
      type: GadgetType.SLEUTELHANGER,
      basePriceCents: 250,
      previewConfigJson: {
        shape: 'custom',
        widthMm: 35,
        heightMm: 55,
        textPosition: { x: 50, y: 55 },
        textAnchor: 'center',
      },
    },
  ]

  for (const g of gadgets) {
    const result = await prisma.gadgetProduct.upsert({
      where: { id: g.id },
      update: {
        name: g.name,
        type: g.type,
        basePriceCents: g.basePriceCents,
        previewConfigJson: g.previewConfigJson,
        isActive: true,
      },
      create: {
        id: g.id,
        name: g.name,
        type: g.type,
        basePriceCents: g.basePriceCents,
        imageUrl: null,
        previewConfigJson: g.previewConfigJson,
        isActive: true,
      },
    })
    console.log(`  ✓ ${result.name} (${result.type}, €${(result.basePriceCents / 100).toFixed(2)})`)
  }

  // ── Shop catalogue ─────────────────────────────────────────────────────────

  console.log('\nSeeding shop catalogue...')

  // ── Categories ─────────────────────────────────────────────────────────────

  const categoryData = [
    { id: 'seed-cat-stickers',   slug: 'stickers',   nameNl: 'Stickers',    sortOrder: 1 },
    { id: 'seed-cat-labels',     slug: 'labels',     nameNl: 'Labels',      sortOrder: 2 },
    { id: 'seed-cat-kaartjes',   slug: 'kaartjes',   nameNl: 'Kaartjes',    sortOrder: 3 },
    { id: 'seed-cat-doopsuiker', slug: 'doopsuiker', nameNl: 'Doopsuiker',  sortOrder: 4 },
    { id: 'seed-cat-bedankjes',  slug: 'bedankjes',  nameNl: 'Bedankjes',   sortOrder: 5 },
  ]

  const categories: Record<string, string> = {}
  for (const c of categoryData) {
    const result = await prisma.category.upsert({
      where: { id: c.id },
      update: { nameNl: c.nameNl, slug: c.slug, sortOrder: c.sortOrder, isActive: true },
      create: { id: c.id, slug: c.slug, nameNl: c.nameNl, sortOrder: c.sortOrder, isActive: true },
    })
    categories[c.slug] = result.id
    console.log(`  ✓ Categorie: ${result.nameNl}`)
  }

  // ── Products ───────────────────────────────────────────────────────────────

  type ProductSeed = {
    id: string
    slug: string
    nameNl: string
    descriptionNl: string
    basePriceCents: number
    isPersonalizable: boolean
    sortOrder: number
    categorySlug: string
    emoji: string
    channels: string[]
    options?: Array<{
      id: string
      nameNl: string
      type: 'DROPDOWN' | 'TEXT' | 'NUMBER'
      isRequired: boolean
      sortOrder: number
      values: Array<{
        id: string
        valueNl: string
        priceDeltaCents?: number
        sortOrder: number
      }>
    }>
  }

  const productData: ProductSeed[] = [
    // ── Stickers ────────────────────────────────────────────────────────────
    {
      id: 'seed-prod-sticker-rond',
      slug: 'sticker-rond',
      nameNl: 'Stickers rond',
      descriptionNl: 'Ronde stickers met babynaam en geboortedatum. Ideaal op snoepzakjes of doosjes.',
      basePriceCents: 1900,
      isPersonalizable: true,
      sortOrder: 1,
      categorySlug: 'stickers',
      emoji: '🔵',
      channels: ['GADGETS'],
      options: [
        {
          id: 'seed-opt-sticker-rond-formaat',
          nameNl: 'Formaat',
          type: 'DROPDOWN',
          isRequired: true,
          sortOrder: 0,
          values: [
            { id: 'seed-val-sticker-rond-a6', valueNl: 'A6 (10,5 × 14,8 cm)', sortOrder: 0 },
            { id: 'seed-val-sticker-rond-a7', valueNl: 'A7 (7,4 × 10,5 cm)',  sortOrder: 1 },
          ],
        },
        {
          id: 'seed-opt-sticker-rond-afwerking',
          nameNl: 'Afwerking',
          type: 'DROPDOWN',
          isRequired: false,
          sortOrder: 1,
          values: [
            { id: 'seed-val-sticker-rond-mat',   valueNl: 'Mat',   sortOrder: 0 },
            { id: 'seed-val-sticker-rond-glans',  valueNl: 'Glans', sortOrder: 1, priceDeltaCents: 200 },
          ],
        },
      ],
    },
    {
      id: 'seed-prod-sticker-vierkant',
      slug: 'sticker-vierkant',
      nameNl: 'Stickers vierkant',
      descriptionNl: 'Vierkante stickers in elk formaat. Perfect voor alle verpakkingen.',
      basePriceCents: 1900,
      isPersonalizable: true,
      sortOrder: 2,
      categorySlug: 'stickers',
      emoji: '🟦',
      channels: ['GADGETS'],
      options: [
        {
          id: 'seed-opt-sticker-vier-formaat',
          nameNl: 'Formaat',
          type: 'DROPDOWN',
          isRequired: true,
          sortOrder: 0,
          values: [
            { id: 'seed-val-sticker-vier-a5', valueNl: 'A5 (14,8 × 21 cm)',   sortOrder: 0 },
            { id: 'seed-val-sticker-vier-a6', valueNl: 'A6 (10,5 × 14,8 cm)', sortOrder: 1 },
            { id: 'seed-val-sticker-vier-a7', valueNl: 'A7 (7,4 × 10,5 cm)',  sortOrder: 2 },
          ],
        },
        {
          id: 'seed-opt-sticker-vier-afwerking',
          nameNl: 'Afwerking',
          type: 'DROPDOWN',
          isRequired: false,
          sortOrder: 1,
          values: [
            { id: 'seed-val-sticker-vier-mat',   valueNl: 'Mat',   sortOrder: 0 },
            { id: 'seed-val-sticker-vier-glans',  valueNl: 'Glans', sortOrder: 1, priceDeltaCents: 200 },
          ],
        },
      ],
    },
    {
      id: 'seed-prod-magneten',
      slug: 'magneten',
      nameNl: 'Magneten',
      descriptionNl: 'Gepersonaliseerde magneten als blijvend aandenken. Makkelijk op de koelkast te bevestigen.',
      basePriceCents: 2900,
      isPersonalizable: true,
      sortOrder: 3,
      categorySlug: 'stickers',
      emoji: '🧲',
      channels: ['GADGETS'],
    },

    // ── Labels ──────────────────────────────────────────────────────────────
    {
      id: 'seed-prod-labels',
      slug: 'labels',
      nameNl: 'Labels',
      descriptionNl: 'Gepersonaliseerde labels om aan te bevestigen. Charmant detail bij elk kadootje.',
      basePriceCents: 2400,
      isPersonalizable: true,
      sortOrder: 1,
      categorySlug: 'labels',
      emoji: '🏷️',
      channels: ['GADGETS'],
      options: [
        {
          id: 'seed-opt-labels-vorm',
          nameNl: 'Vorm',
          type: 'DROPDOWN',
          isRequired: true,
          sortOrder: 0,
          values: [
            { id: 'seed-val-labels-rond',      valueNl: 'Rond',       sortOrder: 0 },
            { id: 'seed-val-labels-rechthoek', valueNl: 'Rechthoek',  sortOrder: 1 },
          ],
        },
      ],
    },
    {
      id: 'seed-prod-lint',
      slug: 'lint',
      nameNl: 'Bedrukt lint',
      descriptionNl: 'Satijnen lint met naam of tekst, ideaal als finishing touch op een doosje of kadootje.',
      basePriceCents: 1500,
      isPersonalizable: true,
      sortOrder: 2,
      categorySlug: 'labels',
      emoji: '🎀',
      channels: ['GADGETS'],
    },

    // ── Kaartjes ────────────────────────────────────────────────────────────
    {
      id: 'seed-prod-kaartjes',
      slug: 'kaartjes',
      nameNl: 'Bedankkaartjes',
      descriptionNl: 'Kleine bedankkaartjes met een persoonlijke boodschap van het kindje.',
      basePriceCents: 2900,
      isPersonalizable: true,
      sortOrder: 1,
      categorySlug: 'kaartjes',
      emoji: '💌',
      channels: ['GADGETS'],
    },
    {
      id: 'seed-prod-wenskaartje',
      slug: 'wenskaartje',
      nameNl: 'Wenskaartje',
      descriptionNl: 'Prachtig wenskaartje passend bij het geboorte thema. Met envelop.',
      basePriceCents: 3900,
      isPersonalizable: true,
      sortOrder: 2,
      categorySlug: 'kaartjes',
      emoji: '📬',
      channels: ['GADGETS'],
    },

    // ── Doopsuiker ──────────────────────────────────────────────────────────
    {
      id: 'seed-prod-doopsuiker-doosje',
      slug: 'doopsuiker-doosje',
      nameNl: 'Doopsuiker doosje',
      descriptionNl: 'Gepersonaliseerde doosjes voor doopsuiker of snoepjes. Klaar om uit te delen.',
      basePriceCents: 4900,
      isPersonalizable: true,
      sortOrder: 1,
      categorySlug: 'doopsuiker',
      emoji: '🍬',
      channels: ['GADGETS'],
      options: [
        {
          id: 'seed-opt-doopsuiker-gewicht',
          nameNl: 'Gewicht',
          type: 'DROPDOWN',
          isRequired: true,
          sortOrder: 0,
          values: [
            { id: 'seed-val-doopsuiker-50g',  valueNl: '50 g',  sortOrder: 0 },
            { id: 'seed-val-doopsuiker-100g', valueNl: '100 g', sortOrder: 1, priceDeltaCents: 500 },
          ],
        },
        {
          id: 'seed-opt-doopsuiker-kleur',
          nameNl: 'Kleur suiker',
          type: 'DROPDOWN',
          isRequired: true,
          sortOrder: 1,
          values: [
            { id: 'seed-val-doopsuiker-wit',  valueNl: 'Wit',  sortOrder: 0 },
            { id: 'seed-val-doopsuiker-zand', valueNl: 'Zand', sortOrder: 1 },
            { id: 'seed-val-doopsuiker-roze', valueNl: 'Roze', sortOrder: 2 },
          ],
        },
      ],
    },
    {
      id: 'seed-prod-doopsuiker-zakje',
      slug: 'doopsuiker-zakje',
      nameNl: 'Doopsuiker zakje',
      descriptionNl: 'Transparante zakjes met gepersonaliseerd label. Vul ze zelf met doopsuiker.',
      basePriceCents: 2500,
      isPersonalizable: true,
      sortOrder: 2,
      categorySlug: 'doopsuiker',
      emoji: '🎁',
      channels: ['GADGETS'],
    },

    // ── Bedankjes ────────────────────────────────────────────────────────────
    {
      id: 'seed-prod-bedankje',
      slug: 'bedankje',
      nameNl: 'Bedankpakketje',
      descriptionNl: 'Een compleet bedankpakketje voor een onvergetelijke herinnering.',
      basePriceCents: 3900,
      isPersonalizable: true,
      sortOrder: 1,
      categorySlug: 'bedankjes',
      emoji: '🎀',
      channels: ['GADGETS'],
    },
    {
      id: 'seed-prod-sleutelhanger',
      slug: 'sleutelhanger',
      nameNl: 'Sleutelhanger',
      descriptionNl: 'Gepersonaliseerde acryl sleutelhanger met babynaam. Blijft jaren mooi.',
      basePriceCents: 3500,
      isPersonalizable: true,
      sortOrder: 2,
      categorySlug: 'bedankjes',
      emoji: '🔑',
      channels: ['GADGETS'],
    },
  ]

  for (const p of productData) {
    const product = await prisma.product.upsert({
      where: { id: p.id },
      update: {
        slug: p.slug,
        nameNl: p.nameNl,
        descriptionNl: p.descriptionNl,
        basePriceCents: p.basePriceCents,
        isPersonalizable: p.isPersonalizable,
        isActive: true,
        sortOrder: p.sortOrder,
        categoryId: categories[p.categorySlug],
        channels: p.channels,
      },
      create: {
        id: p.id,
        slug: p.slug,
        nameNl: p.nameNl,
        descriptionNl: p.descriptionNl,
        basePriceCents: p.basePriceCents,
        isPersonalizable: p.isPersonalizable,
        isActive: true,
        sortOrder: p.sortOrder,
        categoryId: categories[p.categorySlug],
        channels: p.channels,
      },
    })

    // Upsert primary asset (emoji placeholder)
    const assetId = `${p.id}-asset-main`
    await prisma.productAsset.upsert({
      where: { id: assetId },
      update: { url: p.emoji, altNl: p.nameNl, sortOrder: 0 },
      create: { id: assetId, productId: product.id, url: p.emoji, altNl: p.nameNl, sortOrder: 0 },
    })

    // Upsert options + values
    if (p.options) {
      for (const opt of p.options) {
        await prisma.productOption.upsert({
          where: { id: opt.id },
          update: {
            nameNl: opt.nameNl,
            type: opt.type,
            isRequired: opt.isRequired,
            sortOrder: opt.sortOrder,
          },
          create: {
            id: opt.id,
            productId: product.id,
            nameNl: opt.nameNl,
            type: opt.type,
            isRequired: opt.isRequired,
            sortOrder: opt.sortOrder,
          },
        })

        for (const val of opt.values) {
          await prisma.productOptionValue.upsert({
            where: { id: val.id },
            update: {
              valueNl: val.valueNl,
              priceDeltaCents: val.priceDeltaCents ?? null,
              sortOrder: val.sortOrder,
              isActive: true,
            },
            create: {
              id: val.id,
              optionId: opt.id,
              valueNl: val.valueNl,
              priceDeltaCents: val.priceDeltaCents ?? null,
              sortOrder: val.sortOrder,
              isActive: true,
            },
          })
        }
      }
    }

    const optCount = p.options?.length ?? 0
    console.log(
      `  ✓ Product: ${product.nameNl} (€${(product.basePriceCents / 100).toFixed(2)})` +
      (optCount > 0 ? ` [${optCount} opties]` : ''),
    )
  }

  console.log('\nDone.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
