export type ProductKind = 'cookie' | 'account'
export type ProductStatus = 'ready' | 'limited' | 'sold'

export interface Product {
  id: string
  name: string
  kind: ProductKind
  category: string
  description: string
  price: number
  stock: number
  status: ProductStatus
  seller: { name: string; username: string; verified: boolean; rating: number }
  rating: number
  sold: number
  createdAt: string
  specs: string[]
  icon: string
  accent: 'violet' | 'pink' | 'cyan' | 'amber'
}

export interface User {
  id: string
  username: string
  email: string
  nickname: string
  role: 'user' | 'seller' | 'admin'
  balance: number
  avatar: string
  bio: string
  joinedAt: string
  accent: string
  seller: boolean
}

export interface Order {
  id: string
  productName: string
  productIcon: string
  date: string
  price: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded'
}

export interface Notification {
  id: string
  type: 'success' | 'warning' | 'info' | 'security'
  title: string
  message: string
  time: string
  read: boolean
}
