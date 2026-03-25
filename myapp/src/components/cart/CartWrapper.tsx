'use client'

import { CartProvider } from '@/contexts/CartContext'

export default function CartWrapper({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>
}
