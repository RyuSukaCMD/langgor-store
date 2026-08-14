import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { ArrowRight, Check, ChevronDown, Cookie, Fingerprint, KeyRound, LockKeyhole, MousePointer2, PackageCheck, Radar, RefreshCw, ShieldCheck, ShoppingBag, Sparkles, TimerReset, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PublicHeader } from '../components/PublicHeader'
import { useProducts } from '../context/ProductContext'
import { rupiah } from '../data'

const reveal = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0 } }
const stagger = { hidden: {}, visible: { transition: { staggerChildren: .09 } } }
const planMeta = {
  'cookie-basic': { tag: 'Harga paling ringan', note: 'Untuk kebutuhan standar', color: 'cyan' },
  'cookie-premkum': { tag: 'Paling banyak dipilih', note: 'Spesifikasi lebih tinggi', color: 'violet' },
  'cookie-ultra': { tag: 'Spesifikasi tertinggi', note: 'Untuk pilihan teratas', color: 'pink' },
}

export function LandingPage() {
  const [faq, setFaq] = useState<number | null>(0)
  const { products } = useProducts()
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const panelY = useTransform(scrollYProgress, [0, .3], [0, reduceMotion ? 0 : 55])
  const faqs = [
    ['Apa itu Cookie login?', 'Cookie login adalah data sesi untuk mengakses akun yang memang kamu miliki atau berhak kamu gunakan. Detail sensitif hanya tersedia melalui delivery privat setelah transaksi selesai.'],
    ['Apakah pengiriman otomatis?', 'Ya. Setelah pembayaran diverifikasi, sistem memeriksa Cookie secara real-time lalu menampilkannya di halaman pembelianmu.'],
    ['Apa arti 100% valid?', 'Setiap Cookie diperiksa sesaat sebelum delivery. Status valid mengacu pada hasil pemeriksaan sistem ketika Cookie dikirim.'],
    ['Di mana Cookie diterima?', 'Cookie tersedia di dashboard pada transaksi yang sudah selesai. Informasi sensitif tidak pernah ditampilkan pada halaman produk publik.'],
  ]

  return <div className="landing game-landing">
    <motion.div className="scroll-progress" style={{ scaleX: scrollYProgress }} />
    <PublicHeader />
    <main>
      <section className="game-hero">
        <div className="game-grid-bg" />
        <motion.div className="game-hero-orb game-hero-orb--a" animate={reduceMotion ? {} : { x:[0,35,-10,0], y:[0,-20,18,0] }} transition={{ duration:12, repeat:Infinity, ease:'easeInOut' }} />
        <motion.div className="game-hero-orb game-hero-orb--b" animate={reduceMotion ? {} : { x:[0,-28,12,0], y:[0,24,-12,0] }} transition={{ duration:14, repeat:Infinity, ease:'easeInOut' }} />
        <div className="container game-hero__inner">
          <motion.div className="game-hero__copy" initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={reveal} className="game-pill"><span><Cookie /></span> COOKIE LOGIN / READY STOCK</motion.div>
            <motion.h1 variants={reveal}>Cookie termurah.<br/><em>100% valid.</em></motion.h1>
            <motion.p variants={reveal}>Cookie login siap pakai yang diperiksa real-time sebelum dikirim. Pembayaran selesai, sistem memvalidasi stok, lalu delivery tersedia otomatis.</motion.p>
            <motion.div variants={reveal} className="game-hero__actions"><Link to="/store/cookies" className="btn btn--primary btn--lg">Beli sekarang <ArrowRight /></Link><a href="#spesifikasi" className="game-text-btn"><span><MousePointer2 /></span> Lihat spesifikasi</a></motion.div>
            <motion.div variants={reveal} className="game-proof"><span><i><ShieldCheck /></i><b>100% valid</b><small>Dicek sebelum dikirim</small></span><span><i><Zap /></i><b>0.1s delivery</b><small>Pengiriman otomatis</small></span><span><i><ShoppingBag /></i><b>15.492+ terjual</b><small>Transaksi selesai</small></span></motion.div>
          </motion.div>

          <motion.div className="gate-wrap" style={{ y: panelY }} initial={{ opacity:0, scale:.94, rotate:2 }} animate={{ opacity:1, scale:1, rotate:0 }} transition={{ delay:.22, duration:.7 }}>
            <div className="gate-halo" />
            <div className="game-gate">
              <div className="game-gate__top"><span><i/><i/><i/></span><b>LANGGOR COOKIE SYSTEM</b><em>LIVE</em></div>
              <div className="game-gate__body">
                <div className="gate-user"><span>LS</span><div><small>ORDER OWNER</small><strong>raka_sore</strong></div><button><RefreshCw /></button></div>
                <div className="gate-session"><div><span>DELIVERY REQUEST</span><code>#CK-8F2A</code></div><motion.i animate={reduceMotion ? {} : { opacity:[.25,1,.25] }} transition={{ duration:1.6,repeat:Infinity }} /></div>
                <div className="verify-stack">
                  <motion.div className="verify-step is-done" initial={{ x:18,opacity:0 }} animate={{ x:0,opacity:1 }} transition={{ delay:.65 }}><span><Check /></span><div><small>STEP 01</small><strong>Pembayaran diterima</strong><em>Baru saja</em></div></motion.div>
                  <motion.div className="verify-line" initial={{ scaleY:0 }} animate={{ scaleY:1 }} transition={{ delay:.8,duration:.45 }} />
                  <motion.div className="verify-step is-active" initial={{ x:18,opacity:0 }} animate={{ x:0,opacity:1 }} transition={{ delay:.95 }}><span><Radar /></span><div><small>STEP 02</small><strong>Validasi real-time</strong><em>Sedang diperiksa</em></div><motion.b animate={reduceMotion ? {} : { scale:[1,1.7,1],opacity:[.8,0,.8] }} transition={{ duration:1.8,repeat:Infinity }}/></motion.div>
                  <div className="verify-line is-muted" />
                  <div className="verify-step"><span><PackageCheck /></span><div><small>FINAL</small><strong>Cookie siap diambil</strong><em>Delivery privat</em></div></div>
                </div>
                <button className="gate-confirm"><LockKeyhole /> Buka delivery <ArrowRight /></button>
                <p><ShieldCheck /> Pengiriman otomatis • valid saat dikirim</p>
              </div>
            </div>
            <motion.div className="gate-float gate-float--top" animate={reduceMotion ? {} : { y:[0,-7,0] }} transition={{ duration:3,repeat:Infinity }}><Cookie/><span><b>Stock available</b><small>Ready for delivery</small></span></motion.div>
            <motion.div className="gate-float gate-float--bottom" animate={reduceMotion ? {} : { y:[0,7,0] }} transition={{ duration:3.6,repeat:Infinity }}><Zap/><span><b>Delivery 0.1s</b><small>Setelah validasi</small></span></motion.div>
          </motion.div>
        </div>
        <div className="live-rail"><div className="live-rail__track"><span><i/> COOKIE PREMKUM TERKIRIM</span><b>•</b><span>VALIDASI #8F2A SELESAI</span><b>•</b><span>15.492+ COOKIE TERJUAL</span><b>•</b><span><i/> COOKIE ULTRA TERKIRIM</span><b>•</b><span>VALIDASI #C19B SELESAI</span><b>•</b><span>STOK DIPERBARUI REAL-TIME</span></div></div>
      </section>

      <section className="game-section game-plans" id="spesifikasi"><div className="container">
        <motion.div className="game-section-head" initial="hidden" whileInView="visible" viewport={{once:true,amount:.5}} variants={reveal}><div><span className="game-kicker">3 PILIHAN / INSTANT DELIVERY</span><h2>Pilih Cookie sesuai<br/>spesifikasi yang dicari.</h2></div><p>Semua Cookie diperiksa sebelum delivery. Perbedaannya ada pada kriteria akun, prioritas stok, dan harga.</p></motion.div>
        <motion.div className="plan-grid" initial="hidden" whileInView="visible" viewport={{once:true,amount:.2}} variants={stagger}>
          {products.slice(0,3).map((product,i) => { const meta=planMeta[product.id as keyof typeof planMeta] || { tag:'Stok terbaru', note:'Pilihan Cookie terbaru', color:product.accent }; return <motion.article key={product.id} variants={reveal} whileHover={reduceMotion ? {} : { y:-9 }} className={`game-plan game-plan--${meta.color} ${i===1?'is-featured':''}`}>
            {i===1&&<div className="plan-corner"><Sparkles/> MOST CHOSEN</div>}<div className="plan-top"><span className="plan-glyph">{product.icon}</span><span><small>{meta.tag}</small><b>{product.name}</b></span></div><p>{meta.note}</p><div className="plan-price"><strong>{rupiah(product.price)}</strong><small>/ cookie</small></div><ul>{product.specs.map(spec=><li key={spec}><Check/> {spec}</li>)}</ul><Link to={`/product/${product.id}`} className={`btn ${i===1?'btn--primary':'btn--secondary'}`}>Pilih {product.name.replace('Cookie ','')} <ArrowRight/></Link><div className="plan-beam" /></motion.article>})}
        </motion.div>
        <p className="plans-footnote"><ShieldCheck/> Cookie diperiksa real-time dan hanya tersedia melalui delivery privat.</p>
      </div></section>

      <section className="game-section game-flow" id="cara-aktif"><div className="container game-flow__layout">
        <motion.div className="flow-copy" initial="hidden" whileInView="visible" viewport={{once:true,amount:.35}} variants={stagger}><motion.span variants={reveal} className="game-kicker">PEMBELIAN / OTOMATIS</motion.span><motion.h2 variants={reveal}>Checkout singkat.<br/>Cookie langsung dikirim.</motion.h2><motion.p variants={reveal}>Status berhasil tidak ditentukan tampilan frontend. Server tetap mencocokkan pembayaran dan validitas Cookie sebelum delivery dibuka.</motion.p><motion.div variants={reveal} className="flow-callout"><TimerReset/><span><b>Pengiriman otomatis</b><small>setelah pembayaran dan validasi selesai</small></span></motion.div></motion.div>
        <motion.div className="flow-steps" initial="hidden" whileInView="visible" viewport={{once:true,amount:.25}} variants={stagger}>
          {[['01','Pilih Cookie','Basic, Premkum, atau Ultra—sesuaikan spesifikasi dan harga.',Cookie],['02','Selesaikan pembayaran','Nominal dan status pembayaran diperiksa langsung oleh server.',ShoppingBag],['03','Validasi real-time','Sistem memilih stok lalu memastikan Cookie masih valid.',Radar],['04','Terima Cookie','Delivery tersedia otomatis pada halaman pembelianmu.',PackageCheck]].map(([n,title,text,Icon],i)=><motion.article key={String(n)} variants={reveal}><span className="flow-number">{String(n)}</span><i className="flow-icon"><Icon/></i><div><h3>{String(title)}</h3><p>{String(text)}</p></div>{i<3&&<motion.b initial={{scaleY:0}} whileInView={{scaleY:1}} viewport={{once:true}} transition={{delay:.2+i*.1}}/>}</motion.article>)}
        </motion.div>
      </div></section>

      <section className="game-section game-security" id="keamanan"><div className="container">
        <motion.div className="security-stage" initial={{opacity:0,scale:.97}} whileInView={{opacity:1,scale:1}} viewport={{once:true,amount:.25}}>
          <div className="security-copy"><span className="game-kicker">VALIDATION SYSTEM</span><h2>Dicek dulu. Baru dikirim.</h2><p>Sistem memeriksa stok dan status Cookie sesaat sebelum delivery. Informasi sensitif tidak dimuat di kartu produk atau halaman publik.</p><div className="security-points"><span><Check/> Pemeriksaan real-time</span><span><Check/> Delivery setelah pembayaran</span><span><Check/> Riwayat transaksi tercatat</span><span><Check/> Detail sensitif tetap privat</span></div></div>
          <div className="security-radar"><motion.div animate={reduceMotion?{}:{rotate:360}} transition={{duration:18,repeat:Infinity,ease:'linear'}}><i/><i/><i/></motion.div><span><ShieldCheck/><b>COOKIE<br/>VALID</b><small>REAL-TIME CHECKED</small></span><em className="radar-dot radar-dot--1"/><em className="radar-dot radar-dot--2"/><em className="radar-dot radar-dot--3"/></div>
        </motion.div>
      </div></section>

      <section className="game-section game-faq" id="faq"><div className="container game-faq__layout"><div><span className="game-kicker">QUESTIONS / ANSWERED</span><h2>Sebelum kamu checkout.</h2><p>Gunakan Cookie hanya untuk akun yang memang kamu miliki atau berhak kamu akses.</p><Link to="/store/cookies" className="game-text-btn">Buka pilihan Cookie <ArrowRight/></Link></div><div className="faq-list">{faqs.map(([q,a],i)=><article className={faq===i?'is-open':''} key={q}><button onClick={()=>setFaq(faq===i?null:i)} aria-expanded={faq===i}><span><small>0{i+1}</small>{q}</span><motion.i animate={{rotate:faq===i?180:0}}><ChevronDown/></motion.i></button><AnimatePresence initial={false}>{faq===i&&<motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}><p>{a}</p></motion.div>}</AnimatePresence></article>)}</div></div></section>

      <section className="game-cta"><div className="container"><motion.div className="game-cta__inner" initial={{opacity:0,y:22}} whileInView={{opacity:1,y:0}} viewport={{once:true}}><div><span><Cookie/></span><small>STOCK IS READY</small><h2>Cookie termurah sudah tersedia.</h2><p>Pilih, bayar, dan terima otomatis.</p></div><Link to="/store/cookies" className="btn btn--light btn--lg">Lihat 3 Cookie <ArrowRight/></Link></motion.div></div></section>
    </main>
    <footer className="game-footer"><div className="container"><div className="game-footer__top"><div><div className="logo logo--static"><span className="logo__mark"><span className="logo__bite"/></span><span>Langgor<span className="logo__muted">Store</span></span></div><p>Cookie login dengan validasi real-time dan pengiriman otomatis.</p></div><div><strong>STORE</strong><Link to="/store/cookies">Beli Cookie</Link><Link to="/dashboard">Dashboard</Link><a href="#spesifikasi">Spesifikasi</a></div><div><strong>BANTUAN</strong><a href="#faq">FAQ</a><a href="#keamanan">Validasi</a><a href="mailto:halo@langgor.store">Kontak</a></div></div><div className="game-footer__bottom"><span>© 2026 Langgor Store</span><span><i/> Validation system normal</span></div></div></footer>
    </div>
}
