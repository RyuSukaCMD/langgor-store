export type ProductKind = 'cookie' | 'account'
export type ProductStatus = 'ready' | 'limited' | 'sold'
export type ProfileEffect = 'none' | 'aurora' | 'stardust' | 'comet' | 'ripple' | 'pixels'
export type ProfileAnimation = 'fade' | 'rise' | 'zoom' | 'slide' | 'flip'

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
  imageUrl?: string
}

export interface User {
  id: string
  username: string
  email: string
  nickname: string
  role: 'user' | 'moderator' | 'admin'
  balance: number
  avatar: string
  bio: string
  joinedAt: string
  accent: string
  accentSecondary?: string
  profileEffect?: ProfileEffect
  profileAnimation?: ProfileAnimation
  avatarUrl?: string
  bannerUrl?: string
}

export interface Order {
  id: string
  productId: string
  productName: string
  productIcon: string
  date: string
  createdAt: string
  price: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded'
}

export interface Notification {
  id: string
  type: 'success' | 'warning' | 'info' | 'security'
  title: string
  message: string
  time: string
  createdAt: string
  read: boolean
}

export interface MaintenanceStatus {
  enabled: boolean
  reason: string
  estimatedEndAt: string | null
  updatedAt: string | null
}
