import { Gamepad2, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { Logo } from './Logo'

export function PublicHeader() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  return <motion.header className="public-header game-header" initial={{ y: -64 }} animate={{ y: 0 }} transition={{ duration: .45, ease: [0.22,1,0.36,1] }}>
    <div className="container public-header__inner">
      <Logo />
      <nav className={`public-nav ${open ? 'is-open' : ''}`} aria-label="Navigasi utama">
        <NavLink to="/store/cookies" onClick={() => setOpen(false)}>Pilih Cookie</NavLink>
        <a href="/#cara-aktif" onClick={() => setOpen(false)}>Cara aktif</a>
        <a href="/#keamanan" onClick={() => setOpen(false)}>Keamanan</a>
        <a href="/#faq" onClick={() => setOpen(false)}>FAQ</a>
        <div className="public-nav__mobile-actions">
          <Link className="btn btn--secondary" to="/login">Masuk</Link>
          <Link className="btn btn--primary" to="/register">Buat ID</Link>
        </div>
      </nav>
      <div className="public-header__actions">
        {user ? <Link className="btn btn--primary btn--sm" to="/dashboard"><Gamepad2/> Buka game hub</Link> : <><Link className="text-link" to="/login">Masuk</Link><Link className="btn btn--primary btn--sm" to="/register">Buat Langgor ID</Link></>}
        <button className="icon-btn menu-toggle" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label="Buka navigasi">{open ? <X /> : <Menu />}</button>
      </div>
    </div>
  </motion.header>
}
