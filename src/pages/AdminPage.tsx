import { LazyMotion, domAnimation, useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { Activity, ArrowRight, CircleDollarSign, Cookie, Edit3, Eye, Image as ImageIcon, Package, Plus, RefreshCw, Search, ShieldCheck, ShoppingBag, Trash2, UserCog, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Badge, Button, Input, Modal } from '../components/UI'
import { StatusBadge } from '../components/StatusBadge'
import { OrderDetailModal } from '../components/OrderDetailModal'
import { useAuth } from '../context/AuthContext'
import { useProducts } from '../context/ProductContext'
import { useToast } from '../context/ToastContext'
import { rupiah } from '../data'
import { api, deleteProductImage, uploadProductImage } from '../lib/api'
import type { Order, Product, ProductStatus } from '../types'
import './admin-redesign.css'

type AdminTab = 'overview' | 'products' | 'users' | 'orders'
type ManagedUser = { id:string;username:string;email:string;nickname:string;role:'user'|'moderator'|'admin';status:'active'|'suspended';balance:number;joinedAt:string;avatar:string;avatarUrl?:string }
type ProductForm = { name:string;category:string;description:string;price:string;stock:string;status:ProductStatus;specs:string;icon:string;accent:Product['accent'] }

const emptyProduct:ProductForm={name:'',category:'',description:'',price:'',stock:'0',status:'ready',specs:'',icon:'',accent:'violet'}
const panelMotion={initial:{opacity:0,y:10},animate:{opacity:1,y:0},exit:{opacity:0,y:-6}}

export function AdminPage() {
  const [tab,setTab]=useState<AdminTab>('overview')
  const [users,setUsers]=useState<ManagedUser[]>([])
  const [orders,setOrders]=useState<Order[]>([])
  const [selectedOrder,setSelectedOrder]=useState<Order|null>(null)
  const [query,setQuery]=useState('')
  const [loadingUsers,setLoadingUsers]=useState(true)
  const [busyUser,setBusyUser]=useState('')
  const [productOpen,setProductOpen]=useState(false)
  const [editingId,setEditingId]=useState<string|null>(null)
  const [productForm,setProductForm]=useState<ProductForm>(emptyProduct)
  const [productImage,setProductImage]=useState<File|null>(null)
  const [productImagePreview,setProductImagePreview]=useState('')
  const [existingProductImage,setExistingProductImage]=useState('')
  const [savingProduct,setSavingProduct]=useState(false)
  const [deleteProduct,setDeleteProduct]=useState<Product|null>(null)
  const [deleting,setDeleting]=useState(false)
  const { products,loading:productsLoading,error:productsError,refreshProducts }=useProducts()
  const { user:currentUser }=useAuth()
  const { showToast }=useToast()
  const reduceMotion=useReducedMotion()

  const loadUsers=useCallback(async()=>{
    setLoadingUsers(true)
    try{const result=await api<{users:ManagedUser[]}>('/admin/users');setUsers(result.users)}
    catch(error){showToast({tone:'error',title:'Pengguna gagal dimuat',message:error instanceof Error?error.message:'Coba lagi.'})}
    finally{setLoadingUsers(false)}
  },[showToast])
  const loadOrders=useCallback(async()=>{try{const result=await api<{orders:Order[]}>('/admin/orders');setOrders(result.orders)}catch(error){showToast({tone:'error',title:'Transaksi gagal dimuat',message:error instanceof Error?error.message:'Coba lagi.'})}},[showToast])
  useEffect(()=>{void loadUsers();void loadOrders()},[loadUsers,loadOrders])

  const filteredUsers=useMemo(()=>users.filter(item=>(item.nickname+item.username+item.email).toLowerCase().includes(query.toLowerCase())),[users,query])
  const activeUsers=users.filter(item=>item.status==='active').length
  const totalStock=products.reduce((sum,item)=>sum+item.stock,0)
  const revenue=orders.reduce((sum,item)=>sum+item.price,0)

  const openCreate=()=>{setEditingId(null);setProductForm(emptyProduct);setProductImage(null);setExistingProductImage('');setProductImagePreview('');setProductOpen(true)}
  const closeProduct=()=>{if(savingProduct)return;if(productImagePreview.startsWith('blob:'))URL.revokeObjectURL(productImagePreview);setProductImage(null);setExistingProductImage('');setProductImagePreview('');setProductOpen(false)}
  const openEdit=(product:Product)=>{setEditingId(product.id);setProductForm({name:product.name,category:product.category,description:product.description,price:String(product.price),stock:String(product.stock),status:product.status,specs:product.specs.join('\n'),icon:product.icon,accent:product.accent});setProductImage(null);setExistingProductImage(product.imageUrl||'');setProductImagePreview(product.imageUrl||'');setProductOpen(true)}
  const setProductField=<K extends keyof ProductForm>(key:K,value:ProductForm[K])=>setProductForm(form=>({...form,[key]:value}))
  const chooseProductImage=(file:File|undefined)=>{if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)){showToast({tone:'error',title:'Format tidak didukung',message:'Gunakan JPG, PNG, atau WebP.'});return}if(file.size>5*1024*1024){showToast({tone:'error',title:'File terlalu besar',message:'Ukuran gambar maksimal 5MB.'});return}if(productImagePreview.startsWith('blob:'))URL.revokeObjectURL(productImagePreview);setProductImage(file);setProductImagePreview(URL.createObjectURL(file))}
  const cancelProductImage=()=>{if(productImagePreview.startsWith('blob:'))URL.revokeObjectURL(productImagePreview);setProductImage(null);setProductImagePreview(existingProductImage)}

  const saveProduct=async(event:FormEvent)=>{
    event.preventDefault();setSavingProduct(true);let metadataSaved=false
    const payload={...productForm,price:Number(productForm.price),stock:Number(productForm.stock),specs:productForm.specs.split('\n').map(item=>item.trim()).filter(Boolean)}
    try{
      const result=editingId?await api<{product:Product}>(`/admin/products/${editingId}`,{method:'PATCH',body:JSON.stringify(payload)}):await api<{product:Product}>('/admin/products',{method:'POST',body:JSON.stringify(payload)});metadataSaved=true
      if(!editingId)setEditingId(result.product.id)
      if(productImage)await uploadProductImage(result.product.id,productImage)
      await refreshProducts();setProductOpen(false);setProductImage(null);setExistingProductImage('');if(productImagePreview.startsWith('blob:'))URL.revokeObjectURL(productImagePreview);setProductImagePreview('');showToast({tone:'success',title:editingId?'Produk diperbarui':'Produk ditambahkan',message:'Katalog Cookie sudah menggunakan data terbaru.'})
    }catch(error){if(metadataSaved)await refreshProducts();showToast({tone:'error',title:metadataSaved?'Data produk tersimpan, foto belum':'Produk belum disimpan',message:error instanceof Error?error.message:'Periksa form.'})}
    finally{setSavingProduct(false)}
  }

  const removeProductImage=async()=>{if(!editingId)return;setSavingProduct(true);try{await deleteProductImage(editingId);setProductImage(null);setExistingProductImage('');setProductImagePreview('');await refreshProducts();showToast({tone:'success',title:'Gambar produk dihapus'})}catch(error){showToast({tone:'error',title:'Gambar belum dihapus',message:error instanceof Error?error.message:'Coba lagi.'})}finally{setSavingProduct(false)}}

  const confirmDelete=async()=>{
    if(!deleteProduct)return;setDeleting(true)
    try{await api(`/admin/products/${deleteProduct.id}`,{method:'DELETE'});await refreshProducts();setDeleteProduct(null);showToast({tone:'success',title:'Produk dihapus',message:'Produk tidak lagi tampil di Cookie Store.'})}
    catch(error){showToast({tone:'error',title:'Produk belum dihapus',message:error instanceof Error?error.message:'Coba lagi.'})}
    finally{setDeleting(false)}
  }

  const updateUser=async(id:string,change:{role?:ManagedUser['role'];status?:ManagedUser['status']})=>{
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
        <article><span className="admin-metric__icon pink"><ShoppingBag/></span><span><small>ORDER TERBARU</small><strong>{orders.length}</strong><em>Supabase</em></span></article>
        <article><span className="admin-metric__icon amber"><CircleDollarSign/></span><span><small>ORDER VALUE</small><strong>{rupiah(revenue)}</strong><em>Riwayat tampil</em></span></article>
      </section>
      <section className="admin-v2__overview">
        <article className="admin-v2__quick"><div className="card-heading"><div><span className="eyebrow">QUICK CONTROL</span><h2>Yang sering dibutuhkan</h2></div></div><div><button onClick={openCreate}><span><Plus/></span><b>Tambah produk</b><small>Buat Cookie baru</small><ArrowRight/></button><button onClick={()=>setTab('users')}><span><UserCog/></span><b>Atur role</b><small>User, moderator, admin</small><ArrowRight/></button><button onClick={()=>setTab('products')}><span><Package/></span><b>Kelola stok</b><small>Harga dan availability</small><ArrowRight/></button></div></article>
        <article className="admin-v2__activity"><div className="card-heading"><div><span className="eyebrow">SYSTEM SNAPSHOT</span><h2>{productsError?'Katalog perlu diperiksa.':productsLoading?'Menghubungkan Supabase…':'Katalog dalam kondisi normal.'}</h2></div><Badge tone={productsError?'error':productsLoading?'warning':'success'}>{productsError?'Error':productsLoading?'Loading':'Live'}</Badge></div><div className="admin-v2__health"><span><i/><b>Public catalog API</b><small>Connected</small></span><span><i/><b>Role authorization</b><small>Backend enforced</small></span><span><i/><b>Audit actions</b><small>Recording</small></span></div></article>
      </section>
    </m.div>}

    {tab==='products'&&<m.section {...panelMotion} className="admin-v2__data">
      <div className="admin-v2__data-head"><div><span className="eyebrow">PRODUCT MANAGEMENT</span><h2>Katalog Cookie</h2><p>Perubahan tersambung langsung ke halaman store.</p></div><Button onClick={openCreate}><Plus/> Tambah produk</Button></div>
      {products.length?<div className="admin-product-list">{products.map((product,index)=><m.article key={product.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:reduceMotion?0:index*.04}}><span className={`listing-art ${product.accent}`} style={product.imageUrl?{backgroundImage:`url(${product.imageUrl})`}:undefined}>{product.imageUrl?'':product.icon}</span><div className="admin-product-main"><span><Badge>{product.category}</Badge><StatusBadge status={product.status}/></span><h3>{product.name}</h3><p>{product.description}</p><small>ID: {product.id} • {product.sold.toLocaleString('id-ID')} terjual</small></div><div className="admin-product-value"><small>HARGA</small><strong>{rupiah(product.price)}</strong></div><div className="admin-product-value"><small>STOK</small><strong>{product.stock}</strong></div><div className="admin-product-actions"><button className="icon-btn" onClick={()=>openEdit(product)} aria-label={`Edit ${product.name}`}><Edit3/></button><button className="icon-btn icon-btn--danger" onClick={()=>setDeleteProduct(product)} aria-label={`Hapus ${product.name}`}><Trash2/></button></div></m.article>)}</div>:<div className="admin-v2__empty"><Cookie/><h3>Belum ada produk</h3><p>Tambahkan Cookie pertama untuk menampilkan katalog.</p><Button onClick={openCreate}><Plus/> Tambah produk</Button></div>}
    </m.section>}

    {tab==='users'&&<m.section {...panelMotion} className="admin-v2__data">
      <div className="admin-v2__data-head"><div><span className="eyebrow">USER & ROLE MANAGEMENT</span><h2>Pengguna dan akses</h2><p>Role disimpan oleh backend, bukan hanya disembunyikan dari UI.</p></div><div className="admin-v2__search"><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Cari nama, username, email…"/><button onClick={()=>void loadUsers()} aria-label="Muat ulang"><RefreshCw className={loadingUsers?'spin':''}/></button></div></div>
      <div className="admin-user-list">{filteredUsers.map(item=><article key={item.id}><span className="admin-user-avatar" style={item.avatarUrl?{backgroundImage:`url(${item.avatarUrl})`}:undefined}>{item.avatarUrl?'':item.avatar}</span><div><strong>{item.nickname}</strong><span>@{item.username}</span><small>{item.email}</small></div><label><small>ROLE</small><select value={item.role} disabled={busyUser===item.id||item.id===currentUser?.id} onChange={event=>void updateUser(item.id,{role:event.target.value as ManagedUser['role']})}><option value="user">User</option><option value="moderator">Moderator</option><option value="admin">Admin</option></select></label><span className="admin-user-status"><Badge tone={item.status==='active'?'success':'error'}>{item.status==='active'?'Aktif':'Ditangguhkan'}</Badge></span><Button variant={item.status==='active'?'ghost':'secondary'} loading={busyUser===item.id} disabled={item.id===currentUser?.id} onClick={()=>void updateUser(item.id,{status:item.status==='active'?'suspended':'active'})}>{item.status==='active'?'Tangguhkan':'Pulihkan'}</Button></article>)}</div>
    </m.section>}

    {tab==='orders'&&<m.section {...panelMotion} className="admin-v2__data">
      <div className="admin-v2__data-head"><div><span className="eyebrow">TRANSACTION CONTROL</span><h2>Transaksi terbaru</h2><p>Nominal checkout berasal dari katalog server.</p></div></div>
      <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Order</th><th>Produk</th><th>Tanggal</th><th>Nilai</th><th>Status</th><th></th></tr></thead><tbody>{orders.map(order=><tr key={order.id}><td><strong>{order.id}</strong></td><td>{order.productName}</td><td>{order.date}</td><td><strong>{rupiah(order.price)}</strong></td><td><StatusBadge status={order.status}/></td><td><button className="icon-btn icon-btn--sm" onClick={()=>setSelectedOrder(order)} aria-label={`Lihat ${order.id}`}><Eye/></button></td></tr>)}</tbody></table></div>
    </m.section>}

    <OrderDetailModal order={selectedOrder} onClose={()=>setSelectedOrder(null)}/>

    <Modal open={productOpen} onClose={closeProduct} eyebrow={editingId?'PRODUCT / EDIT':'PRODUCT / NEW'} title={editingId?'Edit produk':'Tambah produk'} footer={<><Button variant="secondary" onClick={closeProduct} disabled={savingProduct}>Batal</Button><Button type="submit" form="admin-product-form" loading={savingProduct}>{editingId?'Simpan perubahan':'Tambah produk'}</Button></>}>
      <form id="admin-product-form" className="admin-product-form" onSubmit={saveProduct}><fieldset className="admin-product-fieldset" disabled={savingProduct}><div className="admin-product-image-field"><div className={`admin-product-image-preview ${productForm.accent}`} style={productImagePreview?{backgroundImage:`url(${productImagePreview})`}:undefined}>{productImagePreview?'':<ImageIcon/>}</div><div><strong>Foto produk</strong><p>JPG, PNG, atau WebP. Maksimal 5MB.</p><label className="btn btn--secondary btn--sm">{productImagePreview?'Ganti foto':'Pilih foto'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={savingProduct} onChange={event=>chooseProductImage(event.target.files?.[0])}/></label>{productImage?<button className="admin-remove-image" type="button" disabled={savingProduct} onClick={cancelProductImage}>Batalkan foto pilihan</button>:editingId&&existingProductImage&&<button className="admin-remove-image" type="button" disabled={savingProduct} onClick={()=>void removeProductImage()}>Hapus foto lama</button>}</div></div><Input label="Nama produk" name="product-name" required minLength={4} maxLength={80} value={productForm.name} onChange={event=>setProductField('name',event.target.value)} placeholder="Cookie Special"/><div className="admin-form-row"><Input label="Kategori" name="product-category" required value={productForm.category} onChange={event=>setProductField('category',event.target.value)}/><Input label="Ikon (1–2 karakter)" name="product-icon" required maxLength={2} value={productForm.icon} onChange={event=>setProductField('icon',event.target.value.toUpperCase())}/></div><label className="field"><span className="field__label">Deskripsi</span><textarea required minLength={20} maxLength={400} rows={4} value={productForm.description} onChange={event=>setProductField('description',event.target.value)} placeholder="Jelaskan kriteria dan delivery produk…"/></label><div className="admin-form-row"><Input label="Harga" name="product-price" type="number" min="1000" required value={productForm.price} onChange={event=>setProductField('price',event.target.value)}/><Input label="Stok" name="product-stock" type="number" min="0" required value={productForm.stock} onChange={event=>setProductField('stock',event.target.value)}/></div><div className="admin-form-row"><label className="field"><span className="field__label">Status</span><select value={productForm.status} onChange={event=>setProductField('status',event.target.value as ProductStatus)}><option value="ready">Tersedia</option><option value="limited">Stok terbatas</option><option value="sold">Habis</option></select></label><label className="field"><span className="field__label">Aksen</span><select value={productForm.accent} onChange={event=>setProductField('accent',event.target.value as Product['accent'])}><option value="violet">Ungu</option><option value="pink">Pink</option><option value="cyan">Cyan</option><option value="amber">Amber</option></select></label></div><label className="field"><span className="field__label">Spesifikasi — satu per baris</span><textarea required rows={4} value={productForm.specs} onChange={event=>setProductField('specs',event.target.value)}/></label></fieldset></form>
    </Modal>

    <Modal open={!!deleteProduct} onClose={()=>!deleting&&setDeleteProduct(null)} eyebrow="PRODUCT / DELETE" title="Hapus produk ini?" footer={<><Button variant="secondary" onClick={()=>setDeleteProduct(null)} disabled={deleting}>Batal</Button><Button variant="danger" loading={deleting} onClick={confirmDelete}>Hapus produk</Button></>}><div className="admin-delete-copy"><span><Trash2/></span><p><strong>{deleteProduct?.name}</strong> akan langsung hilang dari Cookie Store. Aksi ini dicatat di audit log.</p></div></Modal>
  </div></LazyMotion>
}
