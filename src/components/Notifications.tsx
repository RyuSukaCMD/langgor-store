import { Bell, Check, CheckCheck, Shield, ShoppingBag, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { initialNotifications } from '../data'
import type { Notification } from '../types'

export function Notifications() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>(initialNotifications)
  const ref = useRef<HTMLDivElement>(null)
  const unread = items.filter(n => !n.read).length
  useEffect(() => {
    const handle = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])
  const markAll = () => setItems(list => list.map(n => ({ ...n, read: true })))
  return <div className="notification-wrap" ref={ref}>
    <button className="icon-btn" onClick={() => setOpen(v => !v)} aria-label={`Notifikasi, ${unread} belum dibaca`} aria-expanded={open}>
      <Bell />{unread > 0 && <span className="notification-dot">{unread}</span>}
    </button>
    {open && <div className="notification-panel" role="dialog" aria-label="Notifikasi">
      <div className="notification-panel__head"><div><span className="eyebrow">Update akun</span><h3>Notifikasi</h3></div><button className="icon-btn icon-btn--sm" onClick={() => setOpen(false)} aria-label="Tutup"><X /></button></div>
      <div className="notification-panel__list">
        {items.map(item => <button key={item.id} className={`notification-item ${!item.read ? 'is-unread' : ''}`} onClick={() => setItems(list => list.map(n => n.id === item.id ? { ...n, read: true } : n))}>
          <span className={`notification-item__icon tone-${item.type}`}>{item.type === 'security' ? <Shield /> : item.type === 'success' ? <Check /> : <ShoppingBag />}</span>
          <span><strong>{item.title}</strong><span>{item.message}</span><small>{item.time} lalu</small></span>
        </button>)}
      </div>
      <button className="notification-panel__all" onClick={markAll} disabled={!unread}><CheckCheck /> Tandai semua sudah dibaca</button>
    </div>}
  </div>
}
