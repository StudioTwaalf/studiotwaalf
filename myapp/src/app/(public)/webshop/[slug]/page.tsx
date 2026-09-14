'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import VariantSelector from '@/components/shop/VariantSelector'
import PersonalizationFields from '@/components/shop/PersonalizationFields'
import AddToCartButton from '@/components/shop/AddToCartButton'
import DiyRedirectBlock from '@/components/shop/DiyRedirectBlock'
import { formatEuro } from '@/lib/money'
import { trackEcommerce, toEcommerceItem } from '@/lib/analytics'

interface Variant {
  id: string
  name: string | null
  color: string | null
  sizeLabel: string | null
  priceCents: number | null
  thumbnailImageUrl: string | null
  isDefault: boolean
}

interface Product {
  id: string
  slug: string
  nameNl: string
  descriptionNl: string | null
  basePriceCents: number
  isPersonalizable: boolean
  /** When true, webshop page shows DIY redirect instead of in-shop personalization/cart */
  requiresDiyFlow: boolean
  /** Optional Template ID for the DIY redirect CTA */
  diyTemplateId: string | null
  stockQuantity: number | null
  category: { nameNl: string; slug: string }
  assets: { url: string; altNl: string | null }[]
  variants: Variant[]
}

const TRUST_ITEMS = [
  { icon: 'M5 13l4 4L19 7',                                                                                          label: 'Handgemaakt en persoonlijk verwerkt' },
  { icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1.5 10a2 2 0 002 2h7a2 2 0 002-2L19 8',                     label: 'Verzending binnen 5–7 werkdagen' },
  { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', label: 'Veilig betalen via Mollie' },
]

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct]                       = useState<Product | null>(null)
  const [loading, setLoading]                       = useState(true)
  const [activeImage, setActiveImage]               = useState(0)
  const [selectedVariantId, setSelectedVariantId]   = useState<string | null>(null)
  const [quantity, setQuantity]                     = useState(1)
  const [personalization, setPersonalization]       = useState<Record<string, string>>({})

  const viewItemFiredRef = useRef(false)

  useEffect(() => {
    viewItemFiredRef.current = false  // reset on slug change
    fetch(`/api/shop/products/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) { setLoading(false); return }
        setProduct(data)
        const defaultVariant = data.variants.find((v: Variant) => v.isDefault) ?? data.variants[0]
        if (defaultVariant) setSelectedVariantId(defaultVariant.id)
        setLoading(false)
      })
  }, [slug])

  // GA4: view_item — fires once per product load
  useEffect(() => {
    if (!product || viewItemFiredRef.current) return
    viewItemFiredRef.current = true
    const priceCents = product.basePriceCents
    trackEcommerce({
      event:    'view_item',
      currency: 'EUR',
      value:    priceCents / 100,
      items:    [toEcommerceItem({
        id:       product.id,
        name:     product.nameNl,
        category: product.category.nameNl,
        priceCents,
        quantity: 1,
      })],
    })
  }, [product])

  if (loading) {
    return (
      <div className="bg-studio-beige min-h-screen pt-24">
        <div className="max-w-6xl mx-auto px-6 py-20 flex justify-center">
          <div className="w-8 h-8 border-2 border-studio-yellow border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!product) return notFound()

  const selectedVariant     = product.variants.find((v) => v.id === selectedVariantId)
  const priceCents          = selectedVariant?.priceCents ?? product.basePriceCents
  const hasVariants         = product.variants.length > 0
  const hasColors           = product.variants.some((v) => v.color)
  const variantSectionLabel = hasColors ? 'Kleur' : 'Formaat'
  const variantSelectedLabel = selectedVariant?.name ?? selectedVariant?.sizeLabel ?? null

  const variantThumb = selectedVariant?.thumbnailImageUrl ?? null
  const images: { url: string; altNl: string | null }[] =
    product.assets.length > 0
      ? product.assets
      : variantThumb
        ? [{ url: variantThumb, altNl: selectedVariant?.name ?? product.nameNl }]
        : []

  return (
    <div className="bg-white min-h-screen">

      {/* Breadcrumb */}
      <div className="bg-studio-beige border-b border-[#EDE7D9]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-3.5 flex items-center gap-2 text-xs text-[#8A7A6A]">
          <Link href="/webshop" className="hover:text-studio-black transition-colors">Webshop</Link>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
          <Link href={`/webshop?categorie=${product.category.slug}`} className="hover:text-studio-black transition-colors">
            {product.category.nameNl}
          </Link>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
          <span className="text-studio-black font-medium truncate">{product.nameNl}</span>
        </div>
      </div>

      {/* Main grid */}
      <section className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-12 lg:py-16">
        <div className="grid lg:grid-cols-[1fr_440px] gap-12 lg:gap-16 items-start">

          {/* Images */}
          <div>
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-[#F5F0E8] relative">
              {images[activeImage]?.url ? (
                <Image
                  src={images[activeImage].url}
                  alt={images[activeImage].altNl ?? product.nameNl}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-[#C4B8A0]">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span className="text-sm">Afbeelding volgt binnenkort</span>
                </div>
              )}
            </div>

            {/* Gallery thumbnails — portrait ratio matching the main image */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={[
                      'w-[60px] h-[75px] rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-150',
                      i === activeImage
                        ? 'border-studio-black'
                        : 'border-transparent hover:border-[#E0D5C5]',
                    ].join(' ')}
                  >
                    <Image src={img.url} alt={img.altNl ?? ''} width={60} height={75} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info + Actions — sticky on desktop */}
          <div className="lg:sticky lg:top-8 space-y-6">

            {/* Title + Price */}
            <div>
              <Link
                href={`/webshop?categorie=${product.category.slug}`}
                className="text-[11px] font-semibold text-[#B5A48A] uppercase tracking-widest hover:text-studio-black transition-colors"
              >
                {product.category.nameNl}
              </Link>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-studio-black leading-tight mt-2 mb-4">
                {product.nameNl}
              </h1>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-studio-black tabular-nums">
                  {formatEuro(priceCents)}
                </span>
                {hasVariants && (
                  <span className="text-sm text-[#B5A48A]">per stuk</span>
                )}
              </div>
            </div>

            <hr className="border-[#F0EAD8]" />

            {/* Variants */}
            {hasVariants && (
              <div>
                <p className="text-xs font-semibold text-[#7A6A52] mb-3">
                  {variantSectionLabel}
                  {variantSelectedLabel && (
                    <span className="font-normal text-studio-black ml-1.5">— {variantSelectedLabel}</span>
                  )}
                </p>
                <VariantSelector
                  variants={product.variants}
                  selectedId={selectedVariantId}
                  onChange={setSelectedVariantId}
                />
              </div>
            )}

            {/* Personalization — only for direct in-shop personalizable products */}
            {product.isPersonalizable && !product.requiresDiyFlow && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs font-semibold text-[#7A6A52]">Personalisatie</p>
                  <span className="text-[10px] text-[#8B6F3E] bg-[#FAF5EA] border border-[#E8D9BC] px-2 py-0.5 rounded-full">
                    Verplicht
                  </span>
                </div>
                <div className="bg-[#FAFAF7] border border-[#EDE7D9] rounded-2xl p-5">
                  <PersonalizationFields value={personalization} onChange={setPersonalization} />
                </div>
              </div>
            )}

            <hr className="border-[#F0EAD8]" />

            {product.requiresDiyFlow ? (
              /* ── DIY redirect: replace cart CTA entirely ──────────────── */
              <DiyRedirectBlock
                diyTemplateId={product.diyTemplateId}
                productName={product.nameNl}
              />
            ) : (
              /* ── Normal cart flow ─────────────────────────────────────── */
              <>
                {/* Quantity */}
                <div>
                  <p className="text-xs font-semibold text-[#7A6A52] mb-3">Aantal</p>
                  <div className="flex items-center border border-[#E0D5C5] rounded-xl overflow-hidden w-fit">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center text-[#7A6A52] hover:bg-[#F5F0E8] disabled:opacity-40 transition-colors"
                      aria-label="Minder"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-studio-black tabular-nums select-none border-x border-[#E0D5C5]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center text-[#7A6A52] hover:bg-[#F5F0E8] transition-colors"
                      aria-label="Meer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    </button>
                  </div>
                </div>

                {/* CTA */}
                <div className="space-y-3">
                  <AddToCartButton
                    productId={product.id}
                    variantId={selectedVariantId}
                    quantity={quantity}
                    personalization={personalization}
                    disabled={product.stockQuantity === 0}
                    ecommerceItem={toEcommerceItem({
                      id:       product.id,
                      name:     product.nameNl,
                      category: product.category.nameNl,
                      variant:  selectedVariant?.name ?? selectedVariant?.sizeLabel,
                      priceCents: selectedVariant?.priceCents ?? product.basePriceCents,
                    })}
                  />
                  {product.stockQuantity === 0 && (
                    <p className="text-xs text-center text-amber-600">
                      Dit product is tijdelijk niet beschikbaar.
                    </p>
                  )}
                  <Link
                    href="/winkelwagen"
                    className="flex items-center justify-center gap-1.5 text-sm text-[#8A7A6A] hover:text-studio-black transition-colors py-1"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 01-8 0" />
                    </svg>
                    Bekijk winkelwagen
                  </Link>
                </div>
              </>
            )}

            {/* Trust block */}
            <div className="border-t border-[#F0EAD8] pt-5 space-y-2.5">
              {TRUST_ITEMS.map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 text-xs text-[#8A7A6A]">
                  <svg className="w-3.5 h-3.5 text-[#C4A46B] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
                  </svg>
                  {item.label}
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Description — below fold */}
      {product.descriptionNl && (
        <section className="border-t border-[#F0EAD8] bg-[#FAFAF7]">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-14 lg:py-16">
            <div className="max-w-2xl">
              <h2 className="font-serif text-2xl font-semibold text-studio-black mb-5">
                Over dit product
              </h2>
              <p className="text-[#7A6A52] text-sm leading-relaxed whitespace-pre-line">
                {product.descriptionNl}
              </p>
            </div>
          </div>
        </section>
      )}

    </div>
  )
}
