import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import type { Product } from '../types'

type ProductContextValue = {
  products: Product[]
  loading: boolean
  error: string
  refreshProducts: () => Promise<void>
}

const ProductContext = createContext<ProductContextValue | null>(null)

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await api<{ products: Product[]; configured?: boolean; message?: string }>('/products')
      setProducts(result.products)
      if (result.configured === false) setError(result.message || 'Katalog belum dapat digunakan.')
    } catch (reason) {
      setProducts([])
      setError(reason instanceof Error ? reason.message : 'Katalog tidak dapat dimuat.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refreshProducts() }, [refreshProducts])

  return <ProductContext.Provider value={{ products, loading, error, refreshProducts }}>{children}</ProductContext.Provider>
}

export function useProducts() {
  const value = useContext(ProductContext)
  if (!value) throw new Error('useProducts must be used inside ProductProvider')
  return value
}
