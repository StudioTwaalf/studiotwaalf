import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ImageUploadField from '@/components/admin/ImageUploadField'
import { createVariantAction } from './actions'

interface Props {
  params: { id: string }
}

export default async function NewVariantPage({ params }: Props) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: { id: true, nameNl: true, basePriceCents: true },
  })
  if (!product) notFound()

  const boundCreate = createVariantAction.bind(null, product.id)

  return (
    <div className="max-w-xl">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
        <Link href="/admin/producten" className="hover:text-gray-700 transition-colors">Producten</Link>
        <span className="text-gray-300">/</span>
        <Link href={`/admin/producten/${product.id}`} className="hover:text-gray-700 transition-colors truncate max-w-[160px]">
          {product.nameNl}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 font-medium">Nieuwe variant</span>
      </nav>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h1 className="text-base font-semibold text-gray-900">Nieuwe variant toevoegen</h1>
          <p className="text-xs text-gray-400 mt-0.5">Kleur, maat of andere uitvoering van dit product.</p>
        </div>

        <form action={boundCreate} className="px-6 py-5 space-y-5">

          {/* Naam + Kleur */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Naam variant
              </label>
              <input
                id="name" name="name" type="text" autoFocus
                placeholder="bijv. Roze, Klein, Wit mat…"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
              />
            </div>
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1.5">
                Kleur <span className="text-gray-400 text-xs font-normal">CSS hex/naam</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="color" name="color" type="text"
                  placeholder="#FBBFD8 of pink"
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                />
                <input
                  type="color" defaultValue="#FFFFFF"
                  onChange={(e) => {
                    const textInput = document.getElementById('color') as HTMLInputElement | null
                    if (textInput) textInput.value = e.target.value
                  }}
                  className="h-10 w-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
                  aria-label="Kleur kiezen"
                />
              </div>
            </div>
          </div>

          {/* Maat label */}
          <div>
            <label htmlFor="sizeLabel" className="block text-sm font-medium text-gray-700 mb-1.5">
              Maatlabel <span className="text-gray-400 text-xs font-normal">vrijtekst</span>
            </label>
            <input
              id="sizeLabel" name="sizeLabel" type="text"
              placeholder="bijv. 50×130×40 mm of S / M / L"
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
                placeholder={(product.basePriceCents / 100).toFixed(2)}
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
              />
            </div>
          </div>

          {/* Afmetingen */}
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              Afmetingen <span className="text-gray-400 text-xs font-normal">overschrijft product-afmetingen</span>
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'widthMm',  label: 'Breedte (mm)' },
                { id: 'heightMm', label: 'Hoogte (mm)' },
                { id: 'depthMm',  label: 'Diepte (mm)' },
              ].map(({ id, label }) => (
                <div key={id}>
                  <label htmlFor={id} className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input
                    id={id} name={id} type="number" step="0.1" min="0"
                    placeholder="—"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-[#C4A040]/30 focus:border-[#C4A040]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Afbeeldingen */}
          <div className="space-y-4">
            <ImageUploadField
              name="thumbnailImageUrl"
              defaultValue=""
              label="Thumbnail"
              hint="Productfoto voor deze specifieke variant"
              accept="image/jpeg,image/png,image/webp"
            />
            <ImageUploadField
              name="mockupImageUrl"
              defaultValue=""
              label="Mockup (DIY tool)"
              hint="Transparante PNG voor de mockup engine"
              accept="image/png"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-2.5 pt-1">
            {[
              { name: 'isActive',  label: 'Actief',     hint: 'Variant is beschikbaar voor verkoop' },
              { name: 'isDefault', label: 'Standaard',  hint: 'Standaard geselecteerde variant op de productpagina' },
            ].map((item) => (
              <label key={item.name}
                className="flex items-start gap-3 p-3 rounded-xl border border-gray-100
                           cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox" name={item.name} defaultChecked={item.name === 'isActive'}
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

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button
              type="submit"
              className="bg-[#2C2416] text-white text-sm font-semibold px-5 py-2.5 rounded-xl
                         hover:bg-[#3C3020] transition-colors"
            >
              Variant aanmaken
            </button>
            <Link
              href={`/admin/producten/${product.id}#varianten`}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Annuleren
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
