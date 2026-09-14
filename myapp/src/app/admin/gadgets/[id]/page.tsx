import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { parseProductDimensions } from '@/lib/product-dimensions'
import { updateGadgetAction, deleteGadgetAction, toggleShopLinkAction } from './actions'
import ImageUploadField from '@/components/admin/ImageUploadField'
import VariantActionsRow from '@/components/admin/VariantActionsRow'

interface Props {
  params:       { id: string }
  searchParams: { saved?: string }
}

export default async function EditGadgetPage({ params, searchParams }: Props) {
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where:   { id: params.id },
      include: {
        category: true,
        assets: { take: 1, orderBy: { sortOrder: 'asc' } },
        variants: { orderBy: { sortOrder: 'asc' } },
      },
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { nameNl: 'asc' } }),
  ])

  if (!product) notFound()

  const dims     = parseProductDimensions(product.configJson)
  const imageUrl = product.assets[0]?.url ?? ''
  const boundUpdate = updateGadgetAction.bind(null, product.id)
  const boundDelete = deleteGadgetAction.bind(null, product.id)

  return (
    <div className="max-w-3xl">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/admin/gadgets" className="hover:text-gray-600 transition-colors">Gadgets</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium truncate max-w-xs">{product.nameNl}</span>
      </nav>

      {searchParams.saved && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700">
          ✓ Wijzigingen opgeslagen
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">
        {/* Main form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h1 className="text-lg font-semibold text-gray-900 mb-6">Gadget bewerken</h1>

          <form action={boundUpdate} className="space-y-8">
            {/* Basisinformatie */}
            <section>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Basisinformatie
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="nameNl" className="block text-sm font-medium text-gray-700 mb-1">
                      Naam <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="nameNl" name="nameNl" type="text" required
                      defaultValue={product.nameNl}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                      Slug
                    </label>
                    <input
                      id="slug" name="slug" type="text"
                      defaultValue={product.slug}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="descriptionNl" className="block text-sm font-medium text-gray-700 mb-1">
                    Beschrijving
                  </label>
                  <textarea
                    id="descriptionNl" name="descriptionNl" rows={3}
                    defaultValue={product.descriptionNl ?? ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none
                               focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                      Categorie <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="categoryId" name="categoryId" required
                      defaultValue={product.categoryId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.nameNl}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="basePriceCents" className="block text-sm font-medium text-gray-700 mb-1">
                      Prijs (€) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="basePriceCents" name="basePriceCents" type="number"
                      step="0.01" min="0" required
                      defaultValue={(product.basePriceCents / 100).toFixed(2)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
                      Volgorde
                    </label>
                    <input
                      id="sortOrder" name="sortOrder" type="number"
                      defaultValue={product.sortOrder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Afbeeldingen */}
                <div className="space-y-5">
                  <ImageUploadField
                    name="mockupImageUrl"
                    defaultValue={product.mockupImageUrl ?? imageUrl}
                    label="Mockup afbeelding"
                    hint="Wordt gebruikt in de concept mockup weergave — bij voorkeur transparante PNG"
                    accept="image/png,image/jpeg,image/webp"
                  />
                  <ImageUploadField
                    name="thumbnailImageUrl"
                    defaultValue={product.thumbnailImageUrl ?? imageUrl}
                    label="Thumbnail afbeelding"
                    hint="Wordt gebruikt in webshop en gadget overzicht"
                    accept="image/jpeg,image/png,image/webp"
                  />
                  <div>
                    <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                      Afbeelding URL <span className="text-xs text-gray-400">(fallback)</span>
                    </label>
                    <input
                      id="imageUrl" name="imageUrl" type="text"
                      defaultValue={imageUrl}
                      placeholder="https://…"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Wordt gebruikt als mockup en thumbnail ontbreken</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Voorraad <span className="text-xs text-gray-400">(leeg = onbeperkt)</span>
                  </label>
                  <input
                    id="stockQuantity" name="stockQuantity" type="number" min="0"
                    defaultValue={product.stockQuantity ?? ''}
                    placeholder="bijv. 50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">0 = op bestelling · leeg = geen limiet</p>
                </div>
              </div>
            </section>

            {/* Zichtbaarheid */}
            <section>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Zichtbaarheid
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'isActive',         label: 'Actief',                value: product.isActive,         hint: 'Product is zichtbaar en bruikbaar' },
                  { name: 'isVisibleInDIY',   label: 'Zichtbaar in DIY tool', value: product.isVisibleInDIY,   hint: 'Selecteerbaar in de gadgetpicker' },
                  { name: 'isVisibleInShop',  label: 'Zichtbaar in webshop',  value: product.isVisibleInShop,  hint: 'Toon in de publieke webshop' },
                  { name: 'isPersonalizable', label: 'Personaliseerbaar',     value: product.isPersonalizable, hint: 'Laat gebruiker tekst toevoegen' },
                ].map((item) => (
                  <label key={item.name}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox" name={item.name} defaultChecked={item.value}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.hint}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* Afmetingen */}
            <section>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                Afmetingen & mockup
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Fysieke afmetingen in millimeter voor proportionele schaling in de concept mockup.
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="widthMm" className="block text-sm font-medium text-gray-700 mb-1">
                      Breedte (mm)
                    </label>
                    <input
                      id="widthMm" name="widthMm" type="number" step="0.1" min="0.1"
                      defaultValue={dims?.widthMm ?? ''}
                      placeholder="bijv. 50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="heightMm" className="block text-sm font-medium text-gray-700 mb-1">
                      Hoogte (mm)
                    </label>
                    <input
                      id="heightMm" name="heightMm" type="number" step="0.1" min="0.1"
                      defaultValue={dims?.heightMm ?? ''}
                      placeholder="bijv. 30"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="depthMm" className="block text-sm font-medium text-gray-700 mb-1">
                      Diepte (mm) <span className="text-gray-400 text-xs">opt.</span>
                    </label>
                    <input
                      id="depthMm" name="depthMm" type="number" step="0.1" min="0"
                      defaultValue={dims?.depthMm ?? ''}
                      placeholder="bijv. 5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="mockupScale" className="block text-sm font-medium text-gray-700 mb-1">
                      Mockup schaal <span className="text-gray-400 text-xs">(0.3–3.0)</span>
                    </label>
                    <input
                      id="mockupScale" name="mockupScale" type="number"
                      step="0.05" min="0.3" max="3.0"
                      defaultValue={dims?.mockupScale ?? 1.0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="visualPadding" className="block text-sm font-medium text-gray-700 mb-1">
                      Transparante marge <span className="text-gray-400 text-xs">(0–0.45)</span>
                    </label>
                    <input
                      id="visualPadding" name="visualPadding" type="number"
                      step="0.01" min="0" max="0.45"
                      defaultValue={dims?.visualPadding ?? 0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </section>

            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <button
                type="submit"
                className="bg-indigo-600 text-white text-sm font-medium px-5 py-2 rounded-lg
                           hover:bg-indigo-700 transition-colors"
              >
                Opslaan
              </button>
              <Link href="/admin/gadgets" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Terug
              </Link>
            </div>
          </form>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Info</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">ID</dt>
                <dd className="font-mono text-xs text-gray-600 truncate max-w-[120px]">{product.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd className={product.isActive ? 'text-green-600 font-medium' : 'text-gray-400'}>
                  {product.isActive ? 'Actief' : 'Inactief'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Voorraad</dt>
                <dd className={
                  product.stockQuantity === null || product.stockQuantity === undefined
                    ? 'text-gray-400'
                    : product.stockQuantity > 0
                    ? 'text-green-600 font-medium'
                    : 'text-amber-600 font-medium'
                }>
                  {product.stockQuantity === null || product.stockQuantity === undefined
                    ? 'Onbeperkt'
                    : product.stockQuantity > 0
                    ? `${product.stockQuantity} stuks`
                    : 'Op bestelling'}
                </dd>
              </div>
              {dims && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Afmetingen</dt>
                  <dd className="font-mono text-xs text-gray-700">
                    {dims.widthMm}×{dims.heightMm}
                    {dims.depthMm ? `×${dims.depthMm}` : ''} mm
                  </dd>
                </div>
              )}
            </dl>

            {imageUrl && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl} alt={product.nameNl}
                  className="w-full max-h-32 object-contain rounded-lg bg-gray-50"
                />
              </div>
            )}
          </div>

          {/* ▸ Webshop koppeling */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-700">Webshop koppeling</h3>
            </div>
            <div className="px-4 py-3">
              {product.isVisibleInShop ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    <span className="text-xs font-medium text-green-700">Beschikbaar in webshop</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Prijs, thumbnail en beschrijving beheer je via de webshop editor.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <Link
                      href={`/admin/producten/${product.id}`}
                      className="flex items-center justify-center gap-1.5 text-xs font-medium
                                 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700
                                 px-3 py-2 rounded-lg transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open webshop editor
                    </Link>
                    <form action={toggleShopLinkAction.bind(null, product.id, false)}>
                      <button type="submit"
                        className="w-full text-[11px] text-gray-400 hover:text-gray-600 underline py-1 transition-colors">
                        Ontkoppelen van webshop
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                    <span className="text-xs text-gray-500">Niet in webshop</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Maak dit gadget beschikbaar als webshop product.
                  </p>
                  <form action={toggleShopLinkAction.bind(null, product.id, true)}>
                    <button type="submit"
                      className="w-full text-xs font-medium text-[#8B6F3E] hover:text-[#6B5230]
                                 border border-[#E8D9BC] bg-[#FAF5EA] hover:bg-[#F5EDD8]
                                 px-3 py-2 rounded-lg transition-colors">
                      Beschikbaar maken in webshop
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          <form action={boundDelete}>
            <button
              type="submit"
              className="w-full text-center text-sm text-red-600 hover:text-red-700 border border-red-200
                         bg-white hover:bg-red-50 py-2 rounded-lg transition-colors"
            >
              Deactiveren
            </button>
          </form>
        </div>
      </div>

      {/* Varianten */}
      <div id="varianten" className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Varianten</h2>
            {product.variants.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{product.variants.length} variant{product.variants.length !== 1 ? 'en' : ''}</p>
            )}
          </div>
          <Link
            href={`/admin/gadgets/${product.id}/variants/new`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600
                       hover:text-indigo-700 border border-indigo-200 bg-white hover:bg-indigo-50
                       px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Variant toevoegen
          </Link>
        </div>

        {product.variants.length === 0 ? (
          <p className="text-sm text-gray-400">
            Nog geen varianten. Voeg een variant toe voor kleur- of maatopties.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {product.variants.map((v) => {
              // "Roze / 50×130×40 mm" display format
              const dimStr = v.widthMm && v.heightMm
                ? `${v.widthMm}×${v.heightMm}${v.depthMm ? `×${v.depthMm}` : ''} mm`
                : null
              const secondaryLabel = v.sizeLabel ?? dimStr
              const displayLabel = [v.name, secondaryLabel].filter(Boolean).join(' / ') || '—'

              return (
                <div key={v.id} className="flex items-center gap-3 py-3">
                  {/* Thumbnail / color swatch */}
                  <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50
                                  overflow-hidden flex items-center justify-center shrink-0">
                    {v.thumbnailImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.thumbnailImageUrl} alt="" className="w-full h-full object-contain" />
                    ) : v.color ? (
                      <span className="w-5 h-5 rounded-full border border-gray-200"
                        style={{ backgroundColor: v.color }} />
                    ) : (
                      <span className="text-gray-300 text-xs">–</span>
                    )}
                  </div>

                  {/* Label + badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {v.color && (
                        <span className="w-3 h-3 rounded-full border border-gray-200 shrink-0"
                          style={{ backgroundColor: v.color }} />
                      )}
                      <span className="text-sm font-medium text-gray-900">{displayLabel}</span>
                      {v.isDefault && (
                        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50
                                         px-1.5 py-0.5 rounded-full">Standaard</span>
                      )}
                      {!v.isActive && (
                        <span className="text-[10px] font-semibold text-gray-400 bg-gray-100
                                         px-1.5 py-0.5 rounded-full">Inactief</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {v.priceCents !== null && v.priceCents !== undefined
                        ? `€${(v.priceCents / 100).toFixed(2)}`
                        : `€${(product.basePriceCents / 100).toFixed(2)} (basis)`}
                    </p>
                  </div>

                  {/* Inline actions */}
                  <VariantActionsRow
                    productId={product.id}
                    variantId={v.id}
                    variantName={displayLabel}
                    isActive={v.isActive}
                    isDefault={v.isDefault}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
