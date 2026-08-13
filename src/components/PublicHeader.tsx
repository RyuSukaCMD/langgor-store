import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo } from './Logo'

export function PublicHeader() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  return <header className="public-header">
    <div className="container public-header__inner">
      <Logo />
      <nav className={`public-nav ${open ? 'is-open' : ''}`} aria-label="Navigasi utama">
        <NavLink to="/store/cookies" onClick={() => setOpen(false)}>Cookie Store</NavLink>
        <NavLink to="/store/accounts" onClick={() => setOpen(false)}>Account Market</NavLink>
        <a href="/#cara-kerja" onClick={() => setOpen(false)}>Cara kerja</a>
        <div className="public-nav__mobile-actions">
          <Link className="btn btn--secondary" to="/login">Masuk</Link>
          <Link className="btn btn--primary" to="/register">Buat akun</Link>
        </div>
      </nav>
      <div className="public-header__actions">
        {user ? <Link className="btn btn--primary btn--sm" to="/dashboard">Buka dashboard</Link> : <><Link className="text-link" to="/login">Masuk</Link><Link className="btn btn--primary btn--sm" to="/register">Buat akun</Link></>}
        <button className="icon-btn menu-toggle" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label="Buka navigasi">{open ? <X /> : <Menu />}</button>
      </div>
    </div>
  </header>
}
