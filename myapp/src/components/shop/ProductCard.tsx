import Link from 'next/link'
import Image from 'next/image'
import { formatEuro } from '@/lib/money'

interface ProductCardProps {
  slug: string
  name: string
  thumbnailUrl: string | null
  basePriceCents: number
  categoryName?: string
  isPersonalizable?: boolean
}

export default function ProductCard({
  slug,
  name,
  thumbnailUrl,
  basePriceCents,
  categoryName,
  isPersonalizable,
}: ProductCardProps) {
  return (
    <Link href={`/webshop/${slug}`} className="group flex flex-col">
      {/* Image */}
      <div className="aspect-[3/4] bg-[#F5F0E8] relative overflow-hidden rounded-2xl">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C4B8A0" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-colors duration-400 pointer-events-none" />
        <div className="absolute bottom-4 inset-x-4 flex justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
          <span className="text-[11px] font-semibold text-white tracking-wider uppercase bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full whitespace-nowrap">
            Bekijk product
          </span>
        </div>

        {/* Badge */}
        {isPersonalizable && (
          <div className="absolute top-3 left-3 bg-white/90 text-[#8B6F3E] text-[10px] font-semibold px-2.5 py-1 rounded-full border border-[#E8D9BC] backdrop-blur-sm">
            Personaliseerbaar
          </div>
        )}
      </div>

      {/* Info */}
      <div className="pt-3.5 px-0.5">
        {categoryName && (
          <p className="text-[10px] font-semibold text-[#B5A48A] uppercase tracking-widest mb-1">
            {categoryName}
          </p>
        )}
        <h3 className="text-sm font-semibold text-studio-black leading-snug group-hover:text-[#8A6A30] transition-colors duration-200">
          {name}
        </h3>
        <p className="text-sm text-[#8A7A6A] mt-1.5 font-medium">
          Vanaf {formatEuro(basePriceCents)}
        </p>
      </div>
    </Link>
  )
}
