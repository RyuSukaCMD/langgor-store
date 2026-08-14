import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Check, Cookie, HelpCircle, PackageCheck, Radar, ShieldCheck, ShoppingBag, Sparkles, TimerReset, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { PublicHeader } from '../components/PublicHeader'
import { useProducts } from '../context/ProductContext'
import { rupiah } from '../data'
import type { ProductKind } from '../types'

const needs = [
  { id:'basic', label:'Paling hemat', product:'cookie-basic', text:'Stok standar dengan harga terendah.' },
  { id:'higher', label:'Kriteria tinggi', product:'cookie-premkum', text:'Stok dengan kriteria dan prioritas lebih tinggi.' },
  { id:'top', label:'Pilihan teratas', product:'cookie-ultra', text:'Stok teratas dengan validasi prioritas.' },
]

export function StorePage({ kind }: { kind: ProductKind }) {
  const [need,setNeed] = useState('higher')
  const { products } = useProducts()
  const reduceMotion = useReducedMotion()
  const selected = useMemo(() => needs.find(item => item.id === need)!, [need])
  if (kind === 'account') return <Navigate to="/store/cookies" replace />

  return <div className="cookie-shop">
    <PublicHeader />
    <main>
      <section className="cookie-shop-hero"><div className="game-grid-bg"/><div className="container cookie-shop-hero__inner">
        <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}}><span className="game-kicker">COOKIE STOCK / INSTANT DELIVERY</span><h1>{products.length || 'Katalog'} Cookie.<br/><em>100% valid.</em></h1><p>Pilih Cookie berdasarkan kriteria dan harga. Seluruh stok diperiksa real-time sebelum delivery otomatis dibuka.</p></motion.div>
        <motion.div className="shop-signal" initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} transition={{delay:.15}}><motion.span animate={reduceMotion?{}:{rotate:360}} transition={{duration:12,repeat:Infinity,ease:'linear'}}/><i><Cookie/></i><div><strong>VALIDATION</strong><small>Real-time stock check</small></div><em>ONLINE</em></motion.div>
      </div></section>

      <section className="cookie-picker container">
        <div className="need-picker"><div><span className="game-kicker">BANTU PILIH</span><h2>Cookie seperti apa yang kamu cari?</h2></div><div className="need-tabs">{needs.map(item=><button key={item.id} className={need===item.id?'active':''} onClick={()=>setNeed(item.id)}>{need===item.id&&<motion.i layoutId="need-active"/>}<span>{item.label}</span></button>)}</div><AnimatePresence mode="wait"><motion.p key={selected.id} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}}>{selected.text} Rekomendasi: <b>{products.find(p=>p.id===selected.product)?.name}</b></motion.p></AnimatePresence></div>

        {products.length?<motion.div className="cookie-tier-grid" initial="hidden" animate="visible" variants={{hidden:{},visible:{transition:{staggerChildren:.09}}}}>
          {products.map((product,i)=><motion.article key={product.id} variants={{hidden:{opacity:0,y:24},visible:{opacity:1,y:0}}} whileHover={reduceMotion?{}:{y:-8}} className={`cookie-tier cookie-tier--${product.accent} ${selected.product===product.id?'is-recommended':''}`}>
            <div className="cookie-tier__signal"><span>{product.icon}</span><motion.i animate={reduceMotion?{}:{scale:[1,1.25,1],opacity:[.25,.05,.25]}} transition={{duration:2.4,repeat:Infinity}}/></div>
            <div className="cookie-tier__heading"><span>{product.category}</span>{selected.product===product.id&&<em><Sparkles/> Cocok buatmu</em>}<h2>{product.name}</h2><p>{product.description}</p></div>
            <div className="cookie-tier__price"><strong>{rupiah(product.price)}</strong><small>per Cookie</small></div>
            <ul>{product.specs.map(spec=><li key={spec}><Check/>{spec}</li>)}</ul>
            <Link to={`/product/${product.id}`} className={`btn ${i===1?'btn--primary':'btn--secondary'}`}>Beli {product.name.replace('Cookie ','')} <ArrowRight/></Link>
            <span className="cookie-tier__glow"/>
          </motion.article>)}
        </motion.div>:<div className="cookie-store-empty"><Cookie/><h3>Katalog sedang kosong</h3><p>Produk baru akan tampil setelah ditambahkan admin.</p></div>}

        {products.length>=3&&<><div className="compare-title"><span className="game-kicker">SPESIFIKASI</span><h2>Bedanya langsung kelihatan.</h2></div>
        <div className="cookie-compare"><div className="cookie-compare__head"><span>Kriteria</span>{products.slice(0,3).map(p=><strong key={p.id}>{p.name.replace('Cookie ','')}</strong>)}</div>{[
          ['Jumlah delivery','1 Cookie','1 Cookie','1 Cookie'],['Kelompok stok','Standar','Lebih tinggi','Teratas'],['Pemeriksaan real-time','Ya','Ya','Ya'],['Pengiriman otomatis','Ya','Ya','Ya'],['Prioritas stok','Normal','Prioritas','Tertinggi'],['Validasi','Standar','Cepat','Paling cepat']
        ].map((row,i)=><motion.div className="cookie-compare__row" key={row[0]} initial={{opacity:0,x:-8}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:i*.04}}>{row.map((cell,j)=><span key={`${i}-${j}`}>{j>0&&(cell==='Ya')?<Check/>:null}{cell}</span>)}</motion.div>)}</div></>}
      </section>

      <section className="shop-verify"><div className="container shop-verify__inner"><div><span className="game-kicker">SETELAH CHECKOUT</span><h2>Bayar selesai.<br/>Sistem langsung bekerja.</h2><p>Cookie dikirim hanya setelah pembayaran dan pemeriksaan real-time tervalidasi oleh server.</p><Link to="/register" className="btn btn--light">Buat akun <ArrowRight/></Link></div><div className="shop-verify__steps">{[[ShoppingBag,'Pembayaran','Server verified'],[Radar,'Validasi','Real-time check'],[PackageCheck,'Delivery','Cookie tersedia']].map(([Icon,title,text],i)=><motion.article key={String(title)} initial={{opacity:0,y:15}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.12}}><span><Icon/></span><small>0{i+1}</small><strong>{String(title)}</strong><p>{String(text)}</p>{i<2&&<ArrowRight/>}</motion.article>)}</div></div></section>

      <section className="shop-help"><div className="container"><div><HelpCircle/><span><strong>Masih bingung memilih?</strong><small>Cookie Premkum paling banyak dipilih.</small></span></div><div><ShieldCheck/><span><strong>100% valid.</strong><small>Cookie diperiksa sesaat sebelum dikirim.</small></span></div><div><TimerReset/><span><strong>Pengiriman otomatis.</strong><small>Delivery dibuka setelah validasi selesai.</small></span></div></div></section>
    </main>
  </div>
}
