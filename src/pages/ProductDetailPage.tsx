import { ArrowLeft, BadgeCheck, Banknote, Check, ChevronRight, Clock3, Copy, CreditCard, Fingerprint, Heart, Info, LockKeyhole, PackageCheck, ShieldCheck, ShoppingBag, Star, Store, WalletCards } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { PublicHeader } from '../components/PublicHeader'
import { SectionHead, StatusBadge } from '../components/StatusBadge'
import { Button, Modal } from '../components/UI'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { products, rupiah } from '../data'
import { api } from '../lib/api'

type CheckoutStep = 'confirm' | 'payment' | 'processing' | 'completed'

export function ProductDetailPage() {
  const { id } = useParams()
  const product = products.find(p => p.id === id)
  const related = products.filter(p => p.kind === product?.kind && p.id !== id).slice(0,3)
  const [liked, setLiked] = useState(false)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<CheckoutStep>('confirm')
  const [payment, setPayment] = useState('balance')
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState('')
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [id])
  if (!product) return <div><PublicHeader/><main className="not-found"><h1>Produk tidak ditemukan.</h1><Link className="btn btn--primary" to="/store/cookies"><ArrowLeft/> Kembali ke store</Link></main></div>

  const start = () => {
    if (!user) { navigate('/login', { state: { from: `/product/${id}` } }); return }
    setStep('confirm'); setOpen(true)
  }
  const continueCheckout = async () => {
    if (step === 'confirm') { setStep('payment'); return }
    if (step === 'payment') {
      setLoading(true)
      try {
        const result = await api<{ orderId: string }>('/orders', { method: 'POST', body: JSON.stringify({ productId: product.id, paymentMethod: payment }) })
        setOrderId(result.orderId); setStep('processing')
        window.setTimeout(() => setStep('completed'), 1600)
      } catch (error) { showToast({ tone: 'error', title: 'Transaksi belum dibuat', message: error instanceof Error ? error.message : 'Coba lagi.' }) }
      finally { setLoading(false) }
    }
  }
  const close = () => { if (step === 'processing') return; setOpen(false); if (step === 'completed') showToast({ tone: 'success', title: 'Pesanan tercatat', message: 'Pantau statusnya dari halaman pembelian.' }) }

  return <div className="detail-page">
    <PublicHeader />
    <main className="container detail-main">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Beranda</Link><ChevronRight/><Link to={product.kind === 'cookie' ? '/store/cookies' : '/store/accounts'}>{product.kind === 'cookie' ? 'Cookie Store' : 'Account Market'}</Link><ChevronRight/><span>{product.name}</span></nav>
      <section className="detail-grid">
        <div className="gallery">
          <div className={`detail-art detail-art--${product.accent}`}><span className="detail-art__label">LANGGOR / {product.category.toUpperCase()}</span><strong>{product.icon}</strong><div><small>{product.kind === 'cookie' ? 'COOKIE DROP' : 'USER LISTING'}</small><span>{product.name}</span></div><i className="art-ring art-ring--one"/><i className="art-ring art-ring--two"/></div>
          <div className="gallery-thumbs"><button className="active"><span>{product.icon}</span></button><button><span><ShieldCheck/></span></button><button><span><PackageCheck/></span></button></div>
        </div>
        <div className="detail-info">
          <div className="detail-label-row"><span className="product-category">{product.category}</span><StatusBadge status={product.status}/></div>
          <h1>{product.name}</h1>
          <div className="detail-rating"><span><Star/> {product.rating}</span><i/> <span>{product.sold} terjual</span><i/> <span>Listing {new Date(product.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}</span></div>
          <p className="detail-description">{product.description}</p>
          <div className="detail-price"><small>Harga produk</small><strong>{rupiah(product.price)}</strong><span>Sudah termasuk biaya layanan</span></div>
          <div className="seller-box"><span className="seller-avatar">{product.seller.name.slice(0,2).toUpperCase()}</span><div><small>DIJUAL OLEH</small><strong>{product.seller.name} {product.seller.verified && <BadgeCheck/>}</strong><span>@{product.seller.username} • {product.seller.rating} rating</span></div><Link to={`/u/${product.seller.username}`}>Lihat profil</Link></div>
          <div className="detail-actions"><Button onClick={start} disabled={product.status === 'sold'}><ShoppingBag/> {product.status === 'sold' ? 'Stok habis' : 'Beli sekarang'}</Button><button className={`like-btn ${liked ? 'active' : ''}`} onClick={() => setLiked(v => !v)} aria-label="Simpan produk"><Heart fill={liked ? 'currentColor' : 'none'}/></button></div>
          <div className="detail-assurance"><span><ShieldCheck/><b>Transaksi tercatat</b><small>Status divalidasi server</small></span><span><LockKeyhole/><b>Delivery privat</b><small>Hanya setelah pembayaran</small></span><span><Clock3/><b>Respons seller</b><small>Rata-rata 12 menit</small></span></div>
        </div>
      </section>

      <section className="detail-body">
        <article><span className="eyebrow">RINCIAN PRODUK</span><h2>Yang perlu kamu tahu.</h2><p>{product.kind === 'cookie' ? 'Produk ini dikirim melalui delivery privat di dashboard. Pastikan browser dan perangkat sesuai dengan spesifikasi sebelum membeli. Jangan membagikan data delivery kepada orang lain.' : 'Listing ini hanya menampilkan atribut non-sensitif untuk membantu evaluasi. Proses perpindahan kepemilikan didampingi seller setelah pembayaran tervalidasi.'}</p><div className="spec-grid">{product.specs.map((spec,i) => <span key={spec}><i>{String(i+1).padStart(2,'0')}</i><strong>{spec}</strong><Check/></span>)}</div></article>
        <aside className="safe-panel"><Fingerprint/><span className="eyebrow">LANGGOR SAFE DELIVERY</span><h3>Hal publik berhenti di sini.</h3><p>Credential, cookie, recovery code, dan instruksi sensitif tidak pernah tampil di halaman produk.</p><ul><li><Check/> Pembayaran diperiksa server</li><li><Check/> Akses hanya untuk pembeli</li><li><Check/> Jejak delivery tersimpan</li></ul><a href="#safety">Pelajari keamanan <ChevronRight/></a></aside>
      </section>

      <section className="related-section"><SectionHead eyebrow="MASIH SATU RAK" title="Mungkin cocok juga."/><div className="product-grid">{related.map(p => <ProductCard product={p} key={p.id}/>)}</div></section>
    </main>

    <Modal open={open} onClose={close} eyebrow={`CHECKOUT / ${step.toUpperCase()}`} title={step === 'confirm' ? 'Periksa sebelum lanjut.' : step === 'payment' ? 'Pilih cara bayar.' : step === 'processing' ? 'Pembayaran diperiksa…' : 'Pesanan berhasil dibuat.'} footer={(step === 'confirm' || step === 'payment') ? <><Button variant="secondary" onClick={close}>Batal</Button><Button onClick={continueCheckout} loading={loading}>{step === 'confirm' ? 'Lanjut pembayaran' : `Bayar ${rupiah(product.price)}`} <ChevronRight/></Button></> : step === 'completed' ? <><button className="btn btn--secondary" onClick={close}>Tutup</button><Link className="btn btn--primary" to="/purchases" onClick={() => setOpen(false)}>Lihat pembelian</Link></> : undefined}>
      {step === 'confirm' && <div className="checkout-confirm"><div className="checkout-product"><span className={`checkout-product__icon ${product.accent}`}>{product.icon}</span><span><small>{product.category}</small><strong>{product.name}</strong><em>{product.seller.name}</em></span><b>{rupiah(product.price)}</b></div><div className="checkout-totals"><span><span>Harga produk</span><b>{rupiah(product.price)}</b></span><span><span>Biaya layanan</span><b>Rp0</b></span><span><strong>Total bayar</strong><strong>{rupiah(product.price)}</strong></span></div><label className="confirm-check"><input type="checkbox" defaultChecked/><span><Check/></span><p>Saya sudah memeriksa deskripsi, spesifikasi, dan ketentuan produk.</p></label></div>}
      {step === 'payment' && <div className="payment-options"><button className={payment === 'balance' ? 'active' : ''} onClick={() => setPayment('balance')}><span><WalletCards/><span><strong>Langgor Balance</strong><small>Saldo {rupiah(user?.balance || 0)}</small></span></span>{payment === 'balance' && <Check/>}</button><button className={payment === 'bank' ? 'active' : ''} onClick={() => setPayment('bank')}><span><CreditCard/><span><strong>Virtual Account</strong><small>BCA, BNI, Mandiri, Permata</small></span></span>{payment === 'bank' && <Check/>}</button><button className={payment === 'ewallet' ? 'active' : ''} onClick={() => setPayment('ewallet')}><span><Banknote/><span><strong>E-wallet</strong><small>QRIS dan dompet digital</small></span></span>{payment === 'ewallet' && <Check/>}</button><div className="payment-info"><Info/> Nominal final diverifikasi oleh server. Langgor tidak menerima status sukses dari tampilan frontend saja.</div></div>}
      {step === 'processing' && <div className="processing-state"><div className="processing-ring"><span/><Fingerprint/></div><h3>Jangan tutup halaman ini</h3><p>Kami sedang mencocokkan nominal dan status pembayaran dari server.</p><div className="processing-steps"><span className="done"><Check/> Pesanan dibuat</span><span className="active"><i/> Verifikasi pembayaran</span><span><i/> Siapkan delivery</span></div></div>}
      {step === 'completed' && <div className="checkout-success"><span className="success-mark"><Check/></span><p>Order <button onClick={() => navigator.clipboard?.writeText(orderId)}>{orderId} <Copy/></button> tercatat. Status berikutnya akan dikirim lewat notifikasi.</p><div className="checkout-success__summary"><span><small>PRODUK</small><strong>{product.name}</strong></span><span><small>TOTAL</small><strong>{rupiah(product.price)}</strong></span><span><small>STATUS</small><StatusBadge status="processing"/></span></div></div>}
    </Modal>
  </div>
}
