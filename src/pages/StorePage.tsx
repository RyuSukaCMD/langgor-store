import { ArrowDownWideNarrow, Check, ChevronDown, Cookie, Filter, Info, LayoutGrid, List, PackageOpen, Search, ShieldCheck, SlidersHorizontal, Sparkles, Store, X } from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { ProductCard } from '../components/ProductCard'
import { PublicHeader } from '../components/PublicHeader'
import { EmptyState, Skeleton } from '../components/UI'
import { products, rupiah } from '../data'
import type { ProductKind } from '../types'

const categoryMap = { cookie: ['Semua', 'Streaming', 'Design', 'Music', 'Utility'], account: ['Semua', 'Gaming', 'Social Media', 'Productivity'] }

export function StorePage({ kind }: { kind: ProductKind }) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [category, setCategory] = useState('Semua')
  const [sort, setSort] = useState('newest')
  const [available, setAvailable] = useState(false)
  const [maxPrice, setMaxPrice] = useState(kind === 'cookie' ? 100000 : 5000000)
  const [layout, setLayout] = useState<'grid' | 'row'>('grid')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const isCookie = kind === 'cookie'

  useEffect(() => { setLoading(true); const t = window.setTimeout(() => setLoading(false), 420); return () => clearTimeout(t) }, [kind])
  useEffect(() => { setCategory('Semua'); setMaxPrice(kind === 'cookie' ? 100000 : 5000000) }, [kind])

  const filtered = useMemo(() => {
    const list = products.filter(p => p.kind === kind && (category === 'Semua' || p.category === category) && p.price <= maxPrice && (!available || p.status !== 'sold') && (p.name + p.description + p.seller.name).toLowerCase().includes(deferredQuery.toLowerCase()))
    return [...list].sort((a,b) => sort === 'low' ? a.price-b.price : sort === 'high' ? b.price-a.price : sort === 'popular' ? b.sold-a.sold : new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())
  }, [kind, category, maxPrice, available, deferredQuery, sort])

  const reset = () => { setQuery(''); setCategory('Semua'); setAvailable(false); setMaxPrice(kind === 'cookie' ? 100000 : 5000000); setSort('newest') }

  const Filters = () => <>
    <div className="filter-group"><label>Cari listing</label><div className="search-control"><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={isCookie ? 'Nama cookie, kategori…' : 'Judul, seller…'} /><kbd>⌘ K</kbd></div></div>
    <div className="filter-group"><label>Kategori</label><div className="category-options">{categoryMap[kind].map(cat => <button className={category === cat ? 'active' : ''} key={cat} onClick={() => setCategory(cat)}><span>{cat}</span>{category === cat && <Check />}</button>)}</div></div>
    <div className="filter-group"><div className="filter-label-row"><label>Harga maksimum</label><strong>{rupiah(maxPrice)}</strong></div><input className="range" type="range" min={isCookie ? 10000 : 100000} max={isCookie ? 100000 : 5000000} step={isCookie ? 5000 : 100000} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} /><div className="range-label"><span>{rupiah(isCookie ? 10000 : 100000)}</span><span>{rupiah(isCookie ? 100000 : 5000000)}</span></div></div>
    <div className="filter-group filter-group--toggle"><span><label>Hanya yang tersedia</label><small>Sembunyikan listing habis</small></span><button className={`switch ${available ? 'active' : ''}`} role="switch" aria-checked={available} onClick={() => setAvailable(v => !v)}><i /></button></div>
    {!isCookie && <div className="filter-group"><label>Seller</label><select><option>Semua seller</option><option>Terverifikasi</option><option>Rating 4.8+</option></select></div>}
    <button className="filter-reset" onClick={reset}><X /> Reset semua filter</button>
  </>

  return <div className={`store-page store-page--${kind}`}>
    <PublicHeader />
    <main>
      <section className="store-hero"><div className="store-hero__pattern"/><div className="container store-hero__inner"><div><span className="store-hero__icon">{isCookie ? <Cookie /> : <Store />}</span><span className="eyebrow">{isCookie ? 'COOKIE SHELF / READY STOCK' : 'USER LISTINGS / VERIFIED FLOW'}</span><h1>{isCookie ? <>Cookie yang siap<br/><em>langsung dipakai.</em></> : <>Akun digital dari<br/><em>seller terpercaya.</em></>}</h1><p>{isCookie ? 'Cari berdasarkan kebutuhan, bandingkan seller, lalu akses panduan setelah transaksi selesai.' : 'Spesifikasi yang relevan tampil terbuka. Credential sensitif tidak pernah dipajang di listing.'}</p></div><div className="store-hero__stat"><span>{isCookie ? '58' : '124'}</span><small>LISTING AKTIF</small><i/><span>{isCookie ? '4.8' : '4.7'}</span><small>RATING RATA-RATA</small></div></div></section>
      {!isCookie && <div className="container"><div className="safety-note"><ShieldCheck /><div><strong>Credential tetap privat.</strong><span>Password, session token, recovery code, dan data sensitif baru tersedia melalui delivery aman setelah pembayaran tervalidasi.</span></div><button aria-label="Info keamanan"><Info /></button></div></div>}
      <section className="store-content container">
        <aside className="filter-sidebar"><div className="filter-sidebar__head"><span><SlidersHorizontal /> Filter</span><small>{filtered.length} produk</small></div><Filters /></aside>
        <div className="catalog">
          <div className="catalog-toolbar"><div><span className="eyebrow">HASIL PENCARIAN</span><h2>{filtered.length} listing ditemukan</h2></div><div className="catalog-toolbar__actions"><button className="btn btn--secondary filter-mobile" onClick={() => setFiltersOpen(true)}><Filter /> Filter</button><label className="sort-select"><ArrowDownWideNarrow /><select value={sort} onChange={e => setSort(e.target.value)} aria-label="Urutkan"><option value="newest">Terbaru</option><option value="low">Harga terendah</option><option value="high">Harga tertinggi</option><option value="popular">Popular</option></select><ChevronDown /></label><div className="layout-switch"><button className={layout === 'grid' ? 'active' : ''} onClick={() => setLayout('grid')} aria-label="Tampilan grid"><LayoutGrid /></button><button className={layout === 'row' ? 'active' : ''} onClick={() => setLayout('row')} aria-label="Tampilan daftar"><List /></button></div></div></div>
          {loading ? <div className={`product-grid product-grid--${layout}`}>{[1,2,3,4].map(i => <div className="product-card product-skeleton" key={i}><Skeleton className="product-skeleton__art"/><div><Skeleton/><Skeleton/><Skeleton/></div></div>)}</div> : filtered.length ? <div className={`product-grid product-grid--${layout}`}>{filtered.map(p => <ProductCard key={p.id} product={p} layout={layout} />)}</div> : <EmptyState icon={<PackageOpen />} title="Belum ada yang cocok" text="Coba perluas rentang harga atau gunakan kategori lain." action={<button className="btn btn--secondary" onClick={reset}>Hapus filter</button>} />}
          {filtered.length > 0 && <div className="catalog-end"><Sparkles /><span>Semua listing sudah ditampilkan.</span></div>}
        </div>
      </section>
    </main>
    {filtersOpen && <div className="filter-drawer-backdrop" onClick={e => e.target === e.currentTarget && setFiltersOpen(false)}><aside className="filter-drawer"><div className="filter-drawer__head"><h2>Filter produk</h2><button className="icon-btn" onClick={() => setFiltersOpen(false)}><X /></button></div><div className="filter-drawer__body"><Filters /></div><div className="filter-drawer__foot"><button className="btn btn--primary" onClick={() => setFiltersOpen(false)}>Tampilkan {filtered.length} produk</button></div></aside></div>}
  </div>
}
