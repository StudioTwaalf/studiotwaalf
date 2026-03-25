/**
 * DiyRedirectBlock
 *
 * Shown on a webshop product page when the product requires the DIY flow
 * (requiresDiyFlow = true). Replaces the normal AddToCartButton + personalization
 * fields with an elegant explanation and a CTA that leads into the design tool.
 *
 * Props:
 *  - diyTemplateId  optional Template ID → links to /design/[id]/concept
 *                   if absent → links to /templates (general DIY discovery)
 *  - productName    used to personalise the copy slightly
 */

import Link from 'next/link'

interface Props {
  diyTemplateId: string | null
  productName:   string
}

export default function DiyRedirectBlock({ diyTemplateId, productName }: Props) {
  const href = diyTemplateId
    ? `/design/${diyTemplateId}/concept`
    : '/templates'

  return (
    <div className="space-y-3">

      {/* Explanation card */}
      <div className="bg-[#FAF7F0] border border-[#EDE0C4] rounded-2xl p-5">
        <div className="flex gap-3 items-start">
          {/* Pen icon */}
          <div className="w-9 h-9 rounded-xl bg-[#F5EDD5] border border-[#E8D9BC] flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-[#8B6F3E]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536M9 11l6.5-6.5a2 2 0 012.828 2.828L11.828 13.828
                   a4 4 0 01-1.414.94l-3 1a.5.5 0 01-.636-.636l1-3A4 4 0 019 11z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#4A3520] leading-snug mb-1">
              Personalisatie via de DIY tool
            </p>
            <p className="text-xs text-[#7A6A52] leading-relaxed">
              {productName} is een gepersonaliseerd product. Om jouw ontwerp correct op te bouwen
              en direct visueel te bekijken, gebruik je onze DIY tool — zo ziet het eindresultaat
              er al vóór je bestelling precies uit zoals je het wilt.
            </p>
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <Link
        href={href}
        className="flex items-center justify-center gap-2.5 w-full py-4 px-6 rounded-2xl
                   bg-[#2C2416] text-white text-sm font-semibold
                   hover:bg-[#3C3020] active:scale-[0.98]
                   transition-all duration-150 tracking-wide"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3
               m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374
               3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Start je ontwerp in de DIY tool
      </Link>

      {/* Helper text */}
      <p className="text-[11px] text-center text-[#A0907A] leading-relaxed px-2">
        Je legt je personalisatie vast in het ontwerp — daarna bestel je vanuit de DIY tool.
      </p>

    </div>
  )
}
