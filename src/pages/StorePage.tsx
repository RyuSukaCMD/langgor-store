import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Check, Cookie, Fingerprint, Gamepad2, HelpCircle, KeyRound, LockKeyhole, MonitorSmartphone, ShieldCheck, Sparkles, TimerReset, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { PublicHeader } from '../components/PublicHeader'
import { products, rupiah } from '../data'
import type { ProductKind } from '../types'

const needs = [
  { id:'casual', label:'Main sesekali', product:'cookie-basic', text:'Satu device, durasi singkat.' },
  { id:'routine', label:'Main rutin', product:'cookie-premkum', text:'Dua device dan 30 hari.' },
  { id:'intense', label:'Main intensif', product:'cookie-ultra', text:'Durasi dan prioritas tertinggi.' },
]

export function StorePage({ kind }: { kind: ProductKind }) {
  const [need,setNeed] = useState('routine')
  const reduceMotion = useReducedMotion()
  const selected = useMemo(() => needs.find(item => item.id === need)!, [need])
  if (kind === 'account') return <Navigate to="/store/cookies" replace />

  return <div className="cookie-shop">
    <PublicHeader />
    <main>
      <section className="cookie-shop-hero"><div className="game-grid-bg"/><div className="container cookie-shop-hero__inner">
        <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}}><span className="game-kicker">COOKIE SELECT / GAME ACCESS</span><h1>Tiga Cookie.<br/><em>Nggak pakai password.</em></h1><p>Semua Cookie membuka game dengan kode unik dan verifikasi dua langkah. Pilih berdasarkan durasi dan jumlah perangkat.</p></motion.div>
        <motion.div className="shop-signal" initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} transition={{delay:.15}}><motion.span animate={reduceMotion?{}:{rotate:360}} transition={{duration:12,repeat:Infinity,ease:'linear'}}/><i><Cookie/></i><div><strong>GAME GATE</strong><small>Ready to verify</small></div><em>ONLINE</em></motion.div>
      </div></section>

      <section className="cookie-picker container">
        <div className="need-picker"><div><span className="game-kicker">BANTU PILIH</span><h2>Cara mainmu seperti apa?</h2></div><div className="need-tabs">{needs.map(item=><button key={item.id} className={need===item.id?'active':''} onClick={()=>setNeed(item.id)}>{need===item.id&&<motion.i layoutId="need-active"/>}<span>{item.label}</span></button>)}</div><AnimatePresence mode="wait"><motion.p key={selected.id} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}}>{selected.text} Rekomendasi: <b>{products.find(p=>p.id===selected.product)?.name}</b></motion.p></AnimatePresence></div>

        <motion.div className="cookie-tier-grid" initial="hidden" animate="visible" variants={{hidden:{},visible:{transition:{staggerChildren:.09}}}}>
          {products.map((product,i)=><motion.article key={product.id} variants={{hidden:{opacity:0,y:24},visible:{opacity:1,y:0}}} whileHover={reduceMotion?{}:{y:-8}} className={`cookie-tier cookie-tier--${product.accent} ${selected.product===product.id?'is-recommended':''}`}>
            <div className="cookie-tier__signal"><span>{product.icon}</span><motion.i animate={reduceMotion?{}:{scale:[1,1.25,1],opacity:[.25,.05,.25]}} transition={{duration:2.4,repeat:Infinity}}/></div>
            <div className="cookie-tier__heading"><span>{product.category}</span>{selected.product===product.id&&<em><Sparkles/> Cocok buatmu</em>}<h2>{product.name}</h2><p>{product.description}</p></div>
            <div className="cookie-tier__price"><strong>{rupiah(product.price)}</strong><small>sekali aktivasi</small></div>
            <ul>{product.specs.map(spec=><li key={spec}><Check/>{spec}</li>)}</ul>
            <Link to={`/product/${product.id}`} className={`btn ${i===1?'btn--primary':'btn--secondary'}`}>Aktifkan {product.name.replace('Cookie ','')} <ArrowRight/></Link>
            <span className="cookie-tier__glow"/>
          </motion.article>)}
        </motion.div>

        <div className="compare-title"><span className="game-kicker">BANDINGKAN</span><h2>Bedanya langsung kelihatan.</h2></div>
        <div className="cookie-compare"><div className="cookie-compare__head"><span>Fitur</span>{products.map(p=><strong key={p.id}>{p.name.replace('Cookie ','')}</strong>)}</div>{[
          ['Masa aktif','7 hari','30 hari','90 hari'],['Perangkat aktif','1 device','2 device','3 device'],['Verifikasi unik','Ya','Ya','Ya'],['Verifikasi 2 langkah','Ya','Ya','Ya'],['Prioritas aktivasi','Normal','Prioritas','Tertinggi'],['Session recovery','Standar','Cepat','Paling cepat']
        ].map((row,i)=><motion.div className="cookie-compare__row" key={row[0]} initial={{opacity:0,x:-8}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:i*.04}}>{row.map((cell,j)=><span key={`${i}-${j}`}>{j>0&&(cell==='Ya')?<Check/>:null}{cell}</span>)}</motion.div>)}</div>
      </section>

      <section className="shop-verify"><div className="container shop-verify__inner"><div><span className="game-kicker">SETELAH CHECKOUT</span><h2>Bayar selesai.<br/>Verifikasi belum.</h2><p>Cookie baru dibuat ketika dua tahap keamanan benar-benar selesai di server game.</p><Link to="/register" className="btn btn--light">Buat Langgor ID <ArrowRight/></Link></div><div className="shop-verify__steps">{[[KeyRound,'Kode unik','Hubungkan order'],[Fingerprint,'Konfirmasi','Setujui device'],[Gamepad2,'Game on','Cookie aktif']].map(([Icon,title,text],i)=><motion.article key={String(title)} initial={{opacity:0,y:15}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.12}}><span><Icon/></span><small>0{i+1}</small><strong>{String(title)}</strong><p>{String(text)}</p>{i<2&&<ArrowRight/>}</motion.article>)}</div></div></section>

      <section className="shop-help"><div className="container"><div><HelpCircle/><span><strong>Masih bingung pilih yang mana?</strong><small>Cookie Premkum paling pas untuk kebanyakan pemain rutin.</small></span></div><div><ShieldCheck/><span><strong>Tidak ada password.</strong><small>Cookie ditandatangani server dan terikat ke device.</small></span></div><div><TimerReset/><span><strong>Aktivasi cepat.</strong><small>Rata-rata verifikasi selesai dalam 12 detik.</small></span></div></div></section>
    </main>
  </div>
}
