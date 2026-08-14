import { Download, PackageOpen, RefreshCw, RotateCcw, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState, Input, Skeleton } from '../components/UI'
import { StatusBadge } from '../components/StatusBadge'
import { rupiah } from '../data'
import { api } from '../lib/api'
import type { Order } from '../types'

export function PurchasesPage() {
  const [query, setQuery] = useState('')
  const [orders,setOrders]=useState<Order[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const load=()=>{setLoading(true);setError('');api<{orders:Order[]}>('/orders').then(result=>setOrders(result.orders)).catch(reason=>setError(reason instanceof Error?reason.message:'Data gagal dimuat.')).finally(()=>setLoading(false))}
  useEffect(load,[])
  const filtered = orders.filter(order => order.productName.toLowerCase().includes(query.toLowerCase()) || order.id.toLowerCase().includes(query.toLowerCase()))

  return <div className="content-page page-enter">
    <div className="page-heading"><div><span className="eyebrow">ORDER ARCHIVE</span><h1>Pembelian Cookie</h1><p>Periksa pembayaran, status validasi, dan delivery pada setiap transaksi.</p></div></div>
    <div className="table-toolbar"><Input label="Cari Cookie" name="search-order" icon={<Search />} placeholder="Nama produk atau ID…" value={query} onChange={event => setQuery(event.target.value)} /><select aria-label="Filter status"><option>Semua status</option><option>Selesai</option><option>Diproses</option><option>Dikembalikan</option></select></div>
    {loading?<div className="data-table-wrap purchase-skeleton">{[1,2,3].map(item=><Skeleton key={item}/>)}</div>:error?<EmptyState icon={<RefreshCw/>} title="Pembelian gagal dimuat" text={error} action={<button className="btn btn--secondary" onClick={load}><RefreshCw/> Coba lagi</button>}/>:filtered.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Produk</th><th>ID & tanggal</th><th>Total</th><th>Status</th><th><span className="sr-only">Aksi</span></th></tr></thead><tbody>{filtered.map(order => <tr key={order.id}><td><span className="table-product"><i>{order.productIcon}</i><strong>{order.productName}</strong></span></td><td><span>{order.id}</span><small>{order.date}</small></td><td><strong>{rupiah(order.price)}</strong></td><td><StatusBadge status={order.status}/></td><td><button className="btn btn--ghost btn--sm">{order.status === 'completed' ? <><Download /> Kelola</> : <><RotateCcw /> Detail</>}</button></td></tr>)}</tbody></table></div> : <EmptyState icon={<PackageOpen />} title="Belum ada pembelian" text={query?'Tidak ada transaksi yang cocok dengan pencarian.':'Order yang dibuat akan tampil di halaman ini.'} action={query?<button className="btn btn--secondary" onClick={() => setQuery('')}>Reset pencarian</button>:undefined} />}
  </div>
}
