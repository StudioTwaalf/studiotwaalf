import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ImageUploadField from '@/components/admin/ImageUploadField'
import DeleteProductButton from '@/components/admin/DeleteProductButton'
import { updateVariantAction, deleteVariantAction } from './actions'

interface Props {
  params:       { id: string; variantId: string }
  searchParams: { saved?: string }
}

export default async function EditVariantPage({ params, searchParams }: Props) {
  const [product, variant] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      select: { id: true, nameNl: true, basePriceCents: true },
    }),
    prisma.gadgetVariant.findUnique({
      where: { id: params.variantId },
    }),
  ])

  if (!product || !variant || variant.productId !== product.id) notFound()

  const displayLabel = [variant.name, variant.sizeLabel].filter(Boolean).join(' / ') || 'Naamloos'
  const boundUpdate = updateVariantAction.bind(null, product.id, variant.id)
  const boundDelete = deleteVariantAction.bind(null, product.id, variant.id)

  return (
    <div className="max-w-xl">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
        <Link href="/admin/producten" className="hover:text-gray-700 transition-colors">Producten</Link>
        <span className="text-gray-300">/</span>
        <Link href={`/admin/producten/${product.id}`} className="hover:text-gray-700 transition-colors truncate max-w-[140px]">
          {product.nameNl}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 font-medium">Variant: {displayLabel}</span>
      </nav>

      {searchParams.saved && (
        <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Variant opgeslagen
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-5 items-start">

        {/* Main form */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h1 className="text-base font-semibold text-gray-900">Variant bewerken</h1>
          </div>

          <form action={boundUpdate} className="px-6 py-5 space-y-5">

            {/* Naam + Kleur */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Naam variant
                </label>
                <input
                  id="name" name="name" type="text"
                  defaultValue={variant.name ?? ''}
                  placeholder="bijv. Roze"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                />
              </div>
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Kleur
                </label>
                <input
                  id="color" name="color" type="text"
                  defaultValue={variant.color ?? ''}
                  placeholder="#FBBFD8"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                />
              </div>
            </div>

            {/* Maat label */}
            <div>
              <label htmlFor="sizeLabel" className="block text-sm font-medium text-gray-700 mb-1.5">
                Maatlabel
              </label>
              <input
                id="sizeLabel" name="sizeLabel" type="text"
                defaultValue={variant.sizeLabel ?? ''}
                placeholder="bijv. S / M / L of 50×130 mm"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
              />
            </div>

            {/* Prijs */}
            <div>
              <label htmlFor="priceCents" className="block text-sm font-medium text-gray-700 mb-1.5">
                Prijs (€) <span className="text-gray-400 text-xs font-normal">leeg = basis €{(product.basePriceCents / 100).toFixed(2)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
                <input
                  id="priceCents" name="priceCents" type="number" step="0.01" min="0"
                  defaultValue={variant.priceCents !== null && variant.priceCents !== undefined
                    ? (variant.priceCents / 100).toFixed(2)
                    : ''}
                  placeholder={(product.basePriceCents / 100).toFixed(2)}
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                />
              </div>
            </div>

            {/* Afmetingen */}
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">Afmetingen</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  { id: 'widthMm',  label: 'Breedte (mm)', val: variant.widthMm },
                  { id: 'heightMm', label: 'Hoogte (mm)',  val: variant.heightMm },
                  { id: 'depthMm',  label: 'Diepte (mm)',  val: variant.depthMm },
                ].map(({ id, label, val }) => (
                  <div key={id}>
                    <label htmlFor={id} className="block text-xs text-gray-500 mb-1">{label}</label>
                    <input
                      id={id} name={id} type="number" step="0.1" min="0"
                      defaultValue={val ?? ''}
                      placeholder="—"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white
                                 focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="mockupScale" className="block text-xs text-gray-500 mb-1">Mockup schaal</label>
                  <input
                    id="mockupScale" name="mockupScale" type="number" step="0.05" min="0.3" max="3.0"
                    defaultValue={variant.mockupScale ?? 1.0}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                  />
                </div>
                <div>
                  <label htmlFor="visualPadding" className="block text-xs text-gray-500 mb-1">Transparante marge</label>
                  <input
                    id="visualPadding" name="visualPadding" type="number" step="0.01" min="0" max="0.45"
                    defaultValue={variant.visualPadding ?? 0}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                  />
                </div>
              </div>
            </div>

            {/* Afbeeldingen */}
            <div className="space-y-4 pt-1 border-t border-gray-100">
              <ImageUploadField
                name="thumbnailImageUrl"
                defaultValue={variant.thumbnailImageUrl ?? ''}
                label="Thumbnail"
                hint="Productfoto voor deze specifieke variant"
                accept="image/jpeg,image/png,image/webp"
              />
              <ImageUploadField
                name="mockupImageUrl"
                defaultValue={variant.mockupImageUrl ?? ''}
                label="Mockup (DIY tool)"
                hint="Transparante PNG voor de mockup engine"
                accept="image/png"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-2.5 pt-1 border-t border-gray-100">
              {[
                { name: 'isActive',  label: 'Actief',    hint: 'Variant is beschikbaar voor verkoop', val: variant.isActive },
                { name: 'isDefault', label: 'Standaard', hint: 'Standaard geselecteerde variant', val: variant.isDefault },
              ].map((item) => (
                <label key={item.name}
                  className="flex items-start gap-3 p-3 rounded-xl border border-gray-100
                             cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox" name={item.name} defaultChecked={item.val}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#C4A040]
                               focus:ring-[#C4A040]/30 focus:ring-2"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.hint}</p>
                  </div>
                </label>
              ))}
            </div>

            <div>
              <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1.5">
                Volgorde
              </label>
              <input
                id="sortOrder" name="sortOrder" type="number"
                defaultValue={variant.sortOrder}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
              />
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <button
                type="submit"
                className="bg-[#2C2416] text-white text-sm font-semibold px-5 py-2.5 rounded-xl
                           hover:bg-[#3C3020] transition-colors"
              >
                Opslaan
              </button>
              <Link
                href={`/admin/producten/${product.id}#varianten`}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Terug
              </Link>
            </div>
          </form>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Preview */}
          {(variant.thumbnailImageUrl || variant.color) && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Preview</p>
              {variant.thumbnailImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={variant.thumbnailImageUrl}
                  alt={displayLabel}
                  className="w-full max-h-32 object-contain rounded-xl bg-[#FAF8F5]"
                />
              ) : variant.color ? (
                <div className="w-full h-16 rounded-xl border border-gray-100"
                  style={{ backgroundColor: variant.color }} />
              ) : null}
              <p className="text-xs text-gray-500 mt-2 text-center font-medium">{displayLabel}</p>
            </div>
          )}

          {/* Delete */}
          <DeleteProductButton boundAction={boundDelete} productName={`Variant: ${displayLabel}`} />
        </div>
      </div>
    </div>
  )
}
