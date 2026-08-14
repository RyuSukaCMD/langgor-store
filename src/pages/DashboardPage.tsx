import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Check, Cookie, PackageCheck, Plus, Radar, RefreshCw, ShieldCheck, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { rupiah } from '../data'
import { api } from '../lib/api'
import { timeGreeting } from '../lib/format'
import type { Order } from '../types'

export function DashboardPage() {
  const { user } = useAuth()
  const reduceMotion = useReducedMotion()
  const [orders,setOrders]=useState<Order[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const load=()=>{setLoading(true);setError('');api<{orders:Order[]}>('/orders').then(result=>setOrders(result.orders)).catch(reason=>setError(reason instanceof Error?reason.message:'Data gagal dimuat.')).finally(()=>setLoading(false))}
  useEffect(load,[])
  if (!user) return null
  const latest=orders[0]
  const completed=orders.filter(order=>order.status==='completed')
  const processing=orders.filter(order=>order.status==='processing'||order.status==='pending').length
  const progress=latest?.status==='completed'?1:latest?.status==='processing'?.66:latest?.status==='pending'?.33:0

  return <div className="dashboard-page game-dashboard page-enter">
    <motion.section className="dash-welcome" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}><div><span className="eyebrow"><i /> SUPABASE CONNECTED</span><h1>{timeGreeting()}, {user.nickname.split(' ')[0]} <span>✦</span></h1><p>{loading?'Memuat data akun…':error?error:latest?`${latest.productName} berstatus ${latest.status}.`:'Belum ada transaksi pada akun ini.'}</p></div><Link className="btn btn--primary" to="/store/cookies"><Plus/> Beli Cookie</Link></motion.section>

    <section className="game-hub-grid">
      <motion.article className="active-cookie-card" initial={{opacity:0,x:-18}} animate={{opacity:1,x:0}} transition={{delay:.08}}>
        <div className="active-cookie-card__grid"/><div className="active-cookie-card__top"><span><i/><b>LATEST ORDER</b></span>{latest&&<em>{latest.status.toUpperCase()}</em>}</div>
        <div className="active-cookie-card__main"><motion.span className="active-cookie-glyph" animate={reduceMotion?{}:{rotateY:[0,360]}} transition={{duration:8,repeat:Infinity,ease:'linear'}}>{latest?.productIcon||'—'}</motion.span><div><small>{latest?.productName?.toUpperCase()||'BELUM ADA ORDER'}</small><strong>{latest?latest.id:'Katalog siap dijelajahi'}</strong><p>{latest?`${latest.date} • ${rupiah(latest.price)}`:'Pilih produk untuk membuat transaksi pertama.'}</p></div></div>
        <div className="active-cookie-card__progress"><motion.i initial={{scaleX:0}} animate={{scaleX:progress}} transition={{delay:.4,duration:.8}}/><span>{Math.round(progress*100)}% proses</span></div>
        <div className="active-cookie-card__foot"><span><PackageCheck/> {latest?'1 produk':'0 produk'}</span><span><ShieldCheck/> Server data</span>{latest?<Link to="/purchases">Buka detail <ArrowRight/></Link>:<Link to="/store/cookies">Beli sekarang <ArrowRight/></Link>}</div>
      </motion.article>
      <motion.div className="hub-mini-stats" initial="hidden" animate="visible" variants={{hidden:{},visible:{transition:{staggerChildren:.07}}}}>
        {[['TOTAL PEMBELIAN',String(orders.length),ShoppingBag,'violet'],['SELESAI',String(completed.length),PackageCheck,'cyan'],['DIPROSES',String(processing),Radar,'pink']].map(([label,value,Icon,tone])=><motion.article key={String(label)} variants={{hidden:{opacity:0,y:12},visible:{opacity:1,y:0}}}><span className={`stat-note__icon ${tone}`}><Icon/></span><small>{String(label)}</small><strong>{String(value)}</strong></motion.article>)}
      </motion.div>
      <motion.article className="hub-verification" initial={{opacity:0,x:18}} animate={{opacity:1,x:0}} transition={{delay:.14}}><div className="card-heading"><div><span className="eyebrow">ORDER STATUS</span><h2>{latest?'Status dari server.':'Belum ada order.'}</h2></div>{latest&&<StatusBadge status={latest.status}/>}</div><div className="hub-verify-track"><span className={progress>=.33?'done':''}><Check/></span><i/><span className={progress>=.66?'done':''}><Check/></span><i/><span className={progress===1?'active':''}><PackageCheck/></span></div><div className="hub-verify-labels"><span>Dibuat<small>Order tersimpan</small></span><span>Diproses<small>Validasi berjalan</small></span><span>Selesai<small>Delivery tersedia</small></span></div><Link to="/purchases">Lihat semua order <ArrowRight/></Link></motion.article>
    </section>

    <section className="hub-actions"><div className="section-title-inline"><span className="eyebrow">AKSI CEPAT</span><span>Seluruh data berasal dari akun Supabase milikmu.</span></div><motion.div initial="hidden" animate="visible" variants={{hidden:{},visible:{transition:{staggerChildren:.06}}}}>{[['/store/cookies','Beli Cookie','Lihat katalog',Cookie,'violet'],['/purchases','Buka delivery','Order yang selesai',PackageCheck,'cyan'],['/purchases','Riwayat order','Status & pembayaran',ShoppingBag,'pink'],['/profile','Profil akun','Identitas & keamanan',ShieldCheck,'amber']].map(([to,title,text,Icon,tone])=><motion.div variants={{hidden:{opacity:0,y:10},visible:{opacity:1,y:0}}} whileHover={reduceMotion?{}:{y:-4}} key={String(title)}><Link to={String(to)}><span className={`quick-actions__icon ${tone}`}><Icon/></span><span><strong>{String(title)}</strong><small>{String(text)}</small></span><ArrowRight/></Link></motion.div>)}</motion.div></section>

    <section className="hub-lower">
      <article className="hub-devices"><div className="card-heading"><div><span className="eyebrow">DELIVERY ACCESS</span><h2>Cookie yang tersedia</h2></div><Link to="/purchases">Lihat semua</Link></div><div className="device-list">{completed.slice(0,2).map(order=><div key={order.id}><span className="device-icon is-current"><Cookie/></span><span><strong>{order.productName}</strong><small>{order.id} • {order.date}</small></span><em><i/> READY</em><Link className="icon-btn icon-btn--sm" to="/purchases"><ArrowRight/></Link></div>)}{!completed.length&&<div className="dashboard-inline-empty"><PackageCheck/><span><strong>Belum ada delivery</strong><small>Order selesai akan tampil di sini.</small></span></div>}</div><div className="device-tip"><ShieldCheck/><p>Detail sensitif hanya tersedia dari order milikmu dan tidak tampil di halaman publik.</p></div></article>
      <article className="hub-orders"><div className="card-heading"><div><span className="eyebrow">ORDER HISTORY</span><h2>Pembelian terakhir</h2></div><Link to="/purchases">Semua <ArrowRight/></Link></div><div>{orders.slice(0,3).map(order=><span key={order.id}><i>{order.productIcon}</i><span><strong>{order.productName}</strong><small>{order.date} • {order.id}</small></span><b>{rupiah(order.price)}</b><StatusBadge status={order.status}/></span>)}{!orders.length&&!loading&&<div className="dashboard-inline-empty"><RefreshCw/><span><strong>Belum ada transaksi</strong><small>Data order akan dimuat dari Supabase.</small></span></div>}</div></article>
    </section>
  </div>
}
