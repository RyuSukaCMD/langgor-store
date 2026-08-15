import { ArrowRight, Clock3, Cookie, PackageCheck, Plus, RefreshCw, ShoppingBag, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { Skeleton } from '../components/UI'
import { useAuth } from '../context/AuthContext'
import { rupiah } from '../data'
import { api } from '../lib/api'
import { timeGreeting } from '../lib/format'
import type { Order } from '../types'

export function DashboardPage() {
  const { user } = useAuth()
  const [orders,setOrders]=useState<Order[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const load=()=>{setLoading(true);setError('');api<{orders:Order[]}>('/orders').then(result=>setOrders(result.orders)).catch(reason=>setError(reason instanceof Error?reason.message:'Ringkasan akun gagal dimuat.')).finally(()=>setLoading(false))}
  useEffect(load,[])
  if(!user)return null

  const latest=orders[0]
  const completed=orders.filter(order=>order.status==='completed').length
  const processing=orders.filter(order=>order.status==='processing'||order.status==='pending').length
  const firstName=user.nickname.trim().split(/\s+/)[0]||user.username
  const avatarStyle=user.avatarUrl?{backgroundImage:`url(${user.avatarUrl})`}:undefined
  const stage=latest?.status==='completed'?3:latest?.status==='processing'?2:latest?.status==='pending'?1:0

  return <div className="dashboard-page minimal-dashboard page-enter">
    <header className="minimal-dashboard__header">
      <div className="minimal-dashboard__identity"><span className="dashboard-avatar" style={avatarStyle}>{user.avatarUrl?'':user.avatar}</span><div><span className="dashboard-kicker">RINGKASAN AKUN</span><h1>{timeGreeting()}, {firstName}.</h1><p>Pantau pembelian dan akses pesananmu dari satu tempat.</p></div></div>
      <Link className="btn btn--primary" to="/store/cookies"><Plus/> Beli Cookie</Link>
    </header>

    {error&&<div className="dashboard-error"><span><RefreshCw/><span><strong>Ringkasan belum dapat dimuat</strong><small>{error}</small></span></span><button className="btn btn--secondary btn--sm" onClick={load}>Coba lagi</button></div>}

    <section className="dashboard-summary" aria-label="Ringkasan pembelian">
      <article><span><ShoppingBag/></span><div><small>Total pembelian</small>{loading?<Skeleton/>:<strong>{orders.length}</strong>}</div></article>
      <article><span><PackageCheck/></span><div><small>Pesanan selesai</small>{loading?<Skeleton/>:<strong>{completed}</strong>}</div></article>
      <article><span><Clock3/></span><div><small>Dalam proses</small>{loading?<Skeleton/>:<strong>{processing}</strong>}</div></article>
    </section>

    <section className="dashboard-focus-grid">
      <article className="dashboard-panel dashboard-latest">
        <div className="dashboard-panel__head"><div><span className="dashboard-kicker">{latest?'PESANAN TERBARU':'PROFIL'}</span><h2>{latest?'Aktivitas terakhir':'Profil kamu'}</h2></div>{latest&&<StatusBadge status={latest.status}/>}</div>
        {loading?<div className="dashboard-latest__loading"><Skeleton/><Skeleton/><Skeleton/></div>:latest?<>
          <div className="dashboard-latest__product"><span>{latest.productIcon}</span><div><strong>{latest.productName}</strong><small>{latest.id} · {latest.date}</small></div><b>{rupiah(latest.price)}</b></div>
          {latest.status!=='refunded'&&<div className="dashboard-order-progress">
            {[['Pesanan dibuat',1],['Sedang diproses',2],['Selesai',3]].map(([label,index])=><div className={stage>=Number(index)?'is-done':''} key={String(label)}><i>{stage>Number(index)?'✓':index}</i><span>{label}</span></div>)}
          </div>}
          <Link className="dashboard-text-link" to="/purchases">Lihat rincian <ArrowRight/></Link>
        </>:<div className="dashboard-static-profile"><span className="dashboard-static-profile__avatar" style={avatarStyle}>{user.avatarUrl?'':user.avatar}</span><div><strong>{user.nickname}</strong><small>@{user.username}</small><p>{user.bio||'Lengkapi profil agar akunmu lebih mudah dikenali.'}</p></div><Link to="/profile">Atur profil <ArrowRight/></Link></div>}
      </article>

      <aside className="dashboard-panel dashboard-shortcuts">
        <div className="dashboard-panel__head"><div><span className="dashboard-kicker">AKSES CEPAT</span><h2>Yang sering digunakan</h2></div></div>
        <nav aria-label="Akses cepat dashboard">
          <Link to="/store/cookies"><span><Cookie/></span><div><strong>Katalog Cookie</strong><small>Cari produk yang tersedia</small></div><ArrowRight/></Link>
          <Link to="/purchases"><span><PackageCheck/></span><div><strong>Pembelian</strong><small>Periksa status pesanan</small></div><ArrowRight/></Link>
          <Link to="/profile"><span><UserRound/></span><div><strong>Profil</strong><small>Atur identitas dan foto</small></div><ArrowRight/></Link>
        </nav>
      </aside>
    </section>

    <section className="dashboard-panel dashboard-history">
      <div className="dashboard-panel__head"><div><span className="dashboard-kicker">RIWAYAT</span><h2>Pembelian terakhir</h2></div><Link to="/purchases">Lihat semua <ArrowRight/></Link></div>
      {loading?<div className="dashboard-history__loading">{[1,2,3].map(item=><Skeleton key={item}/>)}</div>:orders.length?<div className="dashboard-history__list">{orders.slice(0,4).map(order=><article key={order.id}><span className="dashboard-order-icon">{order.productIcon}</span><div><strong>{order.productName}</strong><small>{order.id} · {order.date}</small></div><b>{rupiah(order.price)}</b><StatusBadge status={order.status}/><Link to="/purchases" aria-label={`Lihat ${order.id}`}><ArrowRight/></Link></article>)}</div>:<div className="dashboard-history__empty"><ShoppingBag/><span><strong>Riwayat masih kosong</strong><small>Pembelian yang kamu buat akan tampil di sini.</small></span></div>}
    </section>
  </div>
}
