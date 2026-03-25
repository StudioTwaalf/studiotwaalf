import AccountSidebar from '@/components/account/AccountSidebar'
import AccountMobileNav from '@/components/account/AccountMobileNav'

/**
 * Account inner layout — sidebar + content only.
 *
 * No <header> here. The shared PublicNav is inherited automatically from
 * (public)/layout.tsx, which wraps all routes in this route group.
 * This ensures account pages share exactly the same header as the rest of the site.
 *
 * Layout composition:
 *   RootLayout             (src/app/layout.tsx)
 *     └── PublicLayout     (src/app/(public)/layout.tsx)  ← PublicNav lives here
 *           └── AccountLayout  (this file)                 ← sidebar + content only
 *                 └── page
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#F5F0E8] flex-1">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        {/* Mobile nav — horizontal scroll pills, hidden on lg+ */}
        <div className="mb-6 lg:hidden">
          <AccountMobileNav />
        </div>

        {/* Two-column: sidebar (desktop) + main content */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <AccountSidebar />
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>

      </div>
    </div>
  )
}
