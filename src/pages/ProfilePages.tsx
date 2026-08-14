import { BadgeCheck, Camera, Check, Cookie, Image, MapPin, Save, ShieldCheck, Upload, UserRound } from 'lucide-react'
import { FormEvent, useMemo, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PublicHeader } from '../components/PublicHeader'
import { Button, Input } from '../components/UI'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api, uploadProfileImage } from '../lib/api'

const accents = ['#8b5cf6','#ec4899','#22d3ee','#f59e0b']

export function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState({ nickname: user?.nickname || '', username: user?.username || '', bio: user?.bio || '', accent: user?.accent || accents[0] })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [loading, setLoading] = useState(false)
  const usernameError = useMemo(() => form.username && !/^[a-z0-9_]{4,20}$/.test(form.username) ? 'Gunakan 4–20 huruf kecil, angka, atau underscore.' : '', [form.username])
  if (!user) return null
  const set = (key: string, value: string) => setForm(v => ({ ...v, [key]: value }))

  const chooseFile = (file: File | undefined, type: 'avatar' | 'banner') => {
    setFileError('')
    if (!file) return
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { setFileError('Gunakan file JPG, PNG, atau WebP.'); return }
    const limit = type === 'avatar' ? 2 : 5
    if (file.size > limit * 1024 * 1024) { setFileError(`Ukuran maksimal ${limit}MB.`); return }
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      if (type === 'banner' && img.width / img.height < 2.5) { setFileError('Banner perlu rasio minimal 2.5:1.'); URL.revokeObjectURL(url); return }
      if (type === 'avatar') { setAvatarPreview(url); setAvatarFile(file) } else { setBannerPreview(url); setBannerFile(file) }
    }
    img.src = url
  }

  const save = async (e: FormEvent) => {
    e.preventDefault(); if (usernameError) return; setLoading(true)
    try {
      await Promise.all([avatarFile ? uploadProfileImage(avatarFile, 'avatar') : Promise.resolve(null), bannerFile ? uploadProfileImage(bannerFile, 'banner') : Promise.resolve(null)])
      await api('/profile', { method: 'PATCH', body: JSON.stringify(form) })
      updateUser(form); showToast({ tone: 'success', title: 'Profil disimpan', message: 'Identitas dan gambar publikmu sudah diperbarui.' })
    } catch (error) { showToast({ tone: 'error', title: 'Profil belum disimpan', message: error instanceof Error ? error.message : 'Coba lagi.' }) }
    finally { setLoading(false) }
  }

  return <div className="content-page profile-edit-page page-enter">
    <div className="page-heading"><div><span className="eyebrow">ACCOUNT IDENTITY</span><h1>Atur profil</h1><p>Identitas ini digunakan untuk checkout, riwayat pembelian, dan layanan bantuan.</p></div><Link className="btn btn--secondary" to={`/u/${user.username}`}>Lihat profil publik</Link></div>
    <form onSubmit={save}>
      <section className="profile-preview-card">
        <div className="profile-preview-banner" style={{'--profile-accent':form.accent, backgroundImage: bannerPreview ? `url(${bannerPreview})` : undefined} as CSSProperties}><label className="upload-button"><Image/> Ganti banner<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => chooseFile(e.target.files?.[0], 'banner')}/></label></div>
        <div className="profile-preview-content"><div className="avatar-edit"><span className="avatar avatar--xxl" style={{backgroundImage: avatarPreview ? `url(${avatarPreview})` : undefined}}>{!avatarPreview && user.avatar}</span><label><Camera/><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => chooseFile(e.target.files?.[0], 'avatar')}/></label></div><div><h2>{form.nickname || 'Nickname kamu'}</h2><span>@{form.username || 'username'}</span></div><span className="profile-preview-role"><ShieldCheck/> Akun terverifikasi</span></div>
      </section>
      {fileError && <div className="form-alert form-alert--error">{fileError}</div>}
      <div className="profile-form-grid">
        <section className="form-panel"><div className="form-panel__head"><span><UserRound/></span><div><h2>Identitas</h2><p>Nama yang tampil pada profil dan riwayat transaksi.</p></div></div><div className="form-panel__body"><Input label="Nickname" name="nickname" value={form.nickname} maxLength={32} onChange={e => set('nickname', e.target.value)} hint={`${form.nickname.length}/32 karakter`}/><Input label="Username" name="username" value={form.username} onChange={e => set('username', e.target.value.toLowerCase())} error={usernameError} hint="URL profil dan referensi transaksi akan ikut diperbarui."/><label className="field"><span className="field__label">Bio</span><textarea value={form.bio} maxLength={160} onChange={e => set('bio', e.target.value)} rows={4}/><span className="field__hint">{form.bio.length}/160 karakter</span></label></div></section>
        <section className="form-panel"><div className="form-panel__head"><span><Camera/></span><div><h2>Tampilan profil</h2><p>Aksen kecil untuk memberi karakter.</p></div></div><div className="form-panel__body"><div className="accent-picker"><label>Warna aksen</label><div>{accents.map(color => <button type="button" key={color} onClick={() => set('accent',color)} style={{background:color}} className={form.accent === color ? 'active' : ''} aria-label={`Pilih aksen ${color}`}>{form.accent === color && <Check/>}</button>)}</div></div><div className="upload-rules"><Upload/><div><strong>Aturan upload</strong><span>Avatar: JPG/PNG/WebP, maks. 2MB.</span><span>Banner: rasio min. 2.5:1, maks. 5MB.</span><span>File diperiksa ulang oleh server.</span></div></div></div></section>
      </div>
      <div className="sticky-save"><span>Pastikan tampilan preview sudah sesuai.</span><Button type="submit" loading={loading}><Save/> Simpan perubahan</Button></div>
    </form>
  </div>
}

export function PublicProfilePage() {
  const { username } = useParams()
  const name = username === 'raka_sore' ? 'Raka Aditya' : username?.replace(/_/g,' ') || 'Member Langgor'
  return <div className="public-profile-page"><PublicHeader/><main className="container public-profile-main">
    <section className="public-profile-hero"><div className="public-profile-banner"><span/><i/></div><div className="public-profile-info"><span className="avatar avatar--xxl">{name.slice(0,2).toUpperCase()}</span><div><h1>{name} <BadgeCheck/></h1><span>@{username}</span><p>Member Langgor Store dengan akun terverifikasi.</p><div className="profile-chips"><span><MapPin/> Indonesia</span><span><ShieldCheck/> Verified member</span><span><Cookie/> Cookie Store</span></div></div><button className="btn btn--secondary">Ikuti</button></div></section>
    <section className="public-profile-stats"><span><strong>18</strong><small>Transaksi selesai</small></span><span><strong>2025</strong><small>Bergabung</small></span><span><strong>100%</strong><small>Akun terverifikasi</small></span><span><strong>Private</strong><small>Riwayat order</small></span></section>
    <section className="profile-listings"><div className="section-head"><div><span className="eyebrow">PRIVACY STATUS</span><h2>Aktivitas bersifat privat.</h2><p>Informasi Cookie dan detail pembelian tidak ditampilkan pada profil publik.</p></div></div><div className="profile-placeholder"><ShieldCheck/><h3>Order details are private.</h3><p>Hanya pemilik akun yang dapat melihat delivery dan riwayat transaksi.</p></div></section>
  </main></div>
}
