import { Bell, Check, CheckCheck, Package, Shield, ShoppingBag, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import type { Notification } from '../types'

export function Notifications() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [loading,setLoading]=useState(true)
  const ref = useRef<HTMLDivElement>(null)
  const unread = items.filter(item => !item.read).length

  useEffect(()=>{api<{notifications:Notification[]}>('/notifications').then(result=>setItems(result.notifications)).catch(()=>setItems([])).finally(()=>setLoading(false))},[])
  useEffect(() => { const handle = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false) };document.addEventListener('mousedown', handle);return () => document.removeEventListener('mousedown', handle) }, [])

  const markOne=async(id:string)=>{setItems(list=>list.map(item=>item.id===id?{...item,read:true}:item));await api(`/notifications/${id}/read`,{method:'PATCH'}).catch(()=>undefined)}
  const markAll=async()=>{setItems(list=>list.map(item=>({...item,read:true})));await api('/notifications/read-all',{method:'POST'}).catch(()=>undefined)}

  return <div className="notification-wrap" ref={ref}>
    <button className="icon-btn" onClick={() => setOpen(value => !value)} aria-label={`Notifikasi, ${unread} belum dibaca`} aria-expanded={open}><Bell />{unread > 0 && <span className="notification-dot">{unread}</span>}</button>
    {open && <div className="notification-panel" role="dialog" aria-label="Notifikasi">
      <div className="notification-panel__head"><div><span className="eyebrow">UPDATE AKUN</span><h3>Notifikasi</h3></div><button className="icon-btn icon-btn--sm" onClick={() => setOpen(false)} aria-label="Tutup"><X /></button></div>
      <div className="notification-panel__list">
        {loading?<div className="notification-empty">Memuat notifikasi…</div>:items.length?items.map(item => <button key={item.id} className={`notification-item ${!item.read ? 'is-unread' : ''}`} onClick={() => void markOne(item.id)}><span className={`notification-item__icon tone-${item.type}`}>{item.type === 'security' ? <Shield /> : item.type === 'success' ? <Check /> : item.type==='warning'?<Package/>:<ShoppingBag />}</span><span><strong>{item.title}</strong><span>{item.message}</span><small>{item.time} lalu</small></span></button>):<div className="notification-empty">Belum ada notifikasi.</div>}
      </div>
      <button className="notification-panel__all" onClick={() => void markAll()} disabled={!unread}><CheckCheck /> Tandai semua sudah dibaca</button>
    </div>}
  </div>
}
