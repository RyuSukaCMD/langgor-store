import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Check, Cookie, Fingerprint, KeyRound, PackageCheck, Plus, Radar, ShieldCheck, ShoppingBag, TimerReset } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { recentOrders, rupiah } from '../data'
import { timeGreeting } from '../lib/format'

export function DashboardPage() {
  const { user } = useAuth()
  const reduceMotion = useReducedMotion()
  if (!user) return null
  return <div className="dashboard-page game-dashboard page-enter">
    <motion.section className="dash-welcome" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}><div><span className="eyebrow"><i /> VALIDATION SYSTEM ONLINE</span><h1>{timeGreeting()}, {user.nickname.split(' ')[0]} <span>✦</span></h1><p>Cookie Premkum sudah siap. Tidak ada transaksi yang perlu tindakan.</p></div><Link className="btn btn--primary" to="/store/cookies"><Plus/> Beli Cookie</Link></motion.section>

    <section className="game-hub-grid">
      <motion.article className="active-cookie-card" initial={{opacity:0,x:-18}} animate={{opacity:1,x:0}} transition={{delay:.08}}>
        <div className="active-cookie-card__grid"/><div className="active-cookie-card__top"><span><i/><b>LATEST DELIVERY</b></span><em>REAL-TIME VALIDATED</em></div>
        <div className="active-cookie-card__main"><motion.span className="active-cookie-glyph" animate={reduceMotion?{}:{rotateY:[0,360]}} transition={{duration:8,repeat:Infinity,ease:'linear'}}>P</motion.span><div><small>COOKIE PREMKUM</small><strong>Cookie siap diambil</strong><p>Order LGR-82914 • 12 Agu 2026</p></div></div>
        <div className="active-cookie-card__progress"><motion.i initial={{scaleX:0}} animate={{scaleX:1}} transition={{delay:.4,duration:.8}}/><span>100% valid</span></div>
        <div className="active-cookie-card__foot"><span><PackageCheck/> 1 Cookie</span><span><ShieldCheck/> Validated</span><button>Buka delivery <ArrowRight/></button></div>
      </motion.article>
      <motion.div className="hub-mini-stats" initial="hidden" animate="visible" variants={{hidden:{},visible:{transition:{staggerChildren:.07}}}}>
        {[['TOTAL PEMBELIAN','18',ShoppingBag,'violet'],['VALIDASI TERAKHIR','0.1s',Radar,'cyan'],['BERHASIL DIKIRIM','17',PackageCheck,'pink']].map(([label,value,Icon,tone])=><motion.article key={String(label)} variants={{hidden:{opacity:0,y:12},visible:{opacity:1,y:0}}}><span className={`stat-note__icon ${tone}`}><Icon/></span><small>{String(label)}</small><strong>{String(value)}</strong></motion.article>)}
      </motion.div>
      <motion.article className="hub-verification" initial={{opacity:0,x:18}} animate={{opacity:1,x:0}} transition={{delay:.14}}><div className="card-heading"><div><span className="eyebrow">LAST ORDER</span><h2>Delivery selesai.</h2></div><span className="pulse-label"><i/> Valid</span></div><div className="hub-verify-track"><span className="done"><Check/></span><i/><span className="done"><Check/></span><i/><span className="active"><PackageCheck/></span></div><div className="hub-verify-labels"><span>Pembayaran<small>Server verified</small></span><span>Validasi<small>Real-time check</small></span><span>Delivery<small>Cookie tersedia</small></span></div><button>Buka detail order <ArrowRight/></button></motion.article>
    </section>

    <section className="hub-actions"><div className="section-title-inline"><span className="eyebrow">AKSI CEPAT</span><span>Akses pembelian dan delivery tanpa langkah panjang.</span></div><motion.div initial="hidden" animate="visible" variants={{hidden:{},visible:{transition:{staggerChildren:.06}}}}>{[
      ['/store/cookies','Beli Cookie','Lihat stok terbaru',Cookie,'violet'],['/purchases','Buka delivery','Cookie yang siap',PackageCheck,'cyan'],['/purchases','Riwayat order','Status & pembayaran',ShoppingBag,'pink'],['/profile','Profil akun','Identitas & keamanan',ShieldCheck,'amber']
    ].map(([to,title,text,Icon,tone])=><motion.div variants={{hidden:{opacity:0,y:10},visible:{opacity:1,y:0}}} whileHover={reduceMotion?{}:{y:-4}} key={String(title)}><Link to={String(to)}><span className={`quick-actions__icon ${tone}`}><Icon/></span><span><strong>{String(title)}</strong><small>{String(text)}</small></span><ArrowRight/></Link></motion.div>)}</motion.div></section>

    <section className="hub-lower">
      <article className="hub-devices"><div className="card-heading"><div><span className="eyebrow">DELIVERY ACCESS</span><h2>Cookie yang tersedia</h2></div><button>Lihat semua</button></div><div className="device-list"><div><span className="device-icon is-current"><Cookie/></span><span><strong>Cookie Premkum</strong><small>LGR-82914 • siap diambil</small></span><em><i/> READY</em><button className="icon-btn icon-btn--sm"><ArrowRight/></button></div><div><span className="device-icon"><PackageCheck/></span><span><strong>Cookie Basic</strong><small>LGR-82031 • sudah dibuka</small></span><em>DELIVERED</em><button className="icon-btn icon-btn--sm"><ArrowRight/></button></div></div><div className="device-tip"><ShieldCheck/><p>Detail sensitif hanya tersedia dari order milikmu dan tidak tampil di halaman publik.</p></div></article>
      <article className="hub-orders"><div className="card-heading"><div><span className="eyebrow">ORDER HISTORY</span><h2>Pembelian terakhir</h2></div><Link to="/purchases">Semua <ArrowRight/></Link></div><div>{recentOrders.map(order=><span key={order.id}><i>{order.productIcon}</i><span><strong>{order.productName}</strong><small>{order.date} • {order.id}</small></span><b>{rupiah(order.price)}</b><StatusBadge status={order.status}/></span>)}</div></article>
    </section>
  </div>
}
