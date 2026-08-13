import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { ArrowRight, Check, ChevronDown, Cookie, Fingerprint, Gamepad2, KeyRound, LockKeyhole, MonitorSmartphone, MousePointer2, Radar, RefreshCw, ShieldCheck, Sparkles, TimerReset, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PublicHeader } from '../components/PublicHeader'
import { products, rupiah } from '../data'

const reveal = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0 } }
const stagger = { hidden: {}, visible: { transition: { staggerChildren: .09 } } }

const planMeta = {
  'cookie-basic': { tag: 'Mulai ringan', note: 'Buat main sesekali', color: 'cyan' },
  'cookie-premkum': { tag: 'Paling dipilih', note: 'Buat main rutin', color: 'violet' },
  'cookie-ultra': { tag: 'Durasi terpanjang', note: 'Buat sesi intensif', color: 'pink' },
}

export function LandingPage() {
  const [faq, setFaq] = useState<number | null>(0)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const gateY = useTransform(scrollYProgress, [0, .3], [0, reduceMotion ? 0 : 55])
  const faqs = [
    ['Cookie ini buat apa?', 'Cookie Langgor adalah izin sesi untuk masuk ke game Langgor tanpa mengetik password. Cookie dibuat server setelah kode unik dan verifikasi langkah kedua berhasil.'],
    ['Apakah cookie bisa dipindahkan?', 'Setiap aktivasi dicatat ke slot perangkat. Kamu bisa melepas perangkat lama dari Game Hub sebelum mengaktifkan perangkat baru.'],
    ['Apa yang terjadi saat masa aktif habis?', 'Sesi game berhenti dan cookie tidak dapat dipakai lagi. Progress game tetap tersimpan di Langgor ID milikmu.'],
    ['Apakah Langgor menyimpan password?', 'Tidak. Sistem login game ini memang tidak memakai password. Identitas diverifikasi memakai kode unik dan persetujuan dua langkah.'],
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
            <motion.div variants={reveal} className="game-pill"><span><Gamepad2 /></span> LOGIN COOKIE RESMI UNTUK GAME LANGGOR</motion.div>
            <motion.h1 variants={reveal}>Masuk tanpa password.<br/><em>Tetap dua langkah.</em></motion.h1>
            <motion.p variants={reveal}>Pilih durasi bermain, selesaikan verifikasi unik, lalu setujui perangkatmu. Game cookie baru aktif setelah kedua langkah cocok.</motion.p>
            <motion.div variants={reveal} className="game-hero__actions"><Link to="/store/cookies" className="btn btn--primary btn--lg">Pilih Cookie <ArrowRight /></Link><a href="#cara-aktif" className="game-text-btn"><span><MousePointer2 /></span> Lihat cara aktivasi</a></motion.div>
            <motion.div variants={reveal} className="game-proof"><span><i><KeyRound /></i><b>0 password</b><small>Tidak ada yang disimpan</small></span><span><i><Fingerprint /></i><b>2-step check</b><small>Dua bukti harus cocok</small></span><span><i><MonitorSmartphone /></i><b>Device control</b><small>Lepas sesi kapan saja</small></span></motion.div>
          </motion.div>

          <motion.div className="gate-wrap" style={{ y: gateY }} initial={{ opacity:0, scale:.94, rotate:2 }} animate={{ opacity:1, scale:1, rotate:0 }} transition={{ delay:.22, duration:.7 }}>
            <div className="gate-halo" />
            <div className="game-gate">
              <div className="game-gate__top"><span><i/><i/><i/></span><b>LANGGOR GAME GATE</b><em>LIVE</em></div>
              <div className="game-gate__body">
                <div className="gate-user"><span>RA</span><div><small>PLAYER ID</small><strong>raka_sore</strong></div><button><RefreshCw /></button></div>
                <div className="gate-session"><div><span>SESSION REQUEST</span><code>#CG-8F2A</code></div><motion.i animate={reduceMotion ? {} : { opacity:[.25,1,.25] }} transition={{ duration:1.6,repeat:Infinity }} /></div>
                <div className="verify-stack">
                  <motion.div className="verify-step is-done" initial={{ x:18,opacity:0 }} animate={{ x:0,opacity:1 }} transition={{ delay:.65 }}><span><Check /></span><div><small>STEP 01</small><strong>Kode unik cocok</strong><em>8F2A • baru saja</em></div></motion.div>
                  <motion.div className="verify-line" initial={{ scaleY:0 }} animate={{ scaleY:1 }} transition={{ delay:.8,duration:.45 }} />
                  <motion.div className="verify-step is-active" initial={{ x:18,opacity:0 }} animate={{ x:0,opacity:1 }} transition={{ delay:.95 }}><span><Fingerprint /></span><div><small>STEP 02</small><strong>Setujui perangkat ini</strong><em>Menunggu konfirmasi</em></div><motion.b animate={reduceMotion ? {} : { scale:[1,1.7,1],opacity:[.8,0,.8] }} transition={{ duration:1.8,repeat:Infinity }}/></motion.div>
                  <div className="verify-line is-muted" />
                  <div className="verify-step"><span><Cookie /></span><div><small>FINAL</small><strong>Game cookie aktif</strong><em>Terkunci sampai terverifikasi</em></div></div>
                </div>
                <button className="gate-confirm"><LockKeyhole /> Konfirmasi langkah kedua <ArrowRight /></button>
                <p><ShieldCheck /> Request ditandatangani server • tidak ada password</p>
              </div>
            </div>
            <motion.div className="gate-float gate-float--top" animate={reduceMotion ? {} : { y:[0,-7,0] }} transition={{ duration:3,repeat:Infinity }}><Radar/><span><b>Device recognized</b><small>Chrome • Sukabumi</small></span></motion.div>
            <motion.div className="gate-float gate-float--bottom" animate={reduceMotion ? {} : { y:[0,7,0] }} transition={{ duration:3.6,repeat:Infinity }}><Zap/><span><b>Verifikasi ±12 detik</b><small>Rata-rata hari ini</small></span></motion.div>
          </motion.div>
        </div>
        <div className="live-rail"><div className="live-rail__track"><span><i/> COOKIE PREMKUM AKTIF</span><b>•</b><span>VERIFIKASI #8F2A SELESAI</span><b>•</b><span>2.648 SESI AMAN HARI INI</span><b>•</b><span><i/> COOKIE ULTRA AKTIF</span><b>•</b><span>VERIFIKASI #C19B SELESAI</span><b>•</b><span>2.648 SESI AMAN HARI INI</span></div></div>
      </section>

      <section className="game-section game-plans" id="cookie"><div className="container">
        <motion.div className="game-section-head" initial="hidden" whileInView="visible" viewport={{once:true,amount:.5}} variants={reveal}><div><span className="game-kicker">03 COOKIE / SATU SISTEM LOGIN</span><h2>Pilih berapa lama<br/>kamu mau tetap masuk.</h2></div><p>Semua paket memakai verifikasi yang sama. Bedanya ada di durasi, jumlah slot perangkat, dan prioritas aktivasi.</p></motion.div>
        <motion.div className="plan-grid" initial="hidden" whileInView="visible" viewport={{once:true,amount:.2}} variants={stagger}>
          {products.map((product,i) => { const meta=planMeta[product.id as keyof typeof planMeta]; return <motion.article key={product.id} variants={reveal} whileHover={reduceMotion ? {} : { y:-9 }} className={`game-plan game-plan--${meta.color} ${i===1?'is-featured':''}`}>
            {i===1&&<div className="plan-corner"><Sparkles/> MOST PLAYED</div>}<div className="plan-top"><span className="plan-glyph">{product.icon}</span><span><small>{meta.tag}</small><b>{product.name}</b></span></div><p>{meta.note}</p><div className="plan-price"><strong>{rupiah(product.price)}</strong><small>/ aktivasi</small></div><ul>{product.specs.map(spec=><li key={spec}><Check/> {spec}</li>)}</ul><Link to={`/product/${product.id}`} className={`btn ${i===1?'btn--primary':'btn--secondary'}`}>Pilih {product.name.replace('Cookie ','')} <ArrowRight/></Link><div className="plan-beam" /></motion.article>})}
        </motion.div>
        <p className="plans-footnote"><ShieldCheck/> Cookie hanya dibuat oleh server game Langgor setelah dua tahap verifikasi berhasil.</p>
      </div></section>

      <section className="game-section game-flow" id="cara-aktif"><div className="container game-flow__layout">
        <motion.div className="flow-copy" initial="hidden" whileInView="visible" viewport={{once:true,amount:.35}} variants={stagger}><motion.span variants={reveal} className="game-kicker">AKTIVASI / TANPA PASSWORD</motion.span><motion.h2 variants={reveal}>Dua check.<br/>Baru boleh main.</motion.h2><motion.p variants={reveal}>Checkout bukan tanda bahwa sesi langsung aktif. Server game tetap menunggu identitas unik dan persetujuan perangkat.</motion.p><motion.div variants={reveal} className="flow-callout"><TimerReset/><span><b>Rata-rata 12 detik</b><small>dari kode diterima sampai cookie aktif</small></span></motion.div></motion.div>
        <motion.div className="flow-steps" initial="hidden" whileInView="visible" viewport={{once:true,amount:.25}} variants={stagger}>
          {[['01','Pilih Cookie','Basic, Premkum, atau Ultra—sesuaikan durasi dan slot perangkat.',Cookie],['02','Masukkan kode unik','Kode sekali pakai menghubungkan pembelian dengan Langgor ID milikmu.',KeyRound],['03','Setujui perangkat','Konfirmasi langkah kedua dari Game Hub. Request asing bisa langsung ditolak.',Fingerprint],['04','Cookie diterbitkan','Server mengaktifkan sesi hanya untuk perangkat dan durasi yang sudah disetujui.',Gamepad2]].map(([n,title,text,Icon],i)=><motion.article key={String(n)} variants={reveal}><span className="flow-number">{String(n)}</span><i className="flow-icon"><Icon/></i><div><h3>{String(title)}</h3><p>{String(text)}</p></div>{i<3&&<motion.b initial={{scaleY:0}} whileInView={{scaleY:1}} viewport={{once:true}} transition={{delay:.2+i*.1}}/>}</motion.article>)}
        </motion.div>
      </div></section>

      <section className="game-section game-security" id="keamanan"><div className="container">
        <motion.div className="security-stage" initial={{opacity:0,scale:.97}} whileInView={{opacity:1,scale:1}} viewport={{once:true,amount:.25}}>
          <div className="security-copy"><span className="game-kicker">LANGGOR SESSION RULES</span><h2>Yang berpindah hanya izin bermain.</h2><p>Tidak ada password untuk dicatat atau dibagikan. Cookie ditandatangani server, dibatasi waktu, dan terhubung ke slot perangkat yang kamu setujui.</p><div className="security-points"><span><Check/> Signed oleh game server</span><span><Check/> Bisa dicabut dari Game Hub</span><span><Check/> Kedaluwarsa otomatis</span><span><Check/> Tidak menampilkan token mentah</span></div></div>
          <div className="security-radar"><motion.div animate={reduceMotion?{}:{rotate:360}} transition={{duration:18,repeat:Infinity,ease:'linear'}}><i/><i/><i/></motion.div><span><ShieldCheck/><b>SESSION<br/>BOUND</b><small>2-STEP VERIFIED</small></span><em className="radar-dot radar-dot--1"/><em className="radar-dot radar-dot--2"/><em className="radar-dot radar-dot--3"/></div>
        </motion.div>
      </div></section>

      <section className="game-section game-faq" id="faq"><div className="container game-faq__layout"><div><span className="game-kicker">QUESTIONS / ANSWERED</span><h2>Sebelum kamu aktifkan.</h2><p>Kalau ada request perangkat yang tidak dikenal, jangan setujui langkah kedua.</p><Link to="/store/cookies" className="game-text-btn">Buka pilihan Cookie <ArrowRight/></Link></div><div className="faq-list">{faqs.map(([q,a],i)=><article className={faq===i?'is-open':''} key={q}><button onClick={()=>setFaq(faq===i?null:i)} aria-expanded={faq===i}><span><small>0{i+1}</small>{q}</span><motion.i animate={{rotate:faq===i?180:0}}><ChevronDown/></motion.i></button><AnimatePresence initial={false}>{faq===i&&<motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}><p>{a}</p></motion.div>}</AnimatePresence></article>)}</div></div></section>

      <section className="game-cta"><div className="container"><motion.div className="game-cta__inner" initial={{opacity:0,y:22}} whileInView={{opacity:1,y:0}} viewport={{once:true}}><div><span><Gamepad2/></span><small>GATE IS OPEN</small><h2>Siap buat sesi pertamamu?</h2><p>Pilih Cookie. Verifikasi. Lanjut main.</p></div><Link to="/store/cookies" className="btn btn--light btn--lg">Lihat 3 Cookie <ArrowRight/></Link></motion.div></div></section>
    </main>
    <footer className="game-footer"><div className="container"><div className="game-footer__top"><div><div className="logo logo--static"><span className="logo__mark"><span className="logo__bite"/></span><span>Langgor<span className="logo__muted">Game</span></span></div><p>Login game berbasis cookie dengan verifikasi unik dan persetujuan dua langkah.</p></div><div><strong>Game</strong><Link to="/store/cookies">Pilih Cookie</Link><Link to="/dashboard">Game Hub</Link><a href="#cara-aktif">Cara aktivasi</a></div><div><strong>Bantuan</strong><a href="#faq">FAQ</a><a href="#keamanan">Keamanan</a><a href="mailto:halo@langgor.store">Kontak</a></div></div><div className="game-footer__bottom"><span>© 2026 Langgor Game</span><span><i/> Game Gate normal</span></div></div></footer>
    </div>
}
