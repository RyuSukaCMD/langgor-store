import { BarChart3, Compass, Cookie, LayoutDashboard, LogOut, Menu, Package, PlusCircle, Settings, ShieldCheck, ShoppingBag, Store, User, Users, WalletCards, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo } from './Logo'
import { Notifications } from './Notifications'

const mainLinks = [
  { to: '/dashboard', label: 'Ringkasan', icon: LayoutDashboard },
  { to: '/store/cookies', label: 'Cookie Store', icon: Cookie },
  { to: '/store/accounts', label: 'Account Market', icon: Compass },
  { to: '/purchases', label: 'Pembelian', icon: ShoppingBag },
]
const sellerLinks = [
  { to: '/seller', label: 'Ruang Seller', icon: Store },
  { to: '/seller/new', label: 'Buat listing', icon: PlusCircle },
]

export function AppLayout() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = async () => { await logout(); navigate('/') }
  if (!user) return null
  const renderLink = ({ to, label, icon: Icon }: { to: string; label: string; icon: typeof LayoutDashboard }) => <NavLink key={to} end={to === '/dashboard' || to === '/seller'} to={to} onClick={() => setOpen(false)}><Icon /><span>{label}</span></NavLink>
  return <div className="app-shell">
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <div className="sidebar__brand"><Logo /><button className="icon-btn sidebar-close" onClick={() => setOpen(false)} aria-label="Tutup menu"><X /></button></div>
      <div className="sidebar__scroll">
        <nav className="sidebar-nav" aria-label="Navigasi dashboard">
          <span className="sidebar-nav__label">Workspace</span>
          {mainLinks.map(renderLink)}
          <span className="sidebar-nav__label">Jualan</span>
          {sellerLinks.map(renderLink)}
          {user.role === 'admin' && <><span className="sidebar-nav__label">Kontrol</span><NavLink to="/admin" onClick={() => setOpen(false)}><ShieldCheck /><span>Admin panel</span></NavLink></>}
        </nav>
        <div className="seller-nudge">
          <span className="seller-nudge__art"><BarChart3 /></span><strong>Penjualanmu naik 12%</strong><p>Lihat produk yang paling sering dibeli minggu ini.</p><Link to="/seller">Buka laporan →</Link>
        </div>
      </div>
      <div className="sidebar__profile">
        <Link to="/profile" className="mini-profile"><span className="avatar avatar--sm">{user.avatar}</span><span><strong>{user.nickname}</strong><small>@{user.username}</small></span></Link>
        <button className="icon-btn" onClick={handleLogout} aria-label="Keluar"><LogOut /></button>
      </div>
    </aside>
    {open && <button className="sidebar-scrim" onClick={() => setOpen(false)} aria-label="Tutup menu" />}
    <div className="app-main">
      <header className="app-topbar">
        <button className="icon-btn app-menu" onClick={() => setOpen(true)} aria-label="Buka menu"><Menu /></button>
        <div className="app-topbar__crumb"><span className="topbar-kicker">LANGGOR /</span><span> personal space</span></div>
        <div className="app-topbar__actions"><Notifications /><Link to="/profile" className="avatar avatar--sm" aria-label="Profil saya">{user.avatar}</Link></div>
      </header>
      <main className="app-content"><Outlet /></main>
      <nav className="mobile-dock" aria-label="Navigasi mobile">
        <NavLink to="/dashboard"><LayoutDashboard /><span>Home</span></NavLink>
        <NavLink to="/store/cookies"><Cookie /><span>Cookie</span></NavLink>
        <NavLink to="/store/accounts"><Package /><span>Akun</span></NavLink>
        <NavLink to="/seller"><WalletCards /><span>Seller</span></NavLink>
        <NavLink to="/profile"><User /><span>Profil</span></NavLink>
      </nav>
    </div>
  </div>
}
