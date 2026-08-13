import type { Notification, Order, Product } from './types'

export const products: Product[] = [
  {
    id: 'cookie-basic', name: 'Cookie Basic', kind: 'cookie', category: 'Normal Cookie',
    description: 'Cookie login dari stok standar dengan pemeriksaan real-time sebelum dikirim otomatis.',
    price: 6000, stock: 13, status: 'ready', seller: { name: 'Langgor Store', username: 'langgor', verified: true, rating: 4.9 },
    rating: 4.9, sold: 6284, createdAt: '2026-08-13',
    specs: ['1 Cookie login', 'Stok random standar', 'Pemeriksaan real-time', 'Pengiriman otomatis'], icon: 'B', accent: 'cyan'
  },
  {
    id: 'cookie-premkum', name: 'Cookie Premkum', kind: 'cookie', category: 'Highest Cookie',
    description: 'Cookie login dari kelompok stok dengan kriteria lebih tinggi dan prioritas pengiriman.',
    price: 12000, stock: 8, status: 'ready', seller: { name: 'Langgor Store', username: 'langgor', verified: true, rating: 4.9 },
    rating: 4.9, sold: 5461, createdAt: '2026-08-13',
    specs: ['1 Cookie login', 'Kriteria lebih tinggi', 'Prioritas stok', 'Pengiriman otomatis'], icon: 'P', accent: 'violet'
  },
  {
    id: 'cookie-ultra', name: 'Cookie Ultra', kind: 'cookie', category: 'Top Stock',
    description: 'Pilihan Cookie login dari stok teratas dengan prioritas validasi dan delivery tertinggi.',
    price: 25000, stock: 4, status: 'limited', seller: { name: 'Langgor Store', username: 'langgor', verified: true, rating: 5 },
    rating: 5, sold: 3747, createdAt: '2026-08-13',
    specs: ['1 Cookie login', 'Kriteria stok teratas', 'Validasi prioritas', 'Pengiriman otomatis'], icon: 'U', accent: 'pink'
  }
]

export const recentOrders: Order[] = [
  { id: 'LGR-82914', productName: 'Cookie Premkum', productIcon: 'P', date: '12 Agu 2026', price: 12000, status: 'completed' },
  { id: 'LGR-82775', productName: 'Cookie Ultra', productIcon: 'U', date: '9 Agu 2026', price: 25000, status: 'processing' },
  { id: 'LGR-82031', productName: 'Cookie Basic', productIcon: 'B', date: '2 Agu 2026', price: 6000, status: 'completed' }
]

export const initialNotifications: Notification[] = [
  { id: 'n1', type: 'success', title: 'Cookie siap diambil', message: 'Cookie Premkum sudah lolos validasi real-time.', time: '6 menit', read: false },
  { id: 'n2', type: 'info', title: 'Pembayaran diterima', message: 'Sistem sedang memilih stok dan memeriksa Cookie.', time: '2 jam', read: false },
  { id: 'n3', type: 'security', title: 'Delivery dibuka', message: 'Detail Cookie hanya dapat dilihat dari transaksi milikmu.', time: 'Kemarin', read: true }
]

export const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
