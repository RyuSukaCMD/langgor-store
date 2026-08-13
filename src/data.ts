import type { Notification, Order, Product } from './types'

export const products: Product[] = [
  {
    id: 'cookie-stream-plus', name: 'Stream Plus 30 Hari', kind: 'cookie', category: 'Streaming',
    description: 'Cookie browser teruji untuk akses paket individual. Panduan instalasi tersedia setelah pembelian.',
    price: 29000, stock: 18, status: 'ready', seller: { name: 'Ruang Digital', username: 'ruangdigital', verified: true, rating: 4.9 },
    rating: 4.9, sold: 342, createdAt: '2026-08-12', specs: ['Masa akses 30 hari', '1 perangkat', 'Garansi login 3 hari', 'Panduan browser'], icon: '▶', accent: 'violet'
  },
  {
    id: 'cookie-design-pro', name: 'Design Pro Workspace', kind: 'cookie', category: 'Design',
    description: 'Akses workspace desain untuk kebutuhan konten harian. Aktivasi cepat dan instruksi ringkas.',
    price: 19000, stock: 7, status: 'limited', seller: { name: 'PixelKita', username: 'pixelkita', verified: true, rating: 4.8 },
    rating: 4.8, sold: 189, createdAt: '2026-08-11', specs: ['Workspace shared', 'Akses 30 hari', 'Template tersedia', 'Garansi 2 hari'], icon: '✦', accent: 'pink'
  },
  {
    id: 'cookie-music-wave', name: 'Music Wave Family', kind: 'cookie', category: 'Music',
    description: 'Slot family untuk dengar musik tanpa iklan. Proses masuk dibantu oleh seller.',
    price: 14000, stock: 24, status: 'ready', seller: { name: 'NadaBox', username: 'nadabox', verified: true, rating: 4.7 },
    rating: 4.7, sold: 516, createdAt: '2026-08-10', specs: ['Akses 1 bulan', 'Tanpa iklan', 'Kualitas audio tinggi', '1 akun'], icon: '♫', accent: 'cyan'
  },
  {
    id: 'cookie-vpn-guard', name: 'VPN Guard Multi Region', kind: 'cookie', category: 'Utility',
    description: 'Akses VPN untuk kebutuhan browsing pada lima perangkat dengan server multi-region.',
    price: 35000, stock: 12, status: 'ready', seller: { name: 'NetPagi', username: 'netpagi', verified: false, rating: 4.6 },
    rating: 4.6, sold: 92, createdAt: '2026-08-08', specs: ['5 perangkat', '20+ region', 'Masa aktif 30 hari', 'Garansi akses'], icon: '◈', accent: 'amber'
  },
  {
    id: 'account-game-valor-87', name: 'Valor Rank Ascendant • 87 Skin', kind: 'account', category: 'Gaming',
    description: 'Akun personal build lama dengan koleksi skin lengkap. Kepemilikan dan histori telah diperiksa.',
    price: 1250000, stock: 1, status: 'limited', seller: { name: 'Pandu Plays', username: 'panduplays', verified: true, rating: 4.9 },
    rating: 4.9, sold: 28, createdAt: '2026-08-12', specs: ['Rank Ascendant', '87 skin', 'Region AP', 'Email dapat diganti'], icon: 'V', accent: 'violet'
  },
  {
    id: 'account-creator-42k', name: 'Creator Hub • 42K Followers', kind: 'account', category: 'Social Media',
    description: 'Akun kreator niche teknologi dengan audiens Indonesia aktif dan insight 30 hari terverifikasi.',
    price: 3750000, stock: 1, status: 'ready', seller: { name: 'SocialBench', username: 'socialbench', verified: true, rating: 4.8 },
    rating: 4.8, sold: 7, createdAt: '2026-08-09', specs: ['42K followers', 'Niche teknologi', 'ER 5.8%', 'Indonesia 78%'], icon: '@', accent: 'pink'
  },
  {
    id: 'account-dev-tools', name: 'Dev Tools Workspace Team', kind: 'account', category: 'Productivity',
    description: 'Workspace legal dengan tiga seat kosong untuk tim kecil. Transfer kepemilikan didampingi seller.',
    price: 685000, stock: 3, status: 'ready', seller: { name: 'Kerja Ringkas', username: 'kerjaringkas', verified: true, rating: 5 },
    rating: 5, sold: 41, createdAt: '2026-08-07', specs: ['3 seat tersedia', 'Plan tahunan', 'Transfer owner', 'Invoice tersedia'], icon: '⌘', accent: 'cyan'
  },
  {
    id: 'account-game-farm', name: 'Farm Life Level 118', kind: 'account', category: 'Gaming',
    description: 'Akun game kasual level tinggi dengan item event lengkap dan progres pulau terbuka.',
    price: 420000, stock: 1, status: 'ready', seller: { name: 'Kebun Sore', username: 'kebunsore', verified: false, rating: 4.5 },
    rating: 4.5, sold: 13, createdAt: '2026-08-05', specs: ['Level 118', '16 item event', 'Server Asia', 'Bind dapat dipindah'], icon: '♟', accent: 'amber'
  }
]

export const recentOrders: Order[] = [
  { id: 'LGR-82914', productName: 'Stream Plus 30 Hari', productIcon: '▶', date: '12 Agu 2026', price: 29000, status: 'completed' },
  { id: 'LGR-82775', productName: 'Design Pro Workspace', productIcon: '✦', date: '9 Agu 2026', price: 19000, status: 'processing' },
  { id: 'LGR-82031', productName: 'Music Wave Family', productIcon: '♫', date: '2 Agu 2026', price: 14000, status: 'completed' }
]

export const initialNotifications: Notification[] = [
  { id: 'n1', type: 'success', title: 'Produk siap diakses', message: 'Stream Plus sudah tersedia di pembelianmu.', time: '6 menit', read: false },
  { id: 'n2', type: 'info', title: 'Listing disetujui', message: 'VPN Guard Multi Region sudah tayang.', time: '2 jam', read: false },
  { id: 'n3', type: 'security', title: 'Login baru', message: 'Sesi baru terdeteksi dari Chrome, Sukabumi.', time: 'Kemarin', read: true }
]

export const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
