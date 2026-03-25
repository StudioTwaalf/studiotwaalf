import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { createGadgetAction } from './actions'
import ImageUploadField from '@/components/admin/ImageUploadField'

export default async function NewGadgetPage() {
  const categories = await prisma.category.findMany({
    where:   { isActive: true },
    orderBy: { nameNl: 'asc' },
  })

  return (
    <div className="max-w-3xl">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/admin/gadgets" className="hover:text-gray-600 transition-colors">Gadgets</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Nieuw gadget</span>
      </nav>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h1 className="text-lg font-semibold text-gray-900 mb-6">Gadget aanmaken</h1>

        {categories.length === 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            Er zijn nog geen categorieën.{' '}
            <Link href="/admin/gadgets/categories/new" className="font-medium underline">
              Maak er een aan
            </Link>{' '}
            voordat je een gadget aanmaakt.
          </div>
        )}

        <form action={createGadgetAction} className="space-y-8">
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
                    id="nameNl" name="nameNl" type="text" required autoFocus
                    placeholder="bijv. Gepersonaliseerde sticker"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                    Slug <span className="text-xs text-gray-400">(auto)</span>
                  </label>
                  <input
                    id="slug" name="slug" type="text"
                    placeholder="auto-gegenereerd"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Kies categorie…</option>
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
                    step="0.01" min="0" required placeholder="bijv. 1.50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
                    Volgorde
                  </label>
                  <input
                    id="sortOrder" name="sortOrder" type="number" defaultValue={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Afbeeldingen */}
              <div className="space-y-5">
                <ImageUploadField
                  name="mockupImageUrl"
                  label="Mockup afbeelding"
                  hint="Wordt gebruikt in de concept mockup weergave — bij voorkeur transparante PNG"
                  accept="image/png,image/jpeg,image/webp"
                />
                <ImageUploadField
                  name="thumbnailImageUrl"
                  label="Thumbnail afbeelding"
                  hint="Wordt gebruikt in webshop en gadget overzicht"
                  accept="image/jpeg,image/png,image/webp"
                />
                <div>
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Afbeelding URL <span className="text-xs text-gray-400">(fallback)</span>
                  </label>
                  <input
                    id="imageUrl" name="imageUrl" type="url"
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
                { name: 'isActive',         label: 'Actief',                   defaultChecked: true,  hint: 'Product is zichtbaar en bruikbaar' },
                { name: 'isVisibleInDIY',   label: 'Zichtbaar in DIY tool',    defaultChecked: true,  hint: 'Selecteerbaar in de gadgetpicker' },
                { name: 'isVisibleInShop',  label: 'Zichtbaar in webshop',     defaultChecked: false, hint: 'Toon in de publieke webshop' },
                { name: 'isPersonalizable', label: 'Personaliseerbaar',        defaultChecked: false, hint: 'Laat gebruiker tekst toevoegen' },
              ].map((item) => (
                <label key={item.name}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox" name={item.name} defaultChecked={item.defaultChecked}
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
              Fysieke afmetingen in millimeter. Breedte en hoogte zijn nodig voor proportionele schaling in de mockup.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="widthMm" className="block text-sm font-medium text-gray-700 mb-1">
                    Breedte (mm)
                  </label>
                  <input
                    id="widthMm" name="widthMm" type="number" step="0.1" min="0.1"
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
                    placeholder="bijv. 30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="depthMm" className="block text-sm font-medium text-gray-700 mb-1">
                    Diepte (mm) <span className="text-gray-400 text-xs">optioneel</span>
                  </label>
                  <input
                    id="depthMm" name="depthMm" type="number" step="0.1" min="0"
                    placeholder="bijv. 5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="mockupScale" className="block text-sm font-medium text-gray-700 mb-1">
                    Mockup schaal{' '}
                    <span className="text-gray-400 text-xs">(0.3–3.0, standaard 1.0)</span>
                  </label>
                  <input
                    id="mockupScale" name="mockupScale" type="number"
                    step="0.05" min="0.3" max="3.0" defaultValue={1.0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {'< 1'} = kleiner weergeven, {'> 1'} = groter weergeven dan werkelijke afmeting
                  </p>
                </div>
                <div>
                  <label htmlFor="visualPadding" className="block text-sm font-medium text-gray-700 mb-1">
                    Transparante marge{' '}
                    <span className="text-gray-400 text-xs">(0–0.45, standaard 0)</span>
                  </label>
                  <input
                    id="visualPadding" name="visualPadding" type="number"
                    step="0.01" min="0" max="0.45" defaultValue={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Compensatie voor transparante randen in de productfoto
                  </p>
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
              Gadget aanmaken
            </button>
            <Link href="/admin/gadgets" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Annuleren
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
