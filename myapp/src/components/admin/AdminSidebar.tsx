'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/admin/login/actions'

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconTemplates() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function IconGadgets() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
    </svg>
  )
}

function IconFolder() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  )
}

function IconInbox() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function IconShop() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 2.7A1 1 0 007 17h10m-10 0a2 2 0 104 0m6 0a2 2 0 104 0" />
    </svg>
  )
}

// ── Nav helpers ───────────────────────────────────────────────────────────────

const baseItem = 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors'
const inactiveItem = 'text-[#B8A98C] hover:text-white hover:bg-white/[0.07]'
const activeItem = 'text-white bg-white/10'

const baseSubItem = 'flex items-center gap-2 pl-8 py-1.5 pr-3 rounded-lg text-xs font-medium transition-colors'
const inactiveSub = 'text-[#8B7B5E] hover:text-[#C4B49A]'
const activeSub = 'text-[#C4B49A]'

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminSidebar() {
  const pathname = usePathname()

  // Active: exact match OR starts with href/ — but /admin/gadgets/categories
  // should NOT activate the parent /admin/gadgets top-level link
  function isActive(href: string, exact = false): boolean {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Gadgets section active = on /admin/gadgets but NOT under /categories
  const gadgetsActive = isActive('/admin/gadgets') && !pathname.startsWith('/admin/gadgets/categories')
  const categoriesActive = pathname.startsWith('/admin/gadgets/categories')

  // Webshop sub-items
  const shopCategorieenActive = pathname.startsWith('/admin/producten/categorieen')
  const productenActive       = isActive('/admin/producten') && !shopCategorieenActive

  return (
    <aside className="fixed inset-y-0 left-0 w-56 bg-[#2C2416] flex flex-col z-20 select-none">

      {/* ── Brand mark ─────────────────────────────────────────────────── */}
      <div className="px-4 pt-6 pb-5">
        <Link
          href="/admin/templates"
          className="block hover:opacity-80 transition-opacity"
        >
          <span className="block font-serif text-white text-[15px] leading-tight tracking-[-0.01em]">
            Studio Twaalf
          </span>
        </Link>
        <span className="mt-1 inline-block text-[10px] font-medium tracking-[0.18em] uppercase text-[#6B5C42]">
          Admin
        </span>
      </div>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div className="mx-4 border-t border-white/[0.08]" />

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">

        {/* Templates */}
        <Link
          href="/admin/templates"
          className={[baseItem, isActive('/admin/templates') ? activeItem : inactiveItem].join(' ')}
        >
          <IconTemplates />
          Templates
        </Link>

        {/* Gadgets */}
        <Link
          href="/admin/gadgets"
          className={[baseItem, gadgetsActive ? activeItem : inactiveItem].join(' ')}
        >
          <IconGadgets />
          Gadgets
        </Link>

        {/* Categorieën — sub-item, always visible */}
        <Link
          href="/admin/gadgets/categories"
          className={[baseSubItem, categoriesActive ? activeSub : inactiveSub].join(' ')}
        >
          <IconFolder />
          Categorieën
        </Link>

        {/* Divider */}
        <div className="mx-1 my-2 border-t border-white/[0.06]" />

        {/* ── Webshop section label ───────────────────────────────────── */}
        <p className="px-3 pt-1 pb-0.5 text-[9px] font-bold tracking-[0.18em] uppercase text-[#4A3E2A]">
          Webshop
        </p>

        {/* Producten */}
        <Link
          href="/admin/producten"
          className={[baseItem, productenActive ? activeItem : inactiveItem].join(' ')}
        >
          <IconShop />
          Producten
        </Link>

        {/* Categorieën — webshop categories sub-item */}
        <Link
          href="/admin/producten/categorieen"
          className={[baseSubItem, shopCategorieenActive ? activeSub : inactiveSub].join(' ')}
        >
          <IconFolder />
          Categorieën
        </Link>

        {/* Bestellingen — shop orders */}
        <Link
          href="/admin/bestellingen"
          className={[baseItem, isActive('/admin/bestellingen') ? activeItem : inactiveItem].join(' ')}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Bestellingen
        </Link>

        {/* Divider */}
        <div className="mx-1 my-2 border-t border-white/[0.06]" />

        {/* Offertes */}
        <Link
          href="/admin/offertes"
          className={[baseItem, isActive('/admin/offertes') ? activeItem : inactiveItem].join(' ')}
        >
          <IconInbox />
          Offertes
        </Link>

      </nav>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div className="mx-4 border-t border-white/[0.08]" />

      {/* ── Sign out ───────────────────────────────────────────────────── */}
      <div className="px-2 py-4">
        <form action={logoutAction}>
          <button
            type="submit"
            className={[baseItem, 'w-full text-left', inactiveItem].join(' ')}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Uitloggen
          </button>
        </form>
      </div>

    </aside>
  )
}
