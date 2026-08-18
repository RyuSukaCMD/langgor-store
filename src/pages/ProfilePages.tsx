import { BadgeCheck, Camera, Check, Cookie, Image, Play, Save, ShieldCheck, Sparkles, Upload, UserRound } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PublicHeader } from '../components/PublicHeader'
import { Avatar } from '../components/Avatar'
import { ProfileEffect } from '../components/ProfileEffect'
import { Button, Input } from '../components/UI'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api, uploadProfileImage } from '../lib/api'
import type { ProfileAnimation, ProfileEffect as ProfileEffectName, User } from '../types'

const gradientPresets=[['#8b5cf6','#22d3ee'],['#ec4899','#8b5cf6'],['#f59e0b','#ec4899'],['#22d3ee','#16a36a'],['#6d4aff','#ff4f9a']]
const profileEffects:[ProfileEffectName,string,string][]=[['none','Tanpa efek','Tampilan bersih'],['aurora','Aurora','Cahaya lembut bergerak'],['stardust','Stardust','Bintang kecil berkilau'],['comet','Comet','Garis cahaya melintas'],['ripple','Ripple','Gelombang berulang'],['pixels','Pixel drift','Partikel kotak melayang']]
const profileAnimations:[ProfileAnimation,string][]=[['fade','Fade'],['rise','Rise'],['zoom','Zoom'],['slide','Slide'],['flip','Flip']]

export function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState({ nickname:user?.nickname||'',username:user?.username||'',bio:user?.bio||'',accent:user?.accent||gradientPresets[0][0],accentSecondary:user?.accentSecondary||gradientPresets[0][1],profileEffect:user?.profileEffect||'none' as ProfileEffectName,profileAnimation:user?.profileAnimation||'fade' as ProfileAnimation })
  const [previewKey,setPreviewKey]=useState(0)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [loading, setLoading] = useState(false)
  const usernameError = useMemo(() => form.username && !/^[a-z0-9_]{4,20}$/.test(form.username) ? 'Gunakan 4–20 huruf kecil, angka, atau underscore.' : '', [form.username])
  if (!user) return null
  const set = (key: string, value: string) => setForm(v => ({ ...v, [key]: value }))
  const avatarSource=avatarPreview||user.avatarUrl
  const bannerSource=bannerPreview||user.bannerUrl
  const profileVars={'--profile-accent':form.accent,'--profile-accent-2':form.accentSecondary} as CSSProperties
  const previewBannerStyle={...profileVars,backgroundImage:bannerSource?`linear-gradient(135deg,${form.accent}55,${form.accentSecondary}44),url(${bannerSource})`:undefined} as CSSProperties

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
    e.preventDefault();if(usernameError)return;setLoading(true);let identitySaved=false
    try{
      const identity=await api<{user:User}>('/profile',{method:'PATCH',body:JSON.stringify(form)});identitySaved=true
      let nextUser={...identity.user,avatarUrl:identity.user.avatarUrl||user.avatarUrl,bannerUrl:identity.user.bannerUrl||user.bannerUrl};updateUser(nextUser)
      if(avatarFile){const uploaded=await uploadProfileImage(avatarFile,'avatar');nextUser={...nextUser,avatarUrl:uploaded.url};updateUser(nextUser);setAvatarFile(null);if(avatarPreview)URL.revokeObjectURL(avatarPreview);setAvatarPreview(null)}
      if(bannerFile){const uploaded=await uploadProfileImage(bannerFile,'banner');nextUser={...nextUser,bannerUrl:uploaded.url};updateUser(nextUser);setBannerFile(null);if(bannerPreview)URL.revokeObjectURL(bannerPreview);setBannerPreview(null)}
      showToast({tone:'success',title:'Profil disimpan',message:'Identitas dan gambar profilmu sudah diperbarui.'})
    }catch(error){showToast({tone:'error',title:identitySaved?'Sebagian profil tersimpan':'Profil belum disimpan',message:error instanceof Error?error.message:'Coba lagi.'})}
    finally{setLoading(false)}
  }

  return <div className="content-page profile-edit-page page-enter">
    <div className="page-heading"><div><span className="eyebrow">ACCOUNT IDENTITY</span><h1>Atur profil</h1><p>Identitas ini digunakan untuk checkout, riwayat pembelian, dan layanan bantuan.</p></div><Link className="btn btn--secondary" to={`/u/${user.username}`}>Lihat profil publik</Link></div>
    <form onSubmit={save}>
      <fieldset className="profile-save-fieldset" disabled={loading}><section key={`${form.profileAnimation}-${previewKey}`} className={`profile-preview-card profile-enter--${form.profileAnimation}`} style={profileVars}>
        <div className="profile-preview-banner" style={previewBannerStyle}><ProfileEffect effect={form.profileEffect}/><label className="upload-button"><Image/> Ganti banner<input type="file" accept="image/jpeg,image/png,image/webp" disabled={loading} onChange={e => chooseFile(e.target.files?.[0], 'banner')}/></label></div>
        <div className="profile-preview-content"><div className="avatar-edit"><Avatar className="avatar--xxl" src={avatarSource} initials={user.avatar} label="Foto profil saat ini"/><label><Camera/><input type="file" accept="image/jpeg,image/png,image/webp" disabled={loading} onChange={e => chooseFile(e.target.files?.[0], 'avatar')}/></label></div><div><h2>{form.nickname || 'Nickname kamu'}</h2><span>@{form.username || 'username'}</span></div><span className="profile-preview-role"><ShieldCheck/> Akun terverifikasi</span></div>
      </section>
      {fileError && <div className="form-alert form-alert--error">{fileError}</div>}
      <div className="profile-form-grid">
        <section className="form-panel"><div className="form-panel__head"><span><UserRound/></span><div><h2>Identitas</h2><p>Nama yang tampil pada profil dan riwayat transaksi.</p></div></div><div className="form-panel__body"><Input label="Nickname" name="nickname" value={form.nickname} maxLength={32} onChange={e => set('nickname', e.target.value)} hint={`${form.nickname.length}/32 karakter`}/><Input label="Username" name="username" value={form.username} onChange={e => set('username', e.target.value.toLowerCase())} error={usernameError} hint="URL profil dan referensi transaksi akan ikut diperbarui."/><label className="field"><span className="field__label">Bio</span><textarea value={form.bio} maxLength={160} onChange={e => set('bio', e.target.value)} rows={4}/><span className="field__hint">{form.bio.length}/160 karakter</span></label></div></section>
        <section className="form-panel profile-style-panel"><div className="form-panel__head"><span><Sparkles/></span><div><h2>Tampilan profil</h2><p>Atur gradient, efek, dan animasi pembuka.</p></div></div><div className="form-panel__body"><div className="profile-style-group"><label>Gradient dua warna</label><div className="gradient-color-inputs"><label><input type="color" value={form.accent} onChange={event=>set('accent',event.target.value)}/><span>Warna utama</span></label><label><input type="color" value={form.accentSecondary} onChange={event=>set('accentSecondary',event.target.value)}/><span>Warna kedua</span></label></div><div className="gradient-presets">{gradientPresets.map(([first,second])=><button type="button" key={`${first}-${second}`} style={{background:`linear-gradient(135deg,${first},${second})`}} className={form.accent===first&&form.accentSecondary===second?'active':''} onClick={()=>setForm(current=>({...current,accent:first,accentSecondary:second}))} aria-label={`Pilih gradient ${first} dan ${second}`}>{form.accent===first&&form.accentSecondary===second&&<Check/>}</button>)}</div></div><div className="profile-style-group"><label>Efek profil</label><div className="profile-effect-picker">{profileEffects.map(([effect,label,description])=><button type="button" key={effect} className={form.profileEffect===effect?'active':''} onClick={()=>set('profileEffect',effect)}><i><Sparkles/></i><span><b>{label}</b><small>{description}</small></span>{form.profileEffect===effect&&<Check/>}</button>)}</div></div><div className="profile-style-group"><div className="profile-style-label-row"><label>Animasi saat profil dibuka</label><button type="button" onClick={()=>setPreviewKey(key=>key+1)}><Play/> Putar ulang</button></div><div className="profile-animation-picker">{profileAnimations.map(([animation,label])=><button type="button" key={animation} className={form.profileAnimation===animation?'active':''} onClick={()=>{set('profileAnimation',animation);setPreviewKey(key=>key+1)}}>{label}</button>)}</div></div><div className="upload-rules"><Upload/><div><strong>Aturan upload</strong><span>Avatar: JPG/PNG/WebP, maks. 2MB.</span><span>Banner: rasio min. 2.5:1, maks. 5MB.</span><span>File diperiksa ulang sebelum disimpan.</span></div></div></div></section>
      </div></fieldset>
      <div className="sticky-save"><span>Pastikan tampilan preview sudah sesuai.</span><Button type="submit" loading={loading}><Save/> Simpan perubahan</Button></div>
    </form>
  </div>
}

export function PublicProfilePage() {
  const { username } = useParams()
  const [profile,setProfile]=useState<{username:string;nickname:string;bio:string;avatarUrl?:string;bannerUrl?:string;accent?:string;accentSecondary?:string;profileEffect?:ProfileEffectName;profileAnimation?:ProfileAnimation;joinedAt:string}|null>(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  useEffect(()=>{setLoading(true);api<{profile:typeof profile}>(`/users/${username}/public`).then(result=>setProfile(result.profile)).catch(reason=>setError(reason instanceof Error?reason.message:'Profil tidak ditemukan.')).finally(()=>setLoading(false))},[username])
  if(loading)return <div className="route-loader">Memuat profil…</div>
  if(error||!profile)return <div className="public-profile-page"><PublicHeader/><main className="not-found"><h1>Profil tidak tersedia.</h1><p>{error}</p></main></div>
  const initials=profile.nickname.split(/\s+/).map(part=>part[0]).slice(0,2).join('').toUpperCase()
  const joined=new Date(profile.joinedAt).toLocaleDateString('id-ID',{month:'long',year:'numeric'})
  const accent=profile.accent||'#8b5cf6';const accentSecondary=profile.accentSecondary||'#22d3ee';const publicVars={'--profile-accent':accent,'--profile-accent-2':accentSecondary} as CSSProperties;const publicBannerStyle={...publicVars,backgroundImage:profile.bannerUrl?`linear-gradient(135deg,${accent}55,${accentSecondary}44),url(${profile.bannerUrl})`:undefined} as CSSProperties
  return <div className="public-profile-page"><PublicHeader/><main className="container public-profile-main">
    <section className={`public-profile-hero profile-enter--${profile.profileAnimation||'fade'}`} style={publicVars}><div className="public-profile-banner" style={publicBannerStyle}><ProfileEffect effect={profile.profileEffect||'none'}/><span/><i/></div><div className="public-profile-info"><Avatar className="avatar--xxl" src={profile.avatarUrl} initials={initials} label={`Foto profil ${profile.nickname}`}/><div><h1>{profile.nickname} <BadgeCheck/></h1><span>@{profile.username}</span><p>{profile.bio}</p><div className="profile-chips"><span><ShieldCheck/> Verified member</span><span><Cookie/> Cookie Store</span><span>Bergabung {joined}</span></div></div></div></section>
    <section className="profile-listings"><div className="section-head"><div><span className="eyebrow">PRIVACY STATUS</span><h2>Aktivitas bersifat privat.</h2><p>Informasi Cookie dan detail pembelian tidak ditampilkan pada profil publik.</p></div></div><div className="profile-placeholder"><ShieldCheck/><h3>Order details are private.</h3><p>Hanya pemilik akun yang dapat melihat delivery dan riwayat transaksi.</p></div></section>
  </main></div>
}
