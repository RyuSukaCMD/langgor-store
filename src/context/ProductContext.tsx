import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { products as seedProducts } from '../data'
import { api } from '../lib/api'
import type { Product } from '../types'

type ProductContextValue = {
  products: Product[]
  loading: boolean
  refreshProducts: () => Promise<void>
}

const ProductContext = createContext<ProductContextValue | null>(null)

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(seedProducts)
  const [loading, setLoading] = useState(true)

  const refreshProducts = useCallback(async () => {
    try {
      const result = await api<{ products: Product[] }>('/products')
      setProducts(result.products)
    } catch {
      // Keep the bundled catalog as a resilient read-only fallback.
      setProducts(current => current.length ? current : seedProducts)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refreshProducts() }, [refreshProducts])

  return <ProductContext.Provider value={{ products, loading, refreshProducts }}>{children}</ProductContext.Provider>
}

export function useProducts() {
  const value = useContext(ProductContext)
  if (!value) throw new Error('useProducts must be used inside ProductProvider')
  return value
}
