'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface CartContextValue {
  cartCount: number
  refreshCart: () => void
}

const CartContext = createContext<CartContextValue>({ cartCount: 0, refreshCart: () => {} })

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0)

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart')
      if (!res.ok) return
      const data = await res.json()
      const count: number = (data.items ?? []).reduce(
        (sum: number, item: { quantity: number }) => sum + item.quantity,
        0
      )
      setCartCount(count)
    } catch {
      // ignore network errors
    }
  }, [])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  return (
    <CartContext.Provider value={{ cartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
