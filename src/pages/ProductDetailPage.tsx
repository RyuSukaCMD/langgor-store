import { ArrowLeft, BadgeCheck, Banknote, Check, ChevronRight, Clock3, Copy, CreditCard, Fingerprint, Heart, Info, LoaderCircle, LockKeyhole, PackageCheck, ShieldCheck, ShoppingBag, Star, WalletCards } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { PublicHeader } from '../components/PublicHeader'
import { SectionHead, StatusBadge } from '../components/StatusBadge'
import { Button, Modal } from '../components/UI'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useProducts } from '../context/ProductContext'
import { rupiah } from '../data'
import { api } from '../lib/api'

type CheckoutStep = 'confirm' | 'payment' | 'processing' | 'completed'

export function ProductDetailPage() {
  const { id } = useParams()
  const { products, loading: productsLoading } = useProducts()
  const product = products.find(p => p.id === id)
  const related = products.filter(p => p.kind === product?.kind && p.id !== id).slice(0,3)
  const [liked, setLiked] = useState(false)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<CheckoutStep>('confirm')
  const [payment, setPayment] = useState('balance')
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [orderStatus,setOrderStatus]=useState('pending')
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [id])
  if (productsLoading) return <div className="route-loader"><LoaderCircle className="spin"/><span>Memuat Cookie…</span></div>
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
        const result = await api<{ orderId: string;status:string }>('/orders', { method: 'POST', body: JSON.stringify({ productId: product.id, paymentMethod: payment }) })
        setOrderId(result.orderId);setOrderStatus(result.status);setStep('completed')
      } catch (error) { showToast({ tone: 'error', title: 'Transaksi belum dibuat', message: error instanceof Error ? error.message : 'Coba lagi.' }) }
      finally { setLoading(false) }
    }
  }
  const close = () => { if (step === 'processing') return; setOpen(false); if (step === 'completed') showToast({ tone: 'success', title: 'Pesanan tercatat', message: 'Pantau statusnya dari halaman pembelian.' }) }

  return <div className="detail-page">
    <PublicHeader />
    <main className="container detail-main">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Beranda</Link><ChevronRight/><Link to="/store/cookies">Cookie Store</Link><ChevronRight/><span>{product.name}</span></nav>
      <section className="detail-grid">
        <div className="gallery">
          <div className={`detail-art detail-art--${product.accent} ${product.imageUrl?'has-image':''}`}>{product.imageUrl&&<img src={product.imageUrl} alt={`Foto ${product.name}`}/>}<span className="detail-art__label">LANGGOR / {product.category.toUpperCase()}</span><strong>{product.imageUrl?'':product.icon}</strong><div><small>LOGIN COOKIE</small><span>{product.name}</span></div><i className="art-ring art-ring--one"/><i className="art-ring art-ring--two"/></div>
          <div className="gallery-thumbs"><span className="active">{product.imageUrl?<img src={product.imageUrl} alt="Thumbnail produk"/>:<i>{product.icon}</i>}</span><span title="Validasi server"><ShieldCheck/></span><span title="Pengiriman otomatis"><PackageCheck/></span></div>
        </div>
        <div className="detail-info">
          <div className="detail-label-row"><span className="product-category">{product.category}</span><StatusBadge status={product.status}/></div>
          <h1>{product.name}</h1>
          <div className="detail-rating"><span><Star/> {product.rating}</span><i/> <span>{product.sold} terjual</span><i/> <span>Listing {new Date(product.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}</span></div>
          <p className="detail-description">{product.description}</p>
          <div className="detail-price"><small>Harga produk</small><strong>{rupiah(product.price)}</strong><span>Sudah termasuk biaya layanan</span></div>
          <div className="seller-box"><span className="seller-avatar">{product.seller.name.slice(0,2).toUpperCase()}</span><div><small>DISEDIAKAN OLEH</small><strong>{product.seller.name} {product.seller.verified&&<BadgeCheck/>}</strong><span>@{product.seller.username} • {product.seller.rating} rating</span></div><a href="/#keamanan">Lihat validasi</a></div>
          <div className="detail-actions"><Button onClick={start} disabled={product.status === 'sold'}><ShoppingBag/> {product.status === 'sold' ? 'Stok habis' : 'Beli sekarang'}</Button><button className={`like-btn ${liked ? 'active' : ''}`} onClick={() => setLiked(v => !v)} aria-label="Simpan produk"><Heart fill={liked ? 'currentColor' : 'none'}/></button></div>
          <div className="detail-assurance"><span><ShieldCheck/><b>Server verified</b><small>Status bukan dari frontend</small></span><span><LockKeyhole/><b>Cookie privat</b><small>Token mentah tidak ditampilkan</small></span><span><Clock3/><b>Aktivasi cepat</b><small>Rata-rata 12 detik</small></span></div>
        </div>
      </section>

      <section className="detail-body">
        <article><span className="eyebrow">RINCIAN PRODUK</span><h2>Yang perlu kamu tahu.</h2><p>Cookie dipilih dari stok aktif dan diperiksa real-time sebelum delivery. Detail sensitif hanya tersedia melalui halaman pembelian setelah pembayaran berhasil diverifikasi.</p><div className="spec-grid">{product.specs.map((spec,i) => <span key={spec}><i>{String(i+1).padStart(2,'0')}</i><strong>{spec}</strong><Check/></span>)}</div></article>
        <aside className="safe-panel"><Fingerprint/><span className="eyebrow">LANGGOR VALIDATION</span><h3>Dicek sebelum dikirim.</h3><p>Status Cookie diperiksa real-time. Delivery tidak dibuka jika pembayaran atau pemeriksaan stok belum selesai.</p><ul><li><Check/> Pembayaran diperiksa server</li><li><Check/> Validasi Cookie real-time</li><li><Check/> Delivery tercatat</li></ul><a href="/#keamanan">Pelajari validasi <ChevronRight/></a></aside>
      </section>

      <section className="related-section"><SectionHead eyebrow="MASIH SATU RAK" title="Mungkin cocok juga."/><div className="product-grid">{related.map(p => <ProductCard product={p} key={p.id}/>)}</div></section>
    </main>

    <Modal open={open} onClose={close} eyebrow={`CHECKOUT / ${step.toUpperCase()}`} title={step === 'confirm' ? 'Periksa sebelum lanjut.' : step === 'payment' ? 'Pilih cara bayar.' : step === 'processing' ? 'Pembayaran diperiksa…' : 'Pesanan berhasil dibuat.'} footer={(step === 'confirm' || step === 'payment') ? <><Button variant="secondary" onClick={close}>Batal</Button><Button onClick={continueCheckout} loading={loading}>{step === 'confirm' ? 'Lanjut pembayaran' : `Bayar ${rupiah(product.price)}`} <ChevronRight/></Button></> : step === 'completed' ? <><button className="btn btn--secondary" onClick={close}>Tutup</button><Link className="btn btn--primary" to="/purchases" onClick={() => setOpen(false)}>Lihat pembelian</Link></> : undefined}>
      {step === 'confirm' && <div className="checkout-confirm"><div className="checkout-product"><span className={`checkout-product__icon ${product.accent}`} style={product.imageUrl?{backgroundImage:`url(${product.imageUrl})`}:undefined}>{product.imageUrl?'':product.icon}</span><span><small>{product.category}</small><strong>{product.name}</strong><em>{product.seller.name}</em></span><b>{rupiah(product.price)}</b></div><div className="checkout-totals"><span><span>Harga produk</span><b>{rupiah(product.price)}</b></span><span><span>Biaya layanan</span><b>Rp0</b></span><span><strong>Total bayar</strong><strong>{rupiah(product.price)}</strong></span></div><label className="confirm-check"><input type="checkbox" defaultChecked/><span><Check/></span><p>Saya sudah memeriksa deskripsi, spesifikasi, dan ketentuan produk.</p></label></div>}
      {step === 'payment' && <div className="payment-options"><button className={payment === 'balance' ? 'active' : ''} onClick={() => setPayment('balance')}><span><WalletCards/><span><strong>Langgor Balance</strong><small>Saldo {rupiah(user?.balance || 0)}</small></span></span>{payment === 'balance' && <Check/>}</button><button className={payment === 'bank' ? 'active' : ''} onClick={() => setPayment('bank')}><span><CreditCard/><span><strong>Virtual Account</strong><small>BCA, BNI, Mandiri, Permata</small></span></span>{payment === 'bank' && <Check/>}</button><button className={payment === 'ewallet' ? 'active' : ''} onClick={() => setPayment('ewallet')}><span><Banknote/><span><strong>E-wallet</strong><small>QRIS dan dompet digital</small></span></span>{payment === 'ewallet' && <Check/>}</button><div className="payment-info"><Info/> Nominal final diverifikasi oleh server. Langgor tidak menerima status sukses dari tampilan frontend saja.</div></div>}
      {step === 'processing' && <div className="processing-state"><div className="processing-ring"><span/><Fingerprint/></div><h3>Jangan tutup halaman ini</h3><p>Kami sedang mencocokkan nominal dan status pembayaran dari server.</p><div className="processing-steps"><span className="done"><Check/> Pesanan dibuat</span><span className="active"><i/> Verifikasi pembayaran</span><span><i/> Siapkan delivery</span></div></div>}
      {step === 'completed' && <div className="checkout-success"><span className="success-mark"><Check/></span><p>Order <button onClick={() => navigator.clipboard?.writeText(orderId)}>{orderId} <Copy/></button> tercatat. Status berikutnya akan dikirim lewat notifikasi.</p><div className="checkout-success__summary"><span><small>PRODUK</small><strong>{product.name}</strong></span><span><small>TOTAL</small><strong>{rupiah(product.price)}</strong></span><span><small>STATUS</small><StatusBadge status={orderStatus}/></span></div></div>}
    </Modal>
  </div>
}
