import { ArrowRight, BadgeCheck, ChevronRight, Cookie, Fingerprint, Gauge, LayoutDashboard, LockKeyhole, PackageCheck, PanelsTopLeft, Search, ShieldCheck, ShoppingBag, Sparkles, UserRound, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { PublicHeader } from '../components/PublicHeader'
import { SectionHead } from '../components/StatusBadge'
import { products, rupiah } from '../data'

export function LandingPage() {
  return <div className="landing">
    <PublicHeader />
    <main>
      <section className="hero">
        <div className="hero-orb hero-orb--one" /><div className="hero-orb hero-orb--two" />
        <div className="container hero__grid">
          <div className="hero__copy">
            <div className="hero-note"><span><Zap /></span> Checkout singkat, delivery tercatat.</div>
            <h1>Satu tempat buat <span>cookie siap pakai</span> dan akun digital.</h1>
            <p>Temukan produk, cek reputasi seller, bayar, lalu akses pesanan dari dashboard—tanpa alur yang bikin bingung.</p>
            <div className="hero__actions"><Link className="btn btn--primary btn--lg" to="/store/cookies">Jelajahi store <ArrowRight /></Link><Link className="btn btn--secondary btn--lg" to="/register">Buat akun</Link></div>
            <div className="hero__proof"><span><ShieldCheck /> Seller diperiksa</span><span><Fingerprint /> Delivery privat</span><span><Gauge /> Status real-time</span></div>
          </div>
          <div className="hero-visual" aria-label="Pratinjau Langgor Store">
            <div className="hero-visual__top"><span className="window-dots"><i /><i /><i /></span><span className="mock-address"><LockKeyhole /> langgor.store/explore</span></div>
            <div className="hero-visual__body">
              <div className="mock-heading"><div><small>DROP HARI INI</small><strong>Cari yang kamu butuhkan.</strong></div><span className="mock-avatar">RA</span></div>
              <div className="mock-search"><Search /> Cari cookie atau akun… <kbd>⌘ K</kbd></div>
              <div className="mock-tabs"><span className="active">Untukmu</span><span>Cookie</span><span>Akun</span></div>
              <div className="mock-card mock-card--main"><div className="mock-card__art">✦</div><div><span className="mini-chip">DESIGN</span><strong>Design Pro Workspace</strong><small>oleh PixelKita <BadgeCheck /></small><b>{rupiah(19000)}</b></div><button aria-label="Buka"><ChevronRight /></button></div>
              <div className="mock-row"><div><span className="mock-icon cyan">♫</span><span><strong>Music Wave</strong><small>Stok 24</small></span></div><b>{rupiah(14000)}</b></div>
              <div className="mock-float"><PackageCheck /><span><strong>Pesanan selesai</strong><small>Produk sudah siap diakses</small></span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip"><div className="container"><span>Dibuat untuk transaksi yang jelas</span><div><strong>4.8/5</strong><small>rating seller</small></div><i /><div><strong>2 menit</strong><small>rata-rata checkout</small></div><i /><div><strong>24/7</strong><small>status pesanan</small></div><i /><div><strong>Privat</strong><small>delivery setelah bayar</small></div></div></section>

      <section className="section features" id="fitur"><div className="container">
        <SectionHead eyebrow="Bukan etalase biasa" title="Dari cari sampai akses, tetap satu alur." text="Langgor memisahkan hal publik dan privat dengan jelas, tanpa menyembunyikan informasi penting dari pembeli." />
        <div className="feature-layout">
          <article className="feature feature--wide"><div><span className="feature__icon"><Cookie /></span><small>01 / COOKIE MARKET</small><h3>Cookie yang mudah dibandingkan.</h3><p>Filter kategori, cek stok dan reputasi seller sebelum kamu menentukan pilihan.</p><Link to="/store/cookies">Buka Cookie Store <ArrowRight /></Link></div><div className="feature-search-demo"><span><Search /> Ketik produk…</span><div><i className="violet">▶</i><span><b>Stream Plus</b><small>342 terjual</small></span><strong>Rp29K</strong></div><div><i className="pink">✦</i><span><b>Design Pro</b><small>189 terjual</small></span><strong>Rp19K</strong></div></div></article>
          <article className="feature feature--tall"><span className="feature__icon pink"><UserRound /></span><small>02 / ACCOUNT MARKET</small><h3>Listing transparan, credential tetap privat.</h3><p>Spesifikasi relevan tampil untuk evaluasi. Data sensitif hanya dikirim setelah pembayaran tervalidasi.</p><div className="privacy-stack"><span><LockKeyhole /> Credential disembunyikan</span><span><BadgeCheck /> Identitas seller</span><span><ShieldCheck /> Delivery tercatat</span></div></article>
          <article className="feature"><span className="feature__icon cyan"><PanelsTopLeft /></span><small>03 / PERSONAL SPACE</small><h3>Pesanan dan profilmu, rapi.</h3><p>Pantau status tanpa berpindah-pindah halaman.</p></article>
          <article className="feature feature--dark"><span className="feature__icon"><ShoppingBag /></span><small>04 / SELLER TOOLS</small><h3>Listing cepat. Angka yang masuk akal.</h3><div className="mini-bars"><i style={{height:'42%'}}/><i style={{height:'66%'}}/><i style={{height:'48%'}}/><i style={{height:'84%'}}/><i style={{height:'70%'}}/></div></article>
        </div>
      </div></section>

      <section className="section how" id="cara-kerja"><div className="container">
        <SectionHead eyebrow="Empat langkah" title="Tidak perlu menebak langkah berikutnya." text="Setiap perubahan status punya penjelasan dan notifikasi." />
        <div className="steps">
          {[['01','Buat akun','Simpan profil dan akses seluruh riwayat transaksi.',UserRound],['02','Pilih produk','Gunakan pencarian dan filter yang relevan.',Search],['03','Konfirmasi beli','Periksa produk, nominal, dan metode bayar.',ShoppingBag],['04','Akses dashboard','Delivery tampil setelah transaksi tervalidasi.',LayoutDashboard]].map(([no,title,text,Icon],i) => <article className="step" key={String(no)}><span className="step__no">{String(no)}</span>{i < 3 && <i className="step__line"/>}<span className="step__icon"><Icon /></span><h3>{String(title)}</h3><p>{String(text)}</p></article>)}
        </div>
      </div></section>

      <section className="section market-preview"><div className="container">
        <SectionHead eyebrow="Baru di etalase" title="Dipilih dari listing yang aktif." text="Harga, stok, dan reputasi seller terlihat sebelum checkout." action={<Link className="btn btn--secondary" to="/store/cookies">Lihat semua <ArrowRight /></Link>} />
        <div className="product-grid">{products.slice(0,3).map(p => <ProductCard key={p.id} product={p} />)}</div>
      </div></section>

      <section className="closing"><div className="container"><div className="closing__inner"><span className="closing__spark"><Sparkles /></span><div><small>LANGGOR SPACE</small><h2>Punya yang dicari? Langsung masuk.</h2><p>Store sudah buka. Listing baru ditambahkan setiap hari.</p></div><Link to="/register" className="btn btn--light btn--lg">Mulai di Langgor <ArrowRight /></Link></div></div></section>
    </main>
    <footer className="footer"><div className="container"><div className="footer__top"><div className="footer__brand"><div className="logo logo--static"><span className="logo__mark"><span className="logo__bite" /></span><span>Langgor<span className="logo__muted">Store</span></span></div><p>Marketplace digital untuk transaksi yang singkat, jelas, dan tercatat.</p></div><div className="footer__links"><div><strong>Jelajahi</strong><Link to="/store/cookies">Cookie Store</Link><Link to="/store/accounts">Account Market</Link><Link to="/dashboard">Dashboard</Link></div><div><strong>Informasi</strong><a href="#terms">Syarat layanan</a><a href="#privacy">Privasi</a><a href="mailto:halo@langgor.store">Kontak</a></div></div></div><div className="footer__bottom"><span>© 2026 Langgor Store. Dibuat di Indonesia.</span><span>Status sistem <i/> Normal</span></div></div></footer>
  </div>
}
