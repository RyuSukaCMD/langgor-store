import type { Notification, Order, Product } from './types'

export const products: Product[] = [
  {
    id: 'cookie-basic', name: 'Cookie Basic', kind: 'cookie', category: 'Starter',
    description: 'Akses game untuk satu perangkat dengan verifikasi unik dan konfirmasi dua langkah sebelum cookie diterbitkan.',
    price: 25000, stock: 999, status: 'ready', seller: { name: 'Langgor Game', username: 'langgor', verified: true, rating: 4.9 },
    rating: 4.9, sold: 1284, createdAt: '2026-08-13',
    specs: ['Aktif 7 hari', '1 perangkat aktif', 'Verifikasi unik', '2-step verification'], icon: 'B', accent: 'cyan'
  },
  {
    id: 'cookie-premkum', name: 'Cookie Premkum', kind: 'cookie', category: 'Most Played',
    description: 'Durasi lebih panjang untuk pemain rutin, dengan dua slot perangkat dan antrean verifikasi prioritas.',
    price: 59000, stock: 999, status: 'ready', seller: { name: 'Langgor Game', username: 'langgor', verified: true, rating: 4.9 },
    rating: 4.9, sold: 2461, createdAt: '2026-08-13',
    specs: ['Aktif 30 hari', '2 perangkat aktif', 'Verifikasi prioritas', 'Riwayat sesi 30 hari'], icon: 'P', accent: 'violet'
  },
  {
    id: 'cookie-ultra', name: 'Cookie Ultra', kind: 'cookie', category: 'Full Access',
    description: 'Paket durasi panjang dengan tiga slot perangkat, pemulihan sesi cepat, dan prioritas aktivasi tertinggi.',
    price: 129000, stock: 999, status: 'ready', seller: { name: 'Langgor Game', username: 'langgor', verified: true, rating: 5 },
    rating: 5, sold: 903, createdAt: '2026-08-13',
    specs: ['Aktif 90 hari', '3 perangkat aktif', 'Fast session recovery', 'Prioritas aktivasi tertinggi'], icon: 'U', accent: 'pink'
  }
]

export const recentOrders: Order[] = [
  { id: 'LGR-82914', productName: 'Cookie Premkum', productIcon: 'P', date: '12 Agu 2026', price: 59000, status: 'completed' },
  { id: 'LGR-82775', productName: 'Cookie Ultra', productIcon: 'U', date: '9 Agu 2026', price: 129000, status: 'processing' },
  { id: 'LGR-82031', productName: 'Cookie Basic', productIcon: 'B', date: '2 Agu 2026', price: 25000, status: 'completed' }
]

export const initialNotifications: Notification[] = [
  { id: 'n1', type: 'success', title: 'Cookie game sudah aktif', message: 'Verifikasi Cookie Premkum selesai di perangkat utama.', time: '6 menit', read: false },
  { id: 'n2', type: 'info', title: 'Kode unik diterima', message: 'Lanjutkan konfirmasi langkah kedua dari dashboard.', time: '2 jam', read: false },
  { id: 'n3', type: 'security', title: 'Perangkat baru meminta akses', message: 'Permintaan dari Chrome, Sukabumi menunggu persetujuan.', time: 'Kemarin', read: true }
]

export const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
