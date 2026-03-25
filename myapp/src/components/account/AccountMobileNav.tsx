'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ACCOUNT_NAV } from '@/lib/constants/account-nav'

export default function AccountMobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden" aria-label="Account navigatie">
      <ul className="flex gap-1 overflow-x-auto pb-0.5">
        {ACCOUNT_NAV.map(({ href, label, icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <li key={href} className="flex-shrink-0">
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium
                            transition-all duration-150 whitespace-nowrap
                            ${isActive
                  ? 'bg-white text-[#2C2416] shadow-sm border border-neutral-200'
                  : 'text-[#7A6A52] hover:bg-white/60 hover:text-[#2C2416]'
                }`}
              >
                <span className={isActive ? 'text-[#8C6D1A]' : 'text-[#B5A48A]'}>
                  {icon}
                </span>
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
