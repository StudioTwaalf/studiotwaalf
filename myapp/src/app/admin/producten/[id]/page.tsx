import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { parseProductDimensions } from '@/lib/product-dimensions'
import ImageUploadField from '@/components/admin/ImageUploadField'
import DeleteProductButton from '@/components/admin/DeleteProductButton'
import { updateProductAction, deleteProductAction, savePersonalizationAction, duplicateVariantAction, toggleDIYLinkAction } from './actions'

interface Props {
  params:       { id: string }
  searchParams: { saved?: string; nieuw?: string }
}

// ─── Default personalization schema template ──────────────────────────────────
const DEFAULT_SCHEMA = JSON.stringify({
  fields: [
    { key: 'naam', label: 'Naam', type: 'text', required: true, maxLength: 40 },
  ],
}, null, 2)

export default async function EditProductPage({ params, searchParams }: Props) {
  const [product, categories, diyTemplates] = await Promise.all([
    prisma.product.findUnique({
      where:   { id: params.id },
      include: {
        category:                true,
        assets:                  { orderBy: { sortOrder: 'asc' } },
        variants:                { orderBy: { sortOrder: 'asc' } },
        personalizationTemplates: true,
      },
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { nameNl: 'asc' } }),
    prisma.template.findMany({
      where:   { status: 'active' },
      orderBy: { name: 'asc' },
      select:  { id: true, name: true, category: true },
    }),
  ])

  if (!product) notFound()

  const dims          = parseProductDimensions(product.configJson)
  const imageUrl      = product.assets[0]?.url ?? ''
  const persTemplate  = product.personalizationTemplates[0] ?? null
  const schemaJson    = persTemplate
    ? JSON.stringify(persTemplate.schemaJson, null, 2)
    : DEFAULT_SCHEMA

  const boundUpdate      = updateProductAction.bind(null, product.id)
  const boundDelete      = deleteProductAction.bind(null, product.id)
  const boundSavePers    = savePersonalizationAction.bind(null, product.id)

  return (
    <div>

      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-5">
        <Link href="/admin/producten" className="hover:text-gray-700 transition-colors">Producten</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 font-medium truncate max-w-[220px]">{product.nameNl}</span>
      </nav>

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {(searchParams.saved || searchParams.nieuw) && (
        <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {searchParams.nieuw ? 'Product aangemaakt — vul de details in.' : 'Wijzigingen opgeslagen'}
        </div>
      )}

      {/* ── Main 2-col grid ──────────────────────────────────────────────── */}
      <form action={boundUpdate}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-6 items-start">

          {/* ── LEFT COLUMN ────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* ▸ Basisinformatie */}
            <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Basisinformatie</h2>
              </div>
              <div className="px-6 py-5 space-y-4">

                <div>
                  <label htmlFor="nameNl" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Naam <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="nameNl" name="nameNl" type="text" required
                    defaultValue={product.nameNl}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                  />
                </div>

                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1.5">
                    URL-slug
                  </label>
                  <input
                    id="slug" name="slug" type="text"
                    defaultValue={product.slug}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                               font-mono focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                  />
                  <p className="text-xs text-gray-400 mt-1">Wordt gebruikt in <span className="font-mono">/webshop/{product.slug}</span></p>
                </div>

                <div>
                  <label htmlFor="descriptionNl" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Beschrijving
                  </label>
                  <textarea
                    id="descriptionNl" name="descriptionNl" rows={4}
                    defaultValue={product.descriptionNl ?? ''}
                    placeholder="Beschrijf het product — wat het is, hoe het gemaakt wordt, gebruik…"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white resize-none
                               focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                      Categorie <span className="text-red-400">*</span>
                    </label>
                    <Link
                      href="/admin/producten/categorieen"
                      className="text-[11px] text-[#8B6F3E] hover:text-[#6B5230] transition-colors"
                    >
                      Beheer categorieën →
                    </Link>
                  </div>
                  <select
                    id="categoryId" name="categoryId" required
                    defaultValue={product.categoryId}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameNl}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* ▸ Afbeeldingen */}
            <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Afbeeldingen</h2>
                <p className="text-xs text-gray-400 mt-0.5">Thumbnail verschijnt in de webshop. Mockup wordt gebruikt in de DIY tool.</p>
              </div>
              <div className="px-6 py-5 space-y-5">
                <ImageUploadField
                  name="thumbnailImageUrl"
                  defaultValue={product.thumbnailImageUrl ?? imageUrl}
                  label="Thumbnail — webshop"
                  hint="Productfoto voor de shopkaart en detailpagina (JPEG / PNG / WebP)"
                  accept="image/jpeg,image/png,image/webp"
                />
                <div className="border-t border-gray-100 pt-5">
                  <ImageUploadField
                    name="mockupImageUrl"
                    defaultValue={product.mockupImageUrl ?? ''}
                    label="Mockup — DIY tool"
                    hint="Transparante PNG voor de concept mockup. Wordt niet getoond in de webshop."
                    accept="image/png"
                  />
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Afbeelding URL <span className="text-xs text-gray-400 font-normal">(fallback)</span>
                  </label>
                  <input
                    id="imageUrl" name="imageUrl" type="text"
                    defaultValue={imageUrl}
                    placeholder="https://…"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                  />
                  <p className="text-xs text-gray-400 mt-1">Wordt ook als eerste product-asset opgeslagen.</p>
                </div>
              </div>
            </section>

            {/* ▸ Afmetingen */}
            <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Afmetingen</h2>
                <p className="text-xs text-gray-400 mt-0.5">Fysieke afmetingen voor mockup schaling in de DIY tool.</p>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'widthMm',  label: 'Breedte (mm)', val: dims?.widthMm },
                    { id: 'heightMm', label: 'Hoogte (mm)',  val: dims?.heightMm },
                    { id: 'depthMm',  label: 'Diepte (mm)',  val: dims?.depthMm, opt: true },
                  ].map(({ id, label, val, opt }) => (
                    <div key={id}>
                      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
                        {label} {opt && <span className="text-gray-400 text-xs font-normal">opt.</span>}
                      </label>
                      <input
                        id={id} name={id} type="number" step="0.1" min="0"
                        defaultValue={val ?? ''}
                        placeholder="—"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                                   focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="mockupScale" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Mockup schaal <span className="text-gray-400 text-xs font-normal">0.3–3.0</span>
                    </label>
                    <input
                      id="mockupScale" name="mockupScale" type="number"
                      step="0.05" min="0.3" max="3.0"
                      defaultValue={dims?.mockupScale ?? 1.0}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                                 focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                    />
                  </div>
                  <div>
                    <label htmlFor="visualPadding" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Transparante marge <span className="text-gray-400 text-xs font-normal">0–0.45</span>
                    </label>
                    <input
                      id="visualPadding" name="visualPadding" type="number"
                      step="0.01" min="0" max="0.45"
                      defaultValue={dims?.visualPadding ?? 0}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                                 focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                    />
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* ── RIGHT COLUMN ───────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* ▸ Status & verkoop */}
            <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Status & verkoop</h2>
              </div>
              <div className="px-5 py-4 space-y-2.5">
                {[
                  { name: 'isActive',        label: 'Actief',                hint: 'Product is actief en bruikbaar',                                        val: product.isActive },
                  { name: 'isVisibleInShop', label: 'Zichtbaar in webshop', hint: 'Toon op de publieke webshop',                                            val: product.isVisibleInShop },
                  { name: 'isVisibleInDIY',  label: 'Zichtbaar in DIY tool', hint: 'Selecteerbaar in de gadgetpicker',                                       val: product.isVisibleInDIY },
                  { name: 'isPersonalizable',label: 'Personaliseerbaar',     hint: 'Klant kan tekst of data toevoegen',                                      val: product.isPersonalizable },
                  { name: 'requiresDiyFlow', label: 'Vereist DIY flow',      hint: 'Webshop toont DIY-doorverwijzing i.p.v. direct personalisatieformulier', val: product.requiresDiyFlow },
                ].map((item) => (
                  <label key={item.name}
                    className="flex items-start gap-3 p-3 rounded-xl border border-gray-100
                               cursor-pointer hover:bg-gray-50/70 transition-colors"
                  >
                    <input
                      type="checkbox" name={item.name} defaultChecked={item.val}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#C4A040]
                                 focus:ring-[#C4A040]/30 focus:ring-2"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-700 leading-tight">{item.label}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{item.hint}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* ▸ Prijs & voorraad */}
            <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Prijs & voorraad</h2>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div>
                  <label htmlFor="basePriceCents" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Basisprijs (€) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
                    <input
                      id="basePriceCents" name="basePriceCents" type="number"
                      step="0.01" min="0" required
                      defaultValue={(product.basePriceCents / 100).toFixed(2)}
                      className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                                 focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Individuele varianten kunnen een eigen prijs krijgen.</p>
                </div>

                <div>
                  <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Voorraad <span className="text-gray-400 text-xs font-normal">(leeg = onbeperkt)</span>
                  </label>
                  <input
                    id="stockQuantity" name="stockQuantity" type="number" min="0"
                    defaultValue={product.stockQuantity ?? ''}
                    placeholder="∞"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">0 = op bestelling · leeg = geen limiet</p>
                </div>

                <div>
                  <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Volgorde
                  </label>
                  <input
                    id="sortOrder" name="sortOrder" type="number"
                    defaultValue={product.sortOrder}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                  />
                </div>
              </div>
            </section>

            {/* ▸ DIY flow — template koppeling */}
            {product.requiresDiyFlow && (
              <section className="bg-white rounded-2xl border border-[#E8D9BC] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#F0E8D4] bg-[#FAF7F0]">
                  <h2 className="text-sm font-semibold text-[#6B4F2A]">DIY flow — doorverwijzing</h2>
                  <p className="text-xs text-[#A08060] mt-0.5">
                    Kies het template waarnaar klanten doorgestuurd worden.
                  </p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div>
                    <label htmlFor="diyTemplateId" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Template <span className="text-xs text-gray-400 font-normal">(optioneel)</span>
                    </label>
                    <select
                      id="diyTemplateId" name="diyTemplateId"
                      defaultValue={product.diyTemplateId ?? ''}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                                 focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                    >
                      <option value="">— Algemene templates pagina —</option>
                      {diyTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.category ? `${t.category} — ` : ''}{t.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Leeg = klant gaat naar <span className="font-mono">/templates</span>. Met template = direct naar het concept.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* ▸ Opslaan */}
            <div className="space-y-2">
              <button
                type="submit"
                className="w-full bg-[#2C2416] text-white text-sm font-semibold px-5 py-3
                           rounded-xl hover:bg-[#3C3020] transition-colors"
              >
                Wijzigingen opslaan
              </button>
              <Link
                href="/admin/producten"
                className="block w-full text-center text-sm text-gray-500 hover:text-gray-700
                           transition-colors py-1"
              >
                Terug naar overzicht
              </Link>
            </div>

            {/* ▸ Info */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Info</h2>
              </div>
              <dl className="px-5 py-4 space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <dt className="text-gray-400 text-xs">ID</dt>
                  <dd className="font-mono text-[10px] text-gray-500 truncate max-w-[130px]" title={product.id}>{product.id}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-gray-400 text-xs">Aangemaakt</dt>
                  <dd className="text-xs text-gray-600">
                    {new Date(product.createdAt).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-gray-400 text-xs">Varianten</dt>
                  <dd className="text-xs text-gray-600">{product.variants.length}</dd>
                </div>
              </dl>
            </div>

            {/* ▸ Koppeling met DIY tool */}
            <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">DIY tool koppeling</h2>
                <p className="text-xs text-gray-400 mt-0.5">Zichtbaar als gadget in de DIY gadgetpicker</p>
              </div>
              <div className="px-5 py-4">
                {product.isVisibleInDIY ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      <span className="text-sm font-medium text-green-700">Gekoppeld aan DIY tool</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Dit product verschijnt als gadget in de DIY tool. Mockup-instellingen beheer je via de gadget editor.
                    </p>
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/admin/gadgets/${product.id}`}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-medium
                                   border border-gray-200 bg-white hover:bg-gray-50 text-gray-700
                                   px-3 py-2 rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open gadget editor
                      </Link>
                      <form action={toggleDIYLinkAction.bind(null, product.id, false)}>
                        <button
                          type="submit"
                          className="w-full text-xs text-gray-400 hover:text-gray-600 py-1.5
                                     underline transition-colors"
                        >
                          Ontkoppelen van DIY tool
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                      <span className="text-sm text-gray-500">Niet gekoppeld</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Koppel dit product aan de DIY tool zodat het als gadget beschikbaar is in de gadgetpicker en mockup.
                    </p>
                    <form action={toggleDIYLinkAction.bind(null, product.id, true)}>
                      <button
                        type="submit"
                        className="w-full text-xs font-medium text-[#8B6F3E] hover:text-[#6B5230]
                                   border border-[#E8D9BC] bg-[#FAF5EA] hover:bg-[#F5EDD8]
                                   px-3 py-2 rounded-lg transition-colors"
                      >
                        Koppelen aan DIY tool
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </section>

            {/* ▸ Danger */}
            <DeleteProductButton
              boundAction={boundDelete}
              productName={product.nameNl}
            />

          </div>
        </div>
      </form>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* VARIANTEN — outside main form */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section id="varianten" className="mt-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Varianten</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {product.variants.length > 0
                ? `${product.variants.length} variant${product.variants.length !== 1 ? 'en' : ''} — kleur, maat of andere opties`
                : 'Kleur- of maatopties voor dit product'}
            </p>
          </div>
          <Link
            href={`/admin/producten/${product.id}/variants/new`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B6F3E]
                       hover:text-[#6B5230] border border-[#E8D9BC] bg-[#FAF5EA] hover:bg-[#F5EDD8]
                       px-3 py-2 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Variant toevoegen
          </Link>
        </div>

        {product.variants.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-gray-400">
              Nog geen varianten.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Voeg varianten toe voor verschillende kleuren, maten of uitvoeringen.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {product.variants.map((v) => {
              const dimStr = v.widthMm && v.heightMm
                ? `${v.widthMm}×${v.heightMm}${v.depthMm ? `×${v.depthMm}` : ''} mm`
                : null
              const displayLabel = [v.name, v.sizeLabel ?? dimStr].filter(Boolean).join(' / ') || 'Naamloos'

              return (
                <div key={v.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/70 transition-colors">

                  {/* Thumbnail / swatch */}
                  <div className="w-11 h-11 rounded-xl border border-gray-100 bg-[#FAF8F5]
                                  overflow-hidden flex items-center justify-center shrink-0">
                    {v.thumbnailImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.thumbnailImageUrl} alt="" className="w-full h-full object-contain" />
                    ) : v.color ? (
                      <span className="w-6 h-6 rounded-full border border-gray-200 block"
                        style={{ backgroundColor: v.color }} />
                    ) : (
                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
                      </svg>
                    )}
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {v.color && (
                        <span className="w-3 h-3 rounded-full border border-gray-200 shrink-0"
                          style={{ backgroundColor: v.color }} />
                      )}
                      <span className="text-sm font-medium text-gray-900">{displayLabel}</span>
                      {v.isDefault && (
                        <span className="text-[10px] font-semibold text-[#8B6F3E] bg-[#F5EDD8] px-1.5 py-0.5 rounded-full">
                          Standaard
                        </span>
                      )}
                      {!v.isActive && (
                        <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                          Inactief
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {v.priceCents !== null && v.priceCents !== undefined
                        ? `€${(v.priceCents / 100).toFixed(2)}`
                        : `€${(product.basePriceCents / 100).toFixed(2)} (basis)`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Duplicate */}
                    <form action={duplicateVariantAction.bind(null, product.id, v.id)}>
                      <button
                        type="submit"
                        title="Dupliceer variant"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100
                                   transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </form>
                    {/* Edit */}
                    <Link
                      href={`/admin/producten/${product.id}/variants/${v.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-gray-500
                                 hover:text-gray-900 border border-gray-200 bg-white hover:bg-gray-50
                                 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Bewerken
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PERSONALISATIE — separate form + section */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="mt-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Personalisatie</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Definieer welke velden de klant kan invullen bij dit product.
          </p>
        </div>
        <form action={boundSavePers}>
          <div className="px-6 py-5 space-y-4">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100
                              cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox" name="isPersonalizable" defaultChecked={product.isPersonalizable}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#C4A040]
                           focus:ring-[#C4A040]/30 focus:ring-2"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">Personaliseerbaar</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Klant ziet personalisatievelden bij het toevoegen aan de winkelwagen.
                </p>
              </div>
            </label>

            <div>
              <label htmlFor="schemaJson" className="block text-sm font-medium text-gray-700 mb-1.5">
                Personalisatieschema <span className="text-gray-400 text-xs font-normal">(JSON)</span>
              </label>
              <textarea
                id="schemaJson" name="schemaJson" rows={12}
                defaultValue={schemaJson}
                spellCheck={false}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-xs bg-[#FAF9F7]
                           font-mono resize-y focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30
                           focus:border-[#C4A040]"
              />
              <p className="text-[11px] text-gray-400 mt-1.5">
                Elk veld heeft een <code className="bg-gray-100 px-1 rounded text-[10px]">key</code>,{' '}
                <code className="bg-gray-100 px-1 rounded text-[10px]">label</code>,{' '}
                <code className="bg-gray-100 px-1 rounded text-[10px]">type</code> (text / textarea / select) en optioneel{' '}
                <code className="bg-gray-100 px-1 rounded text-[10px]">required</code> + <code className="bg-gray-100 px-1 rounded text-[10px]">maxLength</code>.
              </p>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <button
                type="submit"
                className="bg-[#2C2416] text-white text-sm font-medium px-5 py-2.5 rounded-xl
                           hover:bg-[#3C3020] transition-colors"
              >
                Personalisatie opslaan
              </button>
            </div>
          </div>
        </form>
      </section>

    </div>
  )
}
