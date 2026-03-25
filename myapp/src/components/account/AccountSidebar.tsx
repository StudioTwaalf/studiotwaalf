'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ACCOUNT_NAV } from '@/lib/constants/account-nav'

export default function AccountSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-52 flex-shrink-0">
      <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#B5A48A] mb-6 px-1">
        Mijn account
      </p>

      <nav>
        <ul className="flex flex-col gap-0.5">
          {ACCOUNT_NAV.map(({ href, label, icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium
                              transition-all duration-150
                              ${isActive
                    ? 'bg-white text-[#2C2416] shadow-sm border border-neutral-200'
                    : 'text-[#7A6A52] hover:bg-white/70 hover:text-[#2C2416]'
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

      <div className="mt-6 pt-5 border-t border-neutral-200">
        <Link
          href="/"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs text-[#B5A48A]
                     hover:text-[#7A6A52] hover:bg-white/60 transition-all duration-150"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Terug naar site
        </Link>
      </div>
    </aside>
  )
}
