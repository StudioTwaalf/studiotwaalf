import Link from 'next/link'
import Image from 'next/image'
import PublicNav from '@/components/PublicNav'
import CartWrapper from '@/components/cart/CartWrapper'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartWrapper>
    <div className="min-h-screen bg-studio-beige flex flex-col">
      <PublicNav />

      <div className="flex-1">
        {children}
      </div>

      <footer className="border-t border-studio-sand/40 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <Link href="/" className="hover:opacity-70 transition-opacity">
            <Image
              src="/logo/logo.png"
              alt="Studio Twaalf"
              width={120}
              height={32}
              className="h-6 w-auto"
            />
          </Link>
          <Link
            href="/admin/templates"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Admin
          </Link>
        </div>
      </footer>
    </div>
    </CartWrapper>
  )
}
