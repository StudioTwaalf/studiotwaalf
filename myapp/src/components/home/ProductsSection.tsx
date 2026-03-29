import Image from 'next/image'

const PRODUCTS = [
  {
    title: 'Geboortekaartjes',
    description: 'Unieke aankondigingen met jouw eigen stijl en personalisatie.',
    bg: '#FFCED3',
    image: '/images/home/geboortekaartje-ella-studiotwaalf.jpg',
    imageAlt: 'Geboortekaartje Ella – Studio Twaalf',
    imageFocus: '50% 50%',
  },
  {
    title: 'Huwelijksuitnodigingen',
    description: 'Stijlvolle uitnodigingen voor de mooiste dag van jullie leven.',
    bg: '#E8DCBB',
    image: '/images/home/huwelijksuitnodiging-studiotwaalf.jpeg',
    imageAlt: 'Huwelijksuitnodiging Laura & Maarten – Studio Twaalf',
    imageFocus: '60% 25%',
    imageFilter: 'brightness(1.3) saturate(0.85)',
  },
  {
    title: 'Doopsuiker',
    description: 'Gepersonaliseerde doopsuiker verpakkingen die passen bij je concept.',
    bg: '#A8BFA3',
    image: '/images/home/geboortesuiker-jerome-studiotwaalf.jpg',
    imageAlt: 'Doopsuiker Jérôme – Studio Twaalf',
    imageFocus: '50% 60%',
  },
  {
    title: 'Verpakkingen',
    description: 'Dozen, zakjes en wikkels volledig in lijn met je concept.',
    bg: '#E7C46A',
    image: '/images/home/verpakkingen-milou-studiotwaalf.jpg',
    imageAlt: 'Verpakkingen Milou – Studio Twaalf',
    imageFocus: '50% 50%',
    imageFilter: 'brightness(1.5) saturate(0.8)',
  },
  {
    title: 'Gepersonaliseerde cadeaus',
    description: 'Unieke cadeaus met naam of boodschap, perfect als herinnering.',
    bg: '#F5F0E8',
    image: '/images/home/gepersonaliseerde-cadeaus-kaarsen-studiotwaalf.jpg',
    imageAlt: 'Gepersonaliseerde kaarsen – Studio Twaalf',
    imageFocus: '50% 40%',
  },
  {
    title: 'Bedankjes',
    description: 'Stijlvolle dankkaartjes of kleine attenties voor je gasten.',
    bg: '#EDE0D4',
    image: '/images/home/bloemenboog-studiotwaalf.jpg',
    imageAlt: 'Gepersonaliseerde bloemenboog – Studio Twaalf',
    imageFocus: '50% 40%',
  },
]

export default function ProductsSection() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="text-xs font-semibold text-[#B5A48A] uppercase tracking-widest mb-3">
            Wat je kan ontwerpen
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-studio-black leading-tight text-balance mb-4">
            Van kaartje tot volledig concept
          </h2>
          <p className="text-[#7A6A52] text-sm leading-relaxed">
            Studio Twaalf ontwerpt niet alleen kaartjes. Je creëert een volledig afgestemd concept
            dat samenhangt van a tot z.
          </p>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          {PRODUCTS.map((product) => (
            <div
              key={product.title}
              className="group relative rounded-2xl border border-[#EDE7D9] bg-[#FAFAF7] hover:shadow-soft transition-all hover:-translate-y-0.5 overflow-hidden"
            >
              <>
                <div className="relative w-full h-44 overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.imageAlt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{
                      objectPosition: product.imageFocus,
                      filter: product.imageFilter,
                    }}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-sm font-semibold text-studio-black mb-1.5">
                    {product.title}
                  </h3>
                  <p className="text-[0.78rem] text-[#8A7A6A] leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
