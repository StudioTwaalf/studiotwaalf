'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Instagram, ChevronDown, LogOut } from 'lucide-react'
import CartIcon from '@/components/cart/CartIcon'

// ─── Data ──────────────────────────────────────────────────────────────────────

const AANBOD = [
  { label: 'Drukwerk',                  href: '/drukwerk'   },
  { label: 'Doopsuiker',                href: '/doopsuiker' },
  { label: 'Gepersonaliseerde cadeaus', href: '/cadeaus'    },
  { label: 'Webshop',                   href: '/webshop'    },
]

const MAIN_LINKS = [
  { label: 'Aanpak',             href: '/aanpak'      },
  { label: 'Realisaties',        href: '/realisaties' },
  { label: 'Over Studio Twaalf', href: '/over'        },
  { label: 'Contact',            href: '/contact'     },
]

const ACCOUNT_ITEMS = [
  { label: 'Gegevens',          href: '/account/gegevens'     },
  { label: 'Mijn projecten',    href: '/account/projecten'    },
  { label: 'Mijn bestellingen', href: '/account/bestellingen' },
]

const IG_URL  = 'https://www.instagram.com/studiotwaalf.be'
const IG_ARIA = 'Studio Twaalf op Instagram'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isActive(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(href + '/')
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7C46A]/60 focus-visible:ring-offset-2'

function desktopLinkCls(href: string, pathname: string) {
  const active = isActive(href, pathname)
  return [
    'whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-150',
    focusRing,
    active
      ? 'text-studio-black bg-black/[0.06]'
      : 'text-gray-500 hover:text-studio-black hover:bg-black/[0.04]',
  ].join(' ')
}

function mobileLinkCls(href: string, pathname: string) {
  const active = isActive(href, pathname)
  return [
    'block py-3 text-sm font-medium border-t border-black/5 transition-colors duration-150',
    focusRing,
    active ? 'text-studio-black' : 'text-gray-600 hover:text-studio-black',
  ].join(' ')
}

// ─── Reusable dropdown panel wrapper ──────────────────────────────────────────

function DropdownPanel({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      role="menu"
      className={[
        'absolute top-full right-0 mt-2 w-52 z-50',
        'bg-white/95 backdrop-blur-md rounded-2xl border border-black/5 shadow-lg py-1.5',
        'transition-all duration-200 ease-out origin-top',
        open
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 -translate-y-1 pointer-events-none',
      ].join(' ')}
    >
      {children}
    </div>
  )
}

function DropdownItem({ href, pathname, onClick, children }: {
  href: string; pathname: string; onClick?: () => void; children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className={[
        'block mx-1 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-150',
        focusRing,
        isActive(href, pathname)
          ? 'text-studio-black bg-studio-beige/80'
          : 'text-gray-600 hover:text-studio-black hover:bg-studio-beige/60',
      ].join(' ')}
    >
      {children}
    </Link>
  )
}

// ─── Hook: close on outside click ─────────────────────────────────────────────

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, open, onClose])
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PublicNav() {
  const pathname               = usePathname()
  const { data: session, status } = useSession()

  const [scrolled,          setScrolled]          = useState(false)
  const [aanbodOpen,        setAanbodOpen]        = useState(false)
  const [accountOpen,       setAccountOpen]       = useState(false)
  const [mobileOpen,        setMobileOpen]        = useState(false)
  const [mobileAanbodOpen,  setMobileAanbodOpen]  = useState(false)
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false)

  const aanbodRef  = useRef<HTMLDivElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)

  const aanbodActive  = AANBOD.some(item => isActive(item.href, pathname))
  const accountActive = ACCOUNT_ITEMS.some(item => isActive(item.href, pathname))

  // Scroll state
  useEffect(() => {
    const check = () => setScrolled(window.scrollY > 12)
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [])

  // Outside-click handlers
  useOutsideClick(aanbodRef,  aanbodOpen,  () => setAanbodOpen(false))
  useOutsideClick(accountRef, accountOpen, () => setAccountOpen(false))

  // Close mobile menu on scroll
  useEffect(() => {
    if (!mobileOpen) return
    const handler = () => setMobileOpen(false)
    window.addEventListener('scroll', handler, { passive: true, once: true })
    return () => window.removeEventListener('scroll', handler)
  }, [mobileOpen])

  const solidHeader = scrolled || mobileOpen

  const handleSignOut = () => {
    setAccountOpen(false)
    setMobileOpen(false)
    signOut({ callbackUrl: '/' })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <header
      className={[
        'sticky top-0 z-50 w-full transition-all duration-300 ease-in-out',
        solidHeader
          ? 'bg-white/80 backdrop-blur-md border-b border-black/5 shadow-sm py-2'
          : 'bg-transparent py-4',
      ].join(' ')}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">

        {/* ── Logo ──────────────────────────────────────────────────────────── */}
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center shrink-0 hover:opacity-75 transition-opacity duration-200 ${focusRing} rounded-sm`}
        >
          <Image
            src="/logo/logo.png"
            alt="Studio Twaalf"
            width={180}
            height={48}
            className={`w-auto transition-all duration-300 ease-in-out [filter:none] ${scrolled ? 'h-10' : 'h-12'}`}
            priority
          />
        </Link>

        {/* ── Desktop: nav + instagram + account ────────────────────────────── */}
        <div className="hidden lg:flex items-center gap-2">

          {/* Main nav */}
          <nav className="flex items-center gap-0.5">

            {/* Aanbod dropdown */}
            <div className="relative" ref={aanbodRef}>
              <button
                onClick={() => setAanbodOpen(v => !v)}
                aria-expanded={aanbodOpen}
                aria-haspopup="true"
                className={[
                  'flex items-center gap-1 whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-150',
                  focusRing,
                  aanbodActive || aanbodOpen
                    ? 'text-studio-black bg-black/[0.06]'
                    : 'text-gray-500 hover:text-studio-black hover:bg-black/[0.04]',
                ].join(' ')}
              >
                Aanbod
                <ChevronDown size={14} strokeWidth={2.5}
                  className={`transition-transform duration-200 ${aanbodOpen ? 'rotate-180' : ''}`} />
              </button>

              <div
                role="menu"
                className={[
                  'absolute top-full left-0 mt-2 w-56 z-50',
                  'bg-white/95 backdrop-blur-md rounded-2xl border border-black/5 shadow-lg py-1.5',
                  'transition-all duration-200 ease-out origin-top',
                  aanbodOpen
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 -translate-y-1 pointer-events-none',
                ].join(' ')}
              >
                {AANBOD.map(item => (
                  <DropdownItem key={item.href} href={item.href} pathname={pathname}
                    onClick={() => setAanbodOpen(false)}>
                    {item.label}
                  </DropdownItem>
                ))}
              </div>
            </div>

            {/* Aanpak · Realisaties */}
            {MAIN_LINKS.slice(0, 2).map(item => (
              <Link key={item.href} href={item.href} className={desktopLinkCls(item.href, pathname)}>
                {item.label}
              </Link>
            ))}

            {/* Webshop — standalone link */}
            <Link href="/webshop" className={desktopLinkCls('/webshop', pathname)}>
              Webshop
            </Link>

            {/* DIY tool — soft CTA pill */}
            <Link
              href="/templates"
              className={[
                'whitespace-nowrap mx-1 text-sm font-semibold px-4 py-2 rounded-full',
                'border border-black/5 transition-all duration-150',
                focusRing,
                isActive('/templates', pathname)
                  ? 'text-studio-black bg-studio-sand/70'
                  : 'text-studio-black bg-studio-sand/40 hover:bg-studio-sand/70',
              ].join(' ')}
            >
              DIY tool
            </Link>

            {/* Over Studio Twaalf · Contact */}
            {MAIN_LINKS.slice(2).map(item => (
              <Link key={item.href} href={item.href} className={desktopLinkCls(item.href, pathname)}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Instagram */}
          <a
            href={IG_URL}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={IG_ARIA}
            className={[
              'flex items-center justify-center w-9 h-9 rounded-full',
              'border border-black/5 text-gray-500',
              'hover:text-studio-black hover:bg-black/[0.04]',
              'transition-all duration-150',
              focusRing,
            ].join(' ')}
          >
            <Instagram size={18} strokeWidth={1.75} />
          </a>

          {/* ── Cart icon ── */}
          <CartIcon />

          {/* ── Account controls ── */}
          <div className="flex items-center gap-1 pl-2 ml-1 border-l border-black/8">
            {status === 'loading' ? (
              // Skeleton to prevent layout shift
              <span className="w-24 h-7 rounded-lg bg-black/[0.04] animate-pulse" />
            ) : session ? (
              <>
                {/* Mijn account dropdown */}
                <div className="relative" ref={accountRef}>
                  <button
                    onClick={() => setAccountOpen(v => !v)}
                    aria-expanded={accountOpen}
                    aria-haspopup="true"
                    className={[
                      'flex items-center gap-2 whitespace-nowrap text-sm font-medium px-3 py-2 rounded-full transition-all duration-150',
                      focusRing,
                      accountActive || accountOpen
                        ? 'text-studio-black bg-black/[0.06]'
                        : 'text-gray-500 hover:text-studio-black hover:bg-black/[0.04]',
                    ].join(' ')}
                  >
                    <Image
                      src="/avatar.png"
                      alt="Studio Twaalf account"
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full border border-black/10 object-cover"
                    />
                    Mijn account
                    <ChevronDown size={14} strokeWidth={2.5}
                      className={`transition-transform duration-200 ${accountOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <DropdownPanel open={accountOpen}>
                    {ACCOUNT_ITEMS.map(item => (
                      <DropdownItem key={item.href} href={item.href} pathname={pathname}
                        onClick={() => setAccountOpen(false)}>
                        {item.label}
                      </DropdownItem>
                    ))}
                  </DropdownPanel>
                </div>

                {/* Log out */}
                <button
                  onClick={handleSignOut}
                  className={[
                    'flex items-center gap-1.5 whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-lg',
                    'text-gray-400 hover:text-red-500 hover:bg-red-50/60 transition-all duration-150',
                    focusRing,
                  ].join(' ')}
                >
                  <LogOut size={14} strokeWidth={2} />
                  Uitloggen
                </button>
              </>
            ) : (
              // Logged-out: Log in link
              <Link
                href="/login"
                className={[
                  'whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-lg',
                  'border border-black/10 text-gray-600',
                  'hover:text-studio-black hover:bg-black/[0.04] hover:border-black/15',
                  'transition-all duration-150',
                  focusRing,
                ].join(' ')}
              >
                Log in
              </Link>
            )}
          </div>
        </div>

        {/* ── Hamburger ─────────────────────────────────────────────────────── */}
        <button
          onClick={() => setMobileOpen(v => !v)}
          aria-label={mobileOpen ? 'Menu sluiten' : 'Menu openen'}
          aria-expanded={mobileOpen}
          className={[
            'lg:hidden flex flex-col items-center justify-center w-9 h-9 gap-[5px] rounded-lg',
            'hover:bg-black/[0.04] transition-all duration-150',
            focusRing,
          ].join(' ')}
        >
          <span className={`block w-5 h-[1.5px] bg-gray-700 transition-all duration-300 origin-center ${mobileOpen ? 'translate-y-[6.5px] rotate-45' : ''}`} />
          <span className={`block w-5 h-[1.5px] bg-gray-700 transition-all duration-300 ${mobileOpen ? 'opacity-0 scale-x-0' : ''}`} />
          <span className={`block w-5 h-[1.5px] bg-gray-700 transition-all duration-300 origin-center ${mobileOpen ? '-translate-y-[6.5px] -rotate-45' : ''}`} />
        </button>
      </div>

      {/* ── Mobile menu ───────────────────────────────────────────────────────── */}
      <div
        className={[
          'lg:hidden overflow-hidden transition-all duration-300 ease-in-out',
          mobileOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0',
        ].join(' ')}
      >
        <div className="border-t border-black/5 bg-white/95 backdrop-blur-md px-5 pb-5 pt-1">

          {/* Aanbod accordion */}
          <div>
            <button
              onClick={() => setMobileAanbodOpen(v => !v)}
              className={[
                'w-full flex items-center justify-between py-3 text-sm font-medium',
                focusRing,
                aanbodActive ? 'text-studio-black' : 'text-gray-700',
              ].join(' ')}
            >
              Aanbod
              <ChevronDown size={15} strokeWidth={2}
                className={`text-gray-400 transition-transform duration-200 ${mobileAanbodOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={[
              'overflow-hidden transition-all duration-200 ease-in-out',
              mobileAanbodOpen ? 'max-h-52' : 'max-h-0',
            ].join(' ')}>
              <div className="pl-4 pb-2 space-y-0.5">
                {AANBOD.map(item => (
                  <Link key={item.href} href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={[
                      'block py-2 text-sm font-medium transition-colors duration-150', focusRing,
                      isActive(item.href, pathname) ? 'text-studio-black' : 'text-gray-500 hover:text-studio-black',
                    ].join(' ')}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Webshop — standalone */}
          <Link href="/webshop" onClick={() => setMobileOpen(false)} className={mobileLinkCls('/webshop', pathname)}>
            Webshop
          </Link>

          {/* Regular links */}
          {MAIN_LINKS.map(item => (
            <Link key={item.href} href={item.href}
              onClick={() => setMobileOpen(false)}
              className={mobileLinkCls(item.href, pathname)}>
              {item.label}
            </Link>
          ))}

          {/* Account section */}
          {status !== 'loading' && (
            session ? (
              <div className="border-t border-black/5 pt-1">
                {/* Mijn account accordion */}
                <button
                  onClick={() => setMobileAccountOpen(v => !v)}
                  className={[
                    'w-full flex items-center justify-between py-3 text-sm font-medium',
                    focusRing,
                    accountActive ? 'text-studio-black' : 'text-gray-700',
                  ].join(' ')}
                >
                  <span className="flex items-center gap-2.5">
                    <Image
                      src="/avatar.png"
                      alt="Studio Twaalf account"
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full border border-black/10 object-cover"
                    />
                    Mijn account
                  </span>
                  <ChevronDown size={15} strokeWidth={2}
                    className={`text-gray-400 transition-transform duration-200 ${mobileAccountOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={[
                  'overflow-hidden transition-all duration-200 ease-in-out',
                  mobileAccountOpen ? 'max-h-40' : 'max-h-0',
                ].join(' ')}>
                  <div className="pl-4 pb-2 space-y-0.5">
                    {ACCOUNT_ITEMS.map(item => (
                      <Link key={item.href} href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={[
                          'block py-2 text-sm font-medium transition-colors duration-150', focusRing,
                          isActive(item.href, pathname) ? 'text-studio-black' : 'text-gray-500 hover:text-studio-black',
                        ].join(' ')}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
                {/* Log out */}
                <button
                  onClick={handleSignOut}
                  className={[
                    'flex items-center gap-2 py-3 text-sm font-medium border-t border-black/5 w-full',
                    'text-gray-400 hover:text-red-500 transition-colors duration-150',
                    focusRing,
                  ].join(' ')}
                >
                  <LogOut size={15} strokeWidth={2} />
                  Uitloggen
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className={[
                  'block py-3 text-sm font-medium border-t border-black/5',
                  'text-gray-600 hover:text-studio-black transition-colors duration-150',
                  focusRing,
                ].join(' ')}
              >
                Log in
              </Link>
            )
          )}

          {/* Bottom row: DIY tool pill + Instagram */}
          <div className="pt-4 mt-1 border-t border-black/5 flex items-center justify-between">
            <Link
              href="/templates"
              onClick={() => setMobileOpen(false)}
              className={[
                'text-sm font-semibold px-5 py-2.5 rounded-full',
                'border border-black/5 transition-all duration-150',
                focusRing,
                isActive('/templates', pathname)
                  ? 'text-studio-black bg-studio-sand/70'
                  : 'text-studio-black bg-studio-sand/40 hover:bg-studio-sand/70',
              ].join(' ')}
            >
              DIY tool
            </Link>

            <a
              href={IG_URL}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={IG_ARIA}
              onClick={() => setMobileOpen(false)}
              className={[
                'flex items-center gap-2 text-sm font-medium text-gray-500',
                'hover:text-studio-black transition-colors duration-150',
                focusRing,
              ].join(' ')}
            >
              <Instagram size={18} strokeWidth={1.75} />
              <span>Instagram</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
