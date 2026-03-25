import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createVariantAction } from './actions'
import ImageUploadField from '@/components/admin/ImageUploadField'

interface Props { params: { id: string } }

export default async function NewVariantPage({ params }: Props) {
  const product = await prisma.product.findUnique({ where: { id: params.id } })
  if (!product) notFound()

  const boundCreate = createVariantAction.bind(null, product.id)

  return (
    <div className="max-w-2xl">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/admin/gadgets" className="hover:text-gray-600 transition-colors">Gadgets</Link>
        <span>/</span>
        <Link href={`/admin/gadgets/${product.id}`} className="hover:text-gray-600 transition-colors truncate max-w-xs">
          {product.nameNl}
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Nieuwe variant</span>
      </nav>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h1 className="text-lg font-semibold text-gray-900 mb-6">Variant aanmaken</h1>

        <form action={boundCreate} className="space-y-6">
          {/* Identity */}
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Identiteit</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Naam <span className="text-red-500">*</span>
                </label>
                <input
                  id="name" name="name" type="text" required autoFocus
                  placeholder="bijv. Roze"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                  Kleur <span className="text-xs text-gray-400">(CSS kleur)</span>
                </label>
                <input
                  id="color" name="color" type="text"
                  placeholder="bijv. #F4A7B9 of pink"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">Wordt als kleurpunt getoond in de gadgetpicker</p>
              </div>
              <div>
                <label htmlFor="sizeLabel" className="block text-sm font-medium text-gray-700 mb-1">
                  Maatlabel <span className="text-xs text-gray-400">(optioneel)</span>
                </label>
                <input
                  id="sizeLabel" name="sizeLabel" type="text"
                  placeholder="bijv. Klein"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="priceCents" className="block text-sm font-medium text-gray-700 mb-1">
                  Prijs (€) <span className="text-xs text-gray-400">(leeg = overnemen)</span>
                </label>
                <input
                  id="priceCents" name="priceCents" type="number"
                  step="0.01" min="0"
                  placeholder={`${(product.basePriceCents / 100).toFixed(2)} (van product)`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </section>

          {/* Dimensions */}
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Afmetingen</h2>
            <p className="text-xs text-gray-400 mb-4">Leeg = overnemen van het product.</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="widthMm" className="block text-sm font-medium text-gray-700 mb-1">Breedte (mm)</label>
                <input id="widthMm" name="widthMm" type="number" step="0.1" min="0.1" placeholder="bijv. 50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="heightMm" className="block text-sm font-medium text-gray-700 mb-1">Hoogte (mm)</label>
                <input id="heightMm" name="heightMm" type="number" step="0.1" min="0.1" placeholder="bijv. 130"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="depthMm" className="block text-sm font-medium text-gray-700 mb-1">Diepte (mm)</label>
                <input id="depthMm" name="depthMm" type="number" step="0.1" min="0" placeholder="bijv. 40"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="mockupScale" className="block text-sm font-medium text-gray-700 mb-1">
                  Mockup schaal <span className="text-gray-400 text-xs">(0.3–3.0)</span>
                </label>
                <input id="mockupScale" name="mockupScale" type="number" step="0.05" min="0.3" max="3.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="visualPadding" className="block text-sm font-medium text-gray-700 mb-1">
                  Transparante marge <span className="text-gray-400 text-xs">(0–0.45)</span>
                </label>
                <input id="visualPadding" name="visualPadding" type="number" step="0.01" min="0" max="0.45"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">Volgorde</label>
                <input id="sortOrder" name="sortOrder" type="number" defaultValue={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </section>

          {/* Images */}
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Afbeeldingen</h2>
            <div className="space-y-5">
              <ImageUploadField
                name="mockupImageUrl"
                label="Mockup afbeelding"
                hint="Wordt gebruikt in de concept mockup — bij voorkeur transparante PNG"
                accept="image/png,image/jpeg,image/webp"
              />
              <ImageUploadField
                name="thumbnailImageUrl"
                label="Thumbnail afbeelding"
                hint="Wordt gebruikt in gadgetoverzicht en webshop"
                accept="image/jpeg,image/png,image/webp"
              />
            </div>
          </section>

          {/* Flags */}
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Instellingen</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'isActive',  label: 'Actief',            defaultChecked: true,  hint: 'Toon deze variant in de gadgetpicker' },
                { name: 'isDefault', label: 'Standaard variant', defaultChecked: false, hint: 'Wordt automatisch geselecteerd bij toevoegen' },
              ].map((item) => (
                <label key={item.name}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input type="checkbox" name={item.name} defaultChecked={item.defaultChecked}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.hint}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button type="submit"
              className="bg-indigo-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Variant aanmaken
            </button>
            <Link href={`/admin/gadgets/${product.id}`}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Annuleren
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
