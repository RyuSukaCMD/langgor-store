import { Cookie, Gamepad2, LayoutDashboard, LogOut, Menu, ShieldCheck, ShoppingBag, User, X, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo } from './Logo'
import { Notifications } from './Notifications'

const mainLinks = [
  { to: '/dashboard', label: 'Game Hub', icon: LayoutDashboard },
  { to: '/store/cookies', label: 'Pilih Cookie', icon: Cookie },
  { to: '/purchases', label: 'Cookie Saya', icon: Gamepad2 },
  { to: '/profile', label: 'Langgor ID', icon: User },
]

export function AppLayout() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = async () => { await logout(); navigate('/') }
  if (!user) return null
  return <div className="app-shell">
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <div className="sidebar__brand"><Logo /><button className="icon-btn sidebar-close" onClick={() => setOpen(false)} aria-label="Tutup menu"><X /></button></div>
      <div className="sidebar__scroll">
        <nav className="sidebar-nav" aria-label="Navigasi Game Hub">
          <span className="sidebar-nav__label">Game access</span>
          {mainLinks.map(({to,label,icon:Icon})=><NavLink key={to} end={to==='/dashboard'} to={to} onClick={() => setOpen(false)}><Icon/><span>{label}</span></NavLink>)}
          {user.role === 'admin' && <><span className="sidebar-nav__label">Kontrol</span><NavLink to="/admin" onClick={() => setOpen(false)}><ShieldCheck /><span>Admin control</span></NavLink></>}
        </nav>
        <div className="seller-nudge game-nudge">
          <span className="seller-nudge__art"><Zap /></span><strong>Game Gate aktif</strong><p>Tidak ada request perangkat asing pada sesi Langgor ID-mu.</p><Link to="/purchases">Periksa sesi →</Link>
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
        <div className="app-topbar__crumb"><span className="topbar-kicker">LANGGOR /</span><span> game hub</span></div>
        <div className="app-topbar__actions"><Notifications /><Link to="/profile" className="avatar avatar--sm" aria-label="Profil saya">{user.avatar}</Link></div>
      </header>
      <main className="app-content"><Outlet /></main>
      <nav className="mobile-dock mobile-dock--game" aria-label="Navigasi mobile">
        <NavLink to="/dashboard"><LayoutDashboard /><span>Hub</span></NavLink>
        <NavLink to="/store/cookies"><Cookie /><span>Cookie</span></NavLink>
        <NavLink to="/purchases"><ShoppingBag /><span>Sesi</span></NavLink>
        <NavLink to="/profile"><User /><span>ID</span></NavLink>
      </nav>
    </div>
  </div>
}
