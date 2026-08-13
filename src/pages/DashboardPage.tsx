import { ArrowRight, ArrowUpRight, Check, Clock3, Cookie, CreditCard, PackageCheck, Pencil, Plus, ShoppingBag, Sparkles, UserRound, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { recentOrders, rupiah } from '../data'
import { timeGreeting } from '../lib/format'

export function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null
  return <div className="dashboard-page page-enter">
    <section className="dash-welcome">
      <div><span className="eyebrow"><i /> KAMIS, 13 AGUSTUS</span><h1>{timeGreeting()}, {user.nickname.split(' ')[0]} <span>✦</span></h1><p>Ada satu pesanan yang sedang diproses. Selebihnya aman.</p></div>
      <Link className="btn btn--primary" to="/store/cookies"><ShoppingBag /> Jelajahi store</Link>
    </section>

    <section className="dash-grid">
      <article className="balance-panel">
        <div className="balance-panel__head"><span><WalletCards /> LANGGOR BALANCE</span><button className="icon-btn icon-btn--sm" aria-label="Tambah saldo"><Plus /></button></div>
        <strong>{rupiah(user.balance)}</strong><p>Siap dipakai untuk checkout berikutnya.</p>
        <div className="balance-panel__foot"><span><i /> Saldo aktif</span><button>Tambah saldo <ArrowUpRight /></button></div>
        <div className="balance-orb" />
      </article>
      <div className="stats-pair">
        <article className="stat-note"><span className="stat-note__icon violet"><ShoppingBag /></span><span><small>TOTAL PEMBELIAN</small><strong>12</strong><em>+3 bulan ini</em></span></article>
        <article className="stat-note"><span className="stat-note__icon cyan"><PackageCheck /></span><span><small>PRODUK AKTIF</small><strong>2</strong><em>Semua dapat diakses</em></span></article>
      </div>
      <article className="activity-card">
        <div className="card-heading"><div><span className="eyebrow">STATUS TERBARU</span><h2>Satu masih berjalan.</h2></div><span className="pulse-label"><i /> Live</span></div>
        <div className="status-track"><span className="done"><Check /></span><i className="done"/><span className="active"><Clock3 /></span><i/><span><PackageCheck /></span></div>
        <div className="status-track__labels"><span><b>Bayar</b><small>09 Agu, 14:21</small></span><span><b>Diproses</b><small>Seller menyiapkan</small></span><span><b>Selesai</b><small>Menunggu</small></span></div>
        <Link to="/purchases">Lihat detail LGR-82775 <ArrowRight /></Link>
      </article>
    </section>

    <section className="quick-section"><div className="section-title-inline"><span className="eyebrow">JALUR CEPAT</span><span>Yang sering kamu butuhkan.</span></div><div className="quick-actions">
      <Link to="/store/cookies"><span className="quick-actions__icon violet"><Cookie /></span><span><strong>Beli cookie</strong><small>Lihat stok terbaru</small></span><ArrowUpRight /></Link>
      <Link to="/store/accounts"><span className="quick-actions__icon pink"><UserRound /></span><span><strong>Cari akun</strong><small>Listing terverifikasi</small></span><ArrowUpRight /></Link>
      <Link to="/purchases"><span className="quick-actions__icon cyan"><CreditCard /></span><span><strong>Pembelian</strong><small>Riwayat & delivery</small></span><ArrowUpRight /></Link>
      <Link to="/profile"><span className="quick-actions__icon amber"><Pencil /></span><span><strong>Edit profil</strong><small>Avatar & identitas</small></span><ArrowUpRight /></Link>
    </div></section>

    <section className="dash-lower">
      <article className="recent-panel"><div className="card-heading"><div><span className="eyebrow">AKTIVITAS TRANSAKSI</span><h2>Pembelian terakhir</h2></div><Link to="/purchases">Lihat semua <ArrowRight /></Link></div>
        <div className="order-list">{recentOrders.map(order => <div className="order-row" key={order.id}><span className="order-icon">{order.productIcon}</span><span className="order-name"><strong>{order.productName}</strong><small>{order.id} • {order.date}</small></span><strong className="order-price">{rupiah(order.price)}</strong><StatusBadge status={order.status}/><button className="icon-btn icon-btn--sm" aria-label={`Buka ${order.id}`}><ArrowUpRight /></button></div>)}</div>
      </article>
      <article className="account-card">
        <div className="account-banner"><span className="banner-grid"/><button className="icon-btn icon-btn--sm" aria-label="Edit profil"><Pencil /></button></div>
        <div className="account-card__body"><span className="avatar avatar--xl">{user.avatar}</span><div className="account-card__identity"><span><strong>{user.nickname}</strong><em><Check /></em></span><small>@{user.username}</small></div><p>{user.bio}</p><div className="account-card__meta"><span><small>ROLE</small><strong>Verified seller</strong></span><span><small>BERGABUNG</small><strong>Mei 2025</strong></span></div><Link className="btn btn--secondary" to="/profile">Kelola profil <ArrowRight /></Link></div>
      </article>
    </section>
  </div>
}
