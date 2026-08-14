import { LazyMotion, domAnimation, useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { Activity, ArrowRight, Check, CircleDollarSign, Cookie, Edit3, Eye, Package, Plus, RefreshCw, Search, ShieldCheck, ShoppingBag, Trash2, UserCog, Users, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Badge, Button, Input, Modal } from '../components/UI'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useProducts } from '../context/ProductContext'
import { useToast } from '../context/ToastContext'
import { recentOrders, rupiah } from '../data'
import { api } from '../lib/api'
import type { Product, ProductStatus } from '../types'
import './admin-redesign.css'

type AdminTab = 'overview' | 'products' | 'users' | 'orders'
type ManagedUser = { id:string;username:string;email:string;nickname:string;role:'user'|'moderator'|'admin';status:'active'|'suspended';balance:number;joinedAt:string;avatar:string }
type ProductForm = { name:string;category:string;description:string;price:string;stock:string;status:ProductStatus;specs:string;icon:string;accent:Product['accent'] }

const emptyProduct:ProductForm={name:'',category:'Normal Cookie',description:'',price:'',stock:'1',status:'ready',specs:'1 Cookie login\nPemeriksaan real-time\nPengiriman otomatis',icon:'C',accent:'violet'}
const panelMotion={initial:{opacity:0,y:10},animate:{opacity:1,y:0},exit:{opacity:0,y:-6}}

export function AdminPage() {
  const [tab,setTab]=useState<AdminTab>('overview')
  const [users,setUsers]=useState<ManagedUser[]>([])
  const [query,setQuery]=useState('')
  const [loadingUsers,setLoadingUsers]=useState(true)
  const [busyUser,setBusyUser]=useState('')
  const [productOpen,setProductOpen]=useState(false)
  const [editingId,setEditingId]=useState<string|null>(null)
  const [productForm,setProductForm]=useState<ProductForm>(emptyProduct)
  const [savingProduct,setSavingProduct]=useState(false)
  const [deleteProduct,setDeleteProduct]=useState<Product|null>(null)
  const [deleting,setDeleting]=useState(false)
  const { products,refreshProducts }=useProducts()
  const { user:currentUser }=useAuth()
  const { showToast }=useToast()
  const reduceMotion=useReducedMotion()

  const loadUsers=useCallback(async()=>{
    setLoadingUsers(true)
    try{const result=await api<{users:ManagedUser[]}>('/admin/users');setUsers(result.users)}
    catch(error){showToast({tone:'error',title:'Pengguna gagal dimuat',message:error instanceof Error?error.message:'Coba lagi.'})}
    finally{setLoadingUsers(false)}
  },[showToast])
  useEffect(()=>{void loadUsers()},[loadUsers])

  const filteredUsers=useMemo(()=>users.filter(item=>(item.nickname+item.username+item.email).toLowerCase().includes(query.toLowerCase())),[users,query])
  const activeUsers=users.filter(item=>item.status==='active').length
  const totalStock=products.reduce((sum,item)=>sum+item.stock,0)
  const revenue=recentOrders.reduce((sum,item)=>sum+item.price,0)

  const openCreate=()=>{setEditingId(null);setProductForm(emptyProduct);setProductOpen(true)}
  const openEdit=(product:Product)=>{setEditingId(product.id);setProductForm({name:product.name,category:product.category,description:product.description,price:String(product.price),stock:String(product.stock),status:product.status,specs:product.specs.join('\n'),icon:product.icon,accent:product.accent});setProductOpen(true)}
  const setProductField=<K extends keyof ProductForm>(key:K,value:ProductForm[K])=>setProductForm(form=>({...form,[key]:value}))

  const saveProduct=async(event:FormEvent)=>{
    event.preventDefault();setSavingProduct(true)
    const payload={...productForm,price:Number(productForm.price),stock:Number(productForm.stock),specs:productForm.specs.split('\n').map(item=>item.trim()).filter(Boolean)}
    try{
      if(editingId)await api(`/admin/products/${editingId}`,{method:'PATCH',body:JSON.stringify(payload)})
      else await api('/admin/products',{method:'POST',body:JSON.stringify(payload)})
      await refreshProducts();setProductOpen(false);showToast({tone:'success',title:editingId?'Produk diperbarui':'Produk ditambahkan',message:'Katalog Cookie sudah menggunakan data terbaru.'})
    }catch(error){showToast({tone:'error',title:'Produk belum disimpan',message:error instanceof Error?error.message:'Periksa form.'})}
    finally{setSavingProduct(false)}
  }

  const confirmDelete=async()=>{
    if(!deleteProduct)return;setDeleting(true)
    try{await api(`/admin/products/${deleteProduct.id}`,{method:'DELETE'});await refreshProducts();setDeleteProduct(null);showToast({tone:'success',title:'Produk dihapus',message:'Produk tidak lagi tampil di Cookie Store.'})}
    catch(error){showToast({tone:'error',title:'Produk belum dihapus',message:error instanceof Error?error.message:'Coba lagi.'})}
    finally{setDeleting(false)}
  }

  const updateUser=async(id:string,change:{role?:ManagedUser['role'];suspended?:boolean})=>{
    setBusyUser(id)
    try{await api(`/admin/users/${id}`,{method:'PATCH',body:JSON.stringify(change)});await loadUsers();showToast({tone:'success',title:'Akses pengguna diperbarui',message:'Perubahan role/status sudah tercatat di audit log.'})}
    catch(error){showToast({tone:'error',title:'Perubahan ditolak',message:error instanceof Error?error.message:'Coba lagi.'})}
    finally{setBusyUser('')}
  }

  return <LazyMotion features={domAnimation}><div className="content-page admin-page admin-v2 page-enter">
    <section className="admin-banner admin-v2__banner"><div><span className="eyebrow"><i/> ADMIN CONTROL / LIVE</span><h1>Kontrol store, tanpa beban.</h1><p>Produk, role pengguna, stok, dan transaksi dalam satu ruang yang tetap ringan.</p></div><div className="admin-identity"><ShieldCheck/><span><small>ACTIVE ROLE</small><strong>Administrator</strong></span></div></section>

    <nav className="admin-tabs" aria-label="Navigasi admin">
      {([['overview','Ringkasan',Activity],['products','Produk',Cookie],['users','Pengguna',Users],['orders','Transaksi',ShoppingBag]] as const).map(([id,label,Icon])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon/>{label}{id==='products'&&<span>{products.length}</span>}</button>)}
    </nav>

    {tab==='overview'&&<m.div {...panelMotion} className="admin-v2__panel">
      <section className="admin-metrics admin-v2__metrics">
        <article><span className="admin-metric__icon violet"><Cookie/></span><span><small>PRODUK AKTIF</small><strong>{products.length}</strong><em>{totalStock} stok</em></span></article>
        <article><span className="admin-metric__icon cyan"><Users/></span><span><small>PENGGUNA AKTIF</small><strong>{activeUsers}</strong><em>{users.length} total</em></span></article>
        <article><span className="admin-metric__icon pink"><ShoppingBag/></span><span><small>ORDER TERBARU</small><strong>{recentOrders.length}</strong><em>Demo data</em></span></article>
        <article><span className="admin-metric__icon amber"><CircleDollarSign/></span><span><small>ORDER VALUE</small><strong>{rupiah(revenue)}</strong><em>Riwayat tampil</em></span></article>
      </section>
      <section className="admin-v2__overview">
        <article className="admin-v2__quick"><div className="card-heading"><div><span className="eyebrow">QUICK CONTROL</span><h2>Yang sering dibutuhkan</h2></div></div><div><button onClick={openCreate}><span><Plus/></span><b>Tambah produk</b><small>Buat Cookie baru</small><ArrowRight/></button><button onClick={()=>setTab('users')}><span><UserCog/></span><b>Atur role</b><small>User, moderator, admin</small><ArrowRight/></button><button onClick={()=>setTab('products')}><span><Package/></span><b>Kelola stok</b><small>Harga dan availability</small><ArrowRight/></button></div></article>
        <article className="admin-v2__activity"><div className="card-heading"><div><span className="eyebrow">SYSTEM SNAPSHOT</span><h2>Katalog dalam kondisi normal.</h2></div><Badge tone="success">Live</Badge></div><div className="admin-v2__health"><span><i/><b>Public catalog API</b><small>Connected</small></span><span><i/><b>Role authorization</b><small>Backend enforced</small></span><span><i/><b>Audit actions</b><small>Recording</small></span></div></article>
      </section>
    </m.div>}

    {tab==='products'&&<m.section {...panelMotion} className="admin-v2__data">
      <div className="admin-v2__data-head"><div><span className="eyebrow">PRODUCT MANAGEMENT</span><h2>Katalog Cookie</h2><p>Perubahan tersambung langsung ke halaman store.</p></div><Button onClick={openCreate}><Plus/> Tambah produk</Button></div>
      {products.length?<div className="admin-product-list">{products.map((product,index)=><m.article key={product.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:reduceMotion?0:index*.04}}><span className={`listing-art ${product.accent}`}>{product.icon}</span><div className="admin-product-main"><span><Badge>{product.category}</Badge><StatusBadge status={product.status}/></span><h3>{product.name}</h3><p>{product.description}</p><small>ID: {product.id} • {product.sold.toLocaleString('id-ID')} terjual</small></div><div className="admin-product-value"><small>HARGA</small><strong>{rupiah(product.price)}</strong></div><div className="admin-product-value"><small>STOK</small><strong>{product.stock}</strong></div><div className="admin-product-actions"><button className="icon-btn" onClick={()=>openEdit(product)} aria-label={`Edit ${product.name}`}><Edit3/></button><button className="icon-btn icon-btn--danger" onClick={()=>setDeleteProduct(product)} aria-label={`Hapus ${product.name}`}><Trash2/></button></div></m.article>)}</div>:<div className="admin-v2__empty"><Cookie/><h3>Belum ada produk</h3><p>Tambahkan Cookie pertama untuk menampilkan katalog.</p><Button onClick={openCreate}><Plus/> Tambah produk</Button></div>}
    </m.section>}

    {tab==='users'&&<m.section {...panelMotion} className="admin-v2__data">
      <div className="admin-v2__data-head"><div><span className="eyebrow">USER & ROLE MANAGEMENT</span><h2>Pengguna dan akses</h2><p>Role disimpan oleh backend, bukan hanya disembunyikan dari UI.</p></div><div className="admin-v2__search"><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Cari nama, username, email…"/><button onClick={()=>void loadUsers()} aria-label="Muat ulang"><RefreshCw className={loadingUsers?'spin':''}/></button></div></div>
      <div className="admin-user-list">{filteredUsers.map(item=><article key={item.id}><span className="admin-user-avatar">{item.avatar}</span><div><strong>{item.nickname}</strong><span>@{item.username}</span><small>{item.email}</small></div><label><small>ROLE</small><select value={item.role} disabled={busyUser===item.id||item.id===currentUser?.id} onChange={event=>void updateUser(item.id,{role:event.target.value as ManagedUser['role']})}><option value="user">User</option><option value="moderator">Moderator</option><option value="admin">Admin</option></select></label><span className="admin-user-status"><Badge tone={item.status==='active'?'success':'error'}>{item.status==='active'?'Aktif':'Ditangguhkan'}</Badge></span><Button variant={item.status==='active'?'ghost':'secondary'} loading={busyUser===item.id} disabled={item.id===currentUser?.id} onClick={()=>void updateUser(item.id,{suspended:item.status==='active'})}>{item.status==='active'?'Tangguhkan':'Pulihkan'}</Button></article>)}</div>
    </m.section>}

    {tab==='orders'&&<m.section {...panelMotion} className="admin-v2__data">
      <div className="admin-v2__data-head"><div><span className="eyebrow">TRANSACTION CONTROL</span><h2>Transaksi terbaru</h2><p>Nominal checkout berasal dari katalog server.</p></div></div>
      <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Order</th><th>Produk</th><th>Tanggal</th><th>Nilai</th><th>Status</th><th></th></tr></thead><tbody>{recentOrders.map(order=><tr key={order.id}><td><strong>{order.id}</strong></td><td>{order.productName}</td><td>{order.date}</td><td><strong>{rupiah(order.price)}</strong></td><td><StatusBadge status={order.status}/></td><td><button className="icon-btn icon-btn--sm"><Eye/></button></td></tr>)}</tbody></table></div>
    </m.section>}

    <Modal open={productOpen} onClose={()=>!savingProduct&&setProductOpen(false)} eyebrow={editingId?'PRODUCT / EDIT':'PRODUCT / NEW'} title={editingId?'Edit produk':'Tambah produk'} footer={<><Button variant="secondary" onClick={()=>setProductOpen(false)} disabled={savingProduct}>Batal</Button><Button type="submit" form="admin-product-form" loading={savingProduct}>{editingId?'Simpan perubahan':'Tambah produk'}</Button></>}>
      <form id="admin-product-form" className="admin-product-form" onSubmit={saveProduct}><Input label="Nama produk" name="product-name" required minLength={4} maxLength={80} value={productForm.name} onChange={event=>setProductField('name',event.target.value)} placeholder="Cookie Special"/><div className="admin-form-row"><Input label="Kategori" name="product-category" required value={productForm.category} onChange={event=>setProductField('category',event.target.value)}/><Input label="Ikon (1–2 karakter)" name="product-icon" required maxLength={2} value={productForm.icon} onChange={event=>setProductField('icon',event.target.value.toUpperCase())}/></div><label className="field"><span className="field__label">Deskripsi</span><textarea required minLength={20} maxLength={400} rows={4} value={productForm.description} onChange={event=>setProductField('description',event.target.value)} placeholder="Jelaskan kriteria dan delivery produk…"/></label><div className="admin-form-row"><Input label="Harga" name="product-price" type="number" min="1000" required value={productForm.price} onChange={event=>setProductField('price',event.target.value)}/><Input label="Stok" name="product-stock" type="number" min="0" required value={productForm.stock} onChange={event=>setProductField('stock',event.target.value)}/></div><div className="admin-form-row"><label className="field"><span className="field__label">Status</span><select value={productForm.status} onChange={event=>setProductField('status',event.target.value as ProductStatus)}><option value="ready">Tersedia</option><option value="limited">Stok terbatas</option><option value="sold">Habis</option></select></label><label className="field"><span className="field__label">Aksen</span><select value={productForm.accent} onChange={event=>setProductField('accent',event.target.value as Product['accent'])}><option value="violet">Ungu</option><option value="pink">Pink</option><option value="cyan">Cyan</option><option value="amber">Amber</option></select></label></div><label className="field"><span className="field__label">Spesifikasi — satu per baris</span><textarea required rows={4} value={productForm.specs} onChange={event=>setProductField('specs',event.target.value)}/></label></form>
    </Modal>

    <Modal open={!!deleteProduct} onClose={()=>!deleting&&setDeleteProduct(null)} eyebrow="PRODUCT / DELETE" title="Hapus produk ini?" footer={<><Button variant="secondary" onClick={()=>setDeleteProduct(null)} disabled={deleting}>Batal</Button><Button variant="danger" loading={deleting} onClick={confirmDelete}>Hapus produk</Button></>}><div className="admin-delete-copy"><span><Trash2/></span><p><strong>{deleteProduct?.name}</strong> akan langsung hilang dari Cookie Store. Aksi ini dicatat di audit log.</p></div></Modal>
  </div></LazyMotion>
}
