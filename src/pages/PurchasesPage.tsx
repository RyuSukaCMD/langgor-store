import { Download, PackageOpen, RotateCcw, Search } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, Input } from '../components/UI'
import { StatusBadge } from '../components/StatusBadge'
import { recentOrders, rupiah } from '../data'

export function PurchasesPage() {
  const [query, setQuery] = useState('')
  const filtered = recentOrders.filter(o => o.productName.toLowerCase().includes(query.toLowerCase()) || o.id.toLowerCase().includes(query.toLowerCase()))
  return <div className="content-page page-enter">
    <div className="page-heading"><div><span className="eyebrow">ARSIP PERSONAL</span><h1>Pembelianmu</h1><p>Periksa status transaksi dan akses produk yang sudah selesai.</p></div></div>
    <div className="table-toolbar"><Input label="Cari transaksi" name="search-order" icon={<Search />} placeholder="Nama produk atau ID…" value={query} onChange={e => setQuery(e.target.value)} /><select aria-label="Filter status"><option>Semua status</option><option>Selesai</option><option>Diproses</option><option>Dikembalikan</option></select></div>
    {filtered.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Produk</th><th>ID & tanggal</th><th>Total</th><th>Status</th><th><span className="sr-only">Aksi</span></th></tr></thead><tbody>{filtered.map(o => <tr key={o.id}><td><span className="table-product"><i>{o.productIcon}</i><strong>{o.productName}</strong></span></td><td><span>{o.id}</span><small>{o.date}</small></td><td><strong>{rupiah(o.price)}</strong></td><td><StatusBadge status={o.status}/></td><td><button className="btn btn--ghost btn--sm">{o.status === 'completed' ? <><Download /> Akses</> : <><RotateCcw /> Detail</>}</button></td></tr>)}</tbody></table></div> : <EmptyState icon={<PackageOpen />} title="Transaksi tidak ditemukan" text="Coba kata kunci lain atau hapus filter pencarian." action={<button className="btn btn--secondary" onClick={() => setQuery('')}>Reset pencarian</button>} />}
  </div>
}
