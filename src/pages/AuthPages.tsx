import { ArrowLeft, ArrowRight, AtSign, Check, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Button, Input } from '../components/UI'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../lib/api'

type Mode = 'login' | 'register' | 'forgot' | 'reset' | 'verify'

function AuthArt({ mode }: { mode: Mode }) {
  return <aside className="auth-art">
    <div className="auth-art__noise" />
    <div className="auth-art__header"><Logo /><span>SECURE ENTRY / 2026</span></div>
    <div className="auth-art__message">
      <span className="auth-art__eyebrow"><i /> RUANG PERSONALMU</span>
      <h2>{mode === 'verify' ? <>Satu kode.<br/>Emailmu <em>terverifikasi.</em></> : mode === 'register' ? <>Buat akun.<br/>Lanjut ke <em>Cookie Store.</em></> : <>Masuk cepat.<br/>Order tetap <em>tercatat.</em></>}</h2>
      <p>{mode === 'verify' ? 'Masukkan enam angka yang dikirim dari otp@langgor.my.id untuk mengaktifkan akun.' : 'Pembelian Cookie, status validasi, delivery, dan riwayat transaksi tersedia dalam satu dashboard.'}</p>
    </div>
    <div className="auth-art__ticket"><div><span className="ticket-icon">L</span><span><small>LANGGOR PASS</small><strong>SESSION PROTECTED</strong></span></div><div className="ticket-code">•• •• ••</div></div>
    <div className="auth-art__footer"><span><ShieldCheck /> Password di-hash</span><span><LockKeyhole /> Sesi aman</span></div>
  </aside>
}

export function AuthPage({ mode }: { mode: Mode }) {
  const [form, setForm] = useState({ username: '', email: new URLSearchParams(window.location.search).get('email') || '', password: '', confirm: '', identifier: '', remember: true, otp: '' })
  const [resendCooldown,setResendCooldown]=useState(mode==='verify'?60:0)
  const [resendLoading,setResendLoading]=useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { login, register, verifyEmail, resendOtp } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(()=>{if(mode!=='verify'||resendCooldown<=0)return;const timer=window.setInterval(()=>setResendCooldown(value=>Math.max(0,value-1)),1000);return()=>window.clearInterval(timer)},[mode,resendCooldown])

  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (mode === 'register') {
      if (form.username && !/^[a-z0-9_]{4,20}$/.test(form.username)) e.username = 'Gunakan 4–20 huruf kecil, angka, atau underscore.'
      if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Format email belum benar.'
      if (form.password && form.password.length < 8) e.password = 'Minimal 8 karakter.'
      if (form.confirm && form.confirm !== form.password) e.confirm = 'Konfirmasi password tidak sama.'
    }
    if ((mode === 'forgot' || mode === 'reset') && form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Format email belum benar.'
    if (mode === 'reset' && form.confirm && form.confirm !== form.password) e.confirm = 'Konfirmasi password tidak sama.'
    if (mode === 'verify') {
      if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Masukkan email yang menerima kode.'
      if (!/^\d{6}$/.test(form.otp)) e.otp = 'Masukkan tepat 6 angka.'
    }
    return e
  }, [form, mode])

  const set = (key: string, value: string | boolean) => setForm(v => ({ ...v, [key]: value }))
  const blur = (key: string) => setTouched(v => ({ ...v, [key]: true }))
  const handleResend=async()=>{if(resendCooldown>0||resendLoading||!/^\S+@\S+\.\S+$/.test(form.email))return;setResendLoading(true);try{await resendOtp(form.email);setResendCooldown(60);showToast({tone:'success',title:'OTP dikirim ulang',message:`Kode baru dikirim ke ${form.email}.`})}catch(error){showToast({tone:'error',title:'Belum dapat mengirim ulang',message:error instanceof Error?error.message:'Coba lagi nanti.'})}finally{setResendLoading(false)}}
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (Object.keys(errors).length) { setTouched({ username: true, email: true, password: true, confirm: true, otp: true }); return }
    setLoading(true)
    try {
      if (mode === 'login') {
        const user = await login(form.identifier, form.password, form.remember)
        showToast({ tone: 'success', title: `Halo lagi, ${user.nickname}!`, message: 'Ruang personalmu sudah siap.' })
        const target = (location.state as { from?: string })?.from || (user.role === 'admin' ? '/admin' : '/dashboard')
        navigate(target)
      } else if (mode === 'register') {
        const registeredUser = await register({ username: form.username, email: form.email, password: form.password })
        if (registeredUser) { showToast({ tone: 'success', title: 'Akun berhasil dibuat', message: 'Selamat datang di Langgor Store.' }); navigate('/dashboard') }
        else { showToast({ tone: 'info', title: 'Kode OTP telah dikirim', message: `Periksa inbox ${form.email}.` }); navigate(`/verify-email?email=${encodeURIComponent(form.email)}`) }
      } else if (mode === 'verify') {
        const user=await verifyEmail(form.email,form.otp)
        showToast({tone:'success',title:'Email berhasil diverifikasi',message:`Selamat datang, ${user.nickname}.`})
        navigate(user.role==='admin'?'/admin':'/dashboard')
      } else if (mode === 'forgot') {
        await api('/auth/forgot', { method: 'POST', body: JSON.stringify({ email: form.email }) })
        setSent(true)
      } else {
        const hashParams=new URLSearchParams(window.location.hash.replace(/^#/,''));const queryParams=new URLSearchParams(window.location.search);const accessToken=hashParams.get('access_token')||queryParams.get('access_token')||''
        await api('/auth/reset',{method:'POST',body:JSON.stringify({accessToken,password:form.password})});setSent(true)
      }
    } catch (error) { showToast({ tone: 'error', title: 'Belum berhasil', message: error instanceof Error ? error.message : 'Silakan coba lagi.' }) }
    finally { setLoading(false) }
  }

  const title = mode === 'login' ? 'Masuk ke ruangmu' : mode === 'register' ? 'Buat akun Langgor' : mode === 'verify' ? 'Verifikasi email' : mode === 'forgot' ? 'Pulihkan akses' : 'Atur password baru'
  const subtitle = mode === 'login' ? 'Lihat pembelian, status validasi, dan delivery Cookie.' : mode === 'register' ? 'Satu akun untuk checkout dan mengakses seluruh riwayat pembelian.' : mode === 'verify' ? `Masukkan kode 6 digit yang dikirim ke ${form.email || 'email kamu'}.` : mode === 'forgot' ? 'Kami kirim tautan pemulihan jika email terdaftar.' : 'Gunakan kombinasi yang belum pernah kamu pakai.'

  return <div className="auth-page">
    <AuthArt mode={mode} />
    <main className="auth-main">
      <div className="auth-mobile-logo"><Logo /></div>
      <div className="auth-box">
        {(mode === 'forgot' || mode === 'reset' || mode === 'verify') && <Link to={mode==='verify'?'/register':'/login'} className="back-link"><ArrowLeft /> {mode==='verify'?'Ganti email':'Kembali ke login'}</Link>}
        {!sent ? <>
          <div className="auth-title"><span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : mode === 'register' ? 'NEW SPACE' : mode === 'verify' ? 'EMAIL / OTP VERIFICATION' : 'ACCOUNT RECOVERY'}</span><h1>{title}</h1><p>{subtitle}</p></div>
          <form className="auth-form" onSubmit={submit} noValidate>
            {mode === 'login' && <Input label="Email atau username" name="identifier" icon={<AtSign />} placeholder="contoh@langgor.store" autoComplete="username" required value={form.identifier} onChange={e => set('identifier', e.target.value)} />}
            {mode === 'register' && <>
              <Input label="Username" name="username" icon={<UserRound />} placeholder="raka_sore" autoComplete="username" required value={form.username} onChange={e => set('username', e.target.value.toLowerCase())} onBlur={() => blur('username')} error={touched.username ? errors.username : undefined} hint={form.username && !errors.username ? 'Username tersedia' : '4–20 karakter, tanpa spasi'} />
              <Input label="Email" name="email" icon={<Mail />} placeholder="kamu@email.com" type="email" autoComplete="email" required value={form.email} onChange={e => set('email', e.target.value)} onBlur={() => blur('email')} error={touched.email ? errors.email : undefined} />
            </>}
            {mode === 'verify' && <><Input label="Email tujuan" name="verify-email" icon={<Mail />} type="email" required value={form.email} onChange={e=>set('email',e.target.value)} error={touched.email?errors.email:undefined}/><label className="otp-field"><span className="field__label">Kode OTP 6 digit</span><input name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={6} required autoFocus value={form.otp} onChange={e=>set('otp',e.target.value.replace(/\D/g,'').slice(0,6))} onBlur={()=>blur('otp')} aria-invalid={!!(touched.otp&&errors.otp)} placeholder="000000"/>{touched.otp&&errors.otp?<span className="field__error">{errors.otp}</span>:<span className="field__hint">Dikirim oleh otp@langgor.my.id</span>}</label><div className="otp-resend"><span>Tidak menerima kode?</span><button type="button" onClick={()=>void handleResend()} disabled={resendCooldown>0||resendLoading}>{resendLoading?'Mengirim…':resendCooldown>0?`Kirim ulang dalam ${resendCooldown}s`:'Kirim ulang OTP'}</button></div></>}
            {mode === 'forgot' && <Input label="Email terdaftar" name="email" icon={<Mail />} placeholder="kamu@email.com" type="email" required value={form.email} onChange={e => set('email', e.target.value)} onBlur={() => blur('email')} error={touched.email ? errors.email : undefined} />}
            {(mode === 'login' || mode === 'register' || mode === 'reset') && <div className="password-wrap"><Input label={mode === 'reset' ? 'Password baru' : 'Password'} name="password" icon={<KeyRound />} placeholder="Minimal 8 karakter" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required value={form.password} onChange={e => set('password', e.target.value)} onBlur={() => blur('password')} error={touched.password ? errors.password : undefined} /><button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showPassword ? <EyeOff /> : <Eye />}</button></div>}
            {(mode === 'register' || mode === 'reset') && <Input label="Konfirmasi password" name="confirm" icon={<LockKeyhole />} placeholder="Ulangi password" type="password" autoComplete="new-password" required value={form.confirm} onChange={e => set('confirm', e.target.value)} onBlur={() => blur('confirm')} error={touched.confirm ? errors.confirm : undefined} />}
            {mode === 'login' && <div className="form-row"><label className="check"><input type="checkbox" checked={form.remember} onChange={e => set('remember', e.target.checked)} /><span><Check /></span> Ingat saya</label><Link to="/forgot-password">Lupa password?</Link></div>}
            <Button type="submit" className="auth-submit" loading={loading}>{mode === 'login' ? 'Masuk' : mode === 'register' ? 'Buat akun' : mode === 'verify' ? 'Verifikasi email' : mode === 'forgot' ? 'Kirim tautan reset' : 'Simpan password'} <ArrowRight /></Button>
          </form>
          {(mode === 'login' || mode === 'register') && <p className="auth-switch">{mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'} <Link to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Daftar sekarang' : 'Masuk di sini'}</Link></p>}
          <p className="auth-legal">Dengan melanjutkan, kamu menyetujui <a href="#terms">Syarat</a> dan <a href="#privacy">Kebijakan Privasi</a> Langgor.</p>
        </> : <div className="auth-success"><span><Check /></span><h1>{mode === 'forgot' ? 'Cek inbox kamu' : 'Password diperbarui'}</h1><p>{mode === 'forgot' ? `Jika ${form.email} terdaftar, tautan reset akan tiba dalam beberapa menit.` : 'Kamu sekarang bisa masuk dengan password yang baru.'}</p><Link className="btn btn--primary" to="/login">Kembali ke login <ArrowRight /></Link></div>}
      </div>
    </main>
  </div>
}
