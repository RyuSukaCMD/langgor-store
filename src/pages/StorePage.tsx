import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Check, Cookie, HelpCircle, PackageCheck, Radar, RefreshCw, ShieldCheck, ShoppingBag, Sparkles, TimerReset } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { PublicHeader } from '../components/PublicHeader'
import { useProducts } from '../context/ProductContext'
import { rupiah } from '../data'
import type { ProductKind } from '../types'

export function StorePage({ kind }: { kind: ProductKind }) {
  const [selectedId,setSelectedId] = useState('')
  const { products,loading,error,refreshProducts } = useProducts()
  const reduceMotion = useReducedMotion()
  useEffect(()=>{if(!selectedId&&products[0])setSelectedId(products[0].id)},[products,selectedId])
  const selected = useMemo(() => products.find(product => product.id === selectedId) || products[0], [products,selectedId])
  const compareProducts=products.slice(0,3)
  const compareRows=[['Harga',...compareProducts.map(product=>rupiah(product.price))],['Stok',...compareProducts.map(product=>String(product.stock))],['Status',...compareProducts.map(product=>product.status)],['Rating',...compareProducts.map(product=>String(product.rating))],['Terjual',...compareProducts.map(product=>product.sold.toLocaleString('id-ID'))],['Spesifikasi',...compareProducts.map(product=>`${product.specs.length} item`)]]
  if (kind === 'account') return <Navigate to="/store/cookies" replace />

  return <div className="cookie-shop">
    <PublicHeader />
    <main>
      <section className="cookie-shop-hero"><div className="game-grid-bg"/><div className="container cookie-shop-hero__inner">
        <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}}><span className="game-kicker">COOKIE STOCK / INSTANT DELIVERY</span><h1>{products.length || 'Katalog'} Cookie.<br/><em>100% valid.</em></h1><p>Pilih Cookie berdasarkan kriteria dan harga. Seluruh stok diperiksa real-time sebelum delivery otomatis dibuka.</p></motion.div>
        <motion.div className="shop-signal" initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} transition={{delay:.15}}><motion.span animate={reduceMotion?{}:{rotate:360}} transition={{duration:12,repeat:Infinity,ease:'linear'}}/><i><Cookie/></i><div><strong>VALIDATION</strong><small>Real-time stock check</small></div><em>ONLINE</em></motion.div>
      </div></section>

      <section className="cookie-picker container">
        <div className="need-picker"><div><span className="game-kicker">KATALOG LIVE</span><h2>Pilih produk dari Supabase</h2></div><div className="need-tabs">{products.slice(0,3).map(product=><button key={product.id} className={selected?.id===product.id?'active':''} onClick={()=>setSelectedId(product.id)}>{selected?.id===product.id&&<motion.i layoutId="need-active"/>}<span>{product.name}</span></button>)}</div>{selected&&<AnimatePresence mode="wait"><motion.p key={selected.id} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}}>{selected.description} <b>{rupiah(selected.price)}</b></motion.p></AnimatePresence>}</div>

        {loading?<div className="cookie-store-empty"><RefreshCw className="spin"/><h3>Memuat katalog</h3><p>Mengambil produk dari Supabase.</p></div>:error?<div className="cookie-store-empty"><RefreshCw/><h3>Katalog gagal dimuat</h3><p>{error}</p><button className="btn btn--secondary" onClick={()=>void refreshProducts()}>Coba lagi</button></div>:products.length?<motion.div className="cookie-tier-grid" initial="hidden" animate="visible" variants={{hidden:{},visible:{transition:{staggerChildren:.09}}}}>
          {products.map((product,i)=><motion.article key={product.id} variants={{hidden:{opacity:0,y:24},visible:{opacity:1,y:0}}} whileHover={reduceMotion?{}:{y:-8}} className={`cookie-tier cookie-tier--${product.accent} ${selected?.id===product.id?'is-recommended':''}`}>
            <div className={`cookie-tier__signal ${product.imageUrl?'has-image':''}`}><span style={product.imageUrl?{backgroundImage:`url(${product.imageUrl})`}:undefined}>{product.imageUrl?'':product.icon}</span><motion.i animate={reduceMotion?{}:{scale:[1,1.25,1],opacity:[.25,.05,.25]}} transition={{duration:2.4,repeat:Infinity}}/></div>
            <div className="cookie-tier__heading"><span>{product.category}</span>{selected?.id===product.id&&<em><Sparkles/> Dipilih</em>}<h2>{product.name}</h2><p>{product.description}</p></div>
            <div className="cookie-tier__price"><strong>{rupiah(product.price)}</strong><small>per Cookie</small></div>
            <ul>{product.specs.map(spec=><li key={spec}><Check/>{spec}</li>)}</ul>
            <Link to={`/product/${product.id}`} className={`btn ${i===1?'btn--primary':'btn--secondary'}`}>Beli {product.name.replace('Cookie ','')} <ArrowRight/></Link>
            <span className="cookie-tier__glow"/>
          </motion.article>)}
        </motion.div>:<div className="cookie-store-empty"><Cookie/><h3>Katalog sedang kosong</h3><p>Produk baru akan tampil setelah ditambahkan admin.</p></div>}

        {products.length>=3&&<><div className="compare-title"><span className="game-kicker">SPESIFIKASI</span><h2>Bedanya langsung kelihatan.</h2></div>
        <div className="cookie-compare"><div className="cookie-compare__head"><span>Kriteria</span>{products.slice(0,3).map(p=><strong key={p.id}>{p.name.replace('Cookie ','')}</strong>)}</div>{compareRows.map((row,i)=><motion.div className="cookie-compare__row" key={row[0]} initial={{opacity:0,x:-8}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:i*.04}}>{row.map((cell,j)=><span key={`${i}-${j}`}>{cell}</span>)}</motion.div>)}</div></>}
      </section>

      <section className="shop-verify"><div className="container shop-verify__inner"><div><span className="game-kicker">SETELAH CHECKOUT</span><h2>Bayar selesai.<br/>Sistem langsung bekerja.</h2><p>Cookie dikirim hanya setelah pembayaran dan pemeriksaan real-time tervalidasi oleh server.</p><Link to="/register" className="btn btn--light">Buat akun <ArrowRight/></Link></div><div className="shop-verify__steps">{[[ShoppingBag,'Pembayaran','Server verified'],[Radar,'Validasi','Real-time check'],[PackageCheck,'Delivery','Cookie tersedia']].map(([Icon,title,text],i)=><motion.article key={String(title)} initial={{opacity:0,y:15}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.12}}><span><Icon/></span><small>0{i+1}</small><strong>{String(title)}</strong><p>{String(text)}</p>{i<2&&<ArrowRight/>}</motion.article>)}</div></div></section>

      <section className="shop-help"><div className="container"><div><HelpCircle/><span><strong>Katalog tersinkron</strong><small>{selected?`${selected.name} sedang dipilih.`:'Produk dikelola melalui Supabase.'}</small></span></div><div><ShieldCheck/><span><strong>100% valid.</strong><small>Cookie diperiksa sesaat sebelum dikirim.</small></span></div><div><TimerReset/><span><strong>Pengiriman otomatis.</strong><small>Delivery dibuka setelah validasi selesai.</small></span></div></div></section>
    </main>
  </div>
}
