import { Cookie, LayoutDashboard, LogOut, Menu, PackageCheck, ShieldCheck, ShoppingBag, User, X, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo } from './Logo'
import { Notifications } from './Notifications'
import { Avatar } from './Avatar'

const mainLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/store/cookies', label: 'Beli Cookie', icon: Cookie },
  { to: '/purchases', label: 'Pembelian', icon: ShoppingBag },
  { to: '/profile', label: 'Profil', icon: User },
]

export function AppLayout() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location=useLocation()
  const pageLabel=location.pathname.startsWith('/purchases')?'pembelian':location.pathname.startsWith('/profile')?'profil':location.pathname.startsWith('/admin')?'admin':'dashboard'
  const handleLogout = async () => { await logout(); navigate('/') }
  if (!user) return null
  return <div className="app-shell">
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <div className="sidebar__brand"><Logo /><button className="icon-btn sidebar-close" onClick={() => setOpen(false)} aria-label="Tutup menu"><X /></button></div>
      <div className="sidebar__scroll">
        <nav className="sidebar-nav" aria-label="Navigasi dashboard">
          <span className="sidebar-nav__label">Cookie store</span>
          {mainLinks.map(({to,label,icon:Icon})=><NavLink key={to} end={to==='/dashboard'} to={to} onClick={() => setOpen(false)}><Icon/><span>{label}</span></NavLink>)}
          {user.role === 'admin' && <><span className="sidebar-nav__label">Kontrol</span><NavLink to="/admin" onClick={() => setOpen(false)}><ShieldCheck /><span>Admin control</span></NavLink></>}
        </nav>
        <div className="seller-nudge game-nudge">
          <span className="seller-nudge__art"><Zap /></span><strong>Belanja lebih tenang</strong><p>Stok dan validitas Cookie diperiksa sebelum pesanan dikirim.</p><Link to="/purchases">Lihat pembelian →</Link>
        </div>
      </div>
      <div className="sidebar__profile">
        <Link to="/profile" className="mini-profile"><Avatar className="avatar--sm" src={user.avatarUrl} initials={user.avatar} label={`Foto profil ${user.nickname}`}/><span><strong>{user.nickname}</strong><small>@{user.username}</small></span></Link>
        <button className="icon-btn" onClick={handleLogout} aria-label="Keluar"><LogOut /></button>
      </div>
    </aside>
    {open && <button className="sidebar-scrim" onClick={() => setOpen(false)} aria-label="Tutup menu" />}
    <div className="app-main">
      <header className="app-topbar">
        <button className="icon-btn app-menu" onClick={() => setOpen(true)} aria-label="Buka menu"><Menu /></button>
        <div className="app-topbar__crumb"><span className="topbar-kicker">LANGGOR /</span><span> {pageLabel}</span></div>
        <div className="app-topbar__actions"><Notifications /><Link to="/profile" className="topbar-avatar-link" aria-label="Profil saya"><Avatar className="avatar--sm" src={user.avatarUrl} initials={user.avatar} label={`Foto profil ${user.nickname}`}/></Link></div>
      </header>
      <main className="app-content"><Outlet /></main>
      <nav className="mobile-dock mobile-dock--game" aria-label="Navigasi mobile">
        <NavLink to="/dashboard"><LayoutDashboard /><span>Home</span></NavLink>
        <NavLink to="/store/cookies"><Cookie /><span>Cookie</span></NavLink>
        <NavLink to="/purchases"><PackageCheck /><span>Order</span></NavLink>
        <NavLink to="/profile"><User /><span>Profil</span></NavLink>
      </nav>
    </div>
  </div>
}
