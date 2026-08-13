import { ArrowLeft, ArrowRight, AtSign, Check, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { FormEvent, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Button, Input } from '../components/UI'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../lib/api'

type Mode = 'login' | 'register' | 'forgot' | 'reset'

function AuthArt({ mode }: { mode: Mode }) {
  return <aside className="auth-art">
    <div className="auth-art__noise" />
    <div className="auth-art__header"><Logo /><span>SECURE ENTRY / 2026</span></div>
    <div className="auth-art__message">
      <span className="auth-art__eyebrow"><i /> RUANG PERSONALMU</span>
      <h2>{mode === 'register' ? <>Mulai dari profil.<br/>Lanjut ke <em>etalase.</em></> : <>Masuk cepat.<br/>Pesanan tetap <em>tercatat.</em></>}</h2>
      <p>Cookie, akun digital, status pembayaran, dan aktivitas seller—semuanya ada di satu ruang yang mudah dipantau.</p>
    </div>
    <div className="auth-art__ticket"><div><span className="ticket-icon">L</span><span><small>LANGGOR PASS</small><strong>SESSION PROTECTED</strong></span></div><div className="ticket-code">•• •• ••</div></div>
    <div className="auth-art__footer"><span><ShieldCheck /> Password di-hash</span><span><LockKeyhole /> Sesi aman</span></div>
  </aside>
}

export function AuthPage({ mode }: { mode: Mode }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '', identifier: '', remember: true })
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { login, register } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

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
    return e
  }, [form, mode])

  const set = (key: string, value: string | boolean) => setForm(v => ({ ...v, [key]: value }))
  const blur = (key: string) => setTouched(v => ({ ...v, [key]: true }))
  const fillDemo = (role: 'user' | 'admin') => setForm(v => ({ ...v, identifier: role === 'admin' ? 'admin@langgor.store' : 'raka@langgor.store', password: 'Langgor123!' }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (Object.keys(errors).length) { setTouched({ username: true, email: true, password: true, confirm: true }); return }
    setLoading(true)
    try {
      if (mode === 'login') {
        const user = await login(form.identifier, form.password, form.remember)
        showToast({ tone: 'success', title: `Halo lagi, ${user.nickname}!`, message: 'Ruang personalmu sudah siap.' })
        const target = (location.state as { from?: string })?.from || (user.role === 'admin' ? '/admin' : '/dashboard')
        navigate(target)
      } else if (mode === 'register') {
        await register({ username: form.username, email: form.email, password: form.password })
        showToast({ tone: 'success', title: 'Akun berhasil dibuat', message: 'Selamat datang di Langgor Store.' })
        navigate('/dashboard')
      } else if (mode === 'forgot') {
        await api('/auth/forgot', { method: 'POST', body: JSON.stringify({ email: form.email }) })
        setSent(true)
      } else {
        await new Promise(resolve => setTimeout(resolve, 900)); setSent(true)
      }
    } catch (error) { showToast({ tone: 'error', title: 'Belum berhasil', message: error instanceof Error ? error.message : 'Silakan coba lagi.' }) }
    finally { setLoading(false) }
  }

  const title = mode === 'login' ? 'Masuk ke ruangmu' : mode === 'register' ? 'Buat akun Langgor' : mode === 'forgot' ? 'Pulihkan akses' : 'Atur password baru'
  const subtitle = mode === 'login' ? 'Lanjutkan transaksi atau lihat pesanan terakhir.' : mode === 'register' ? 'Satu akun untuk belanja, jualan, dan kelola profil.' : mode === 'forgot' ? 'Kami kirim tautan reset jika email terdaftar.' : 'Gunakan kombinasi yang belum pernah kamu pakai.'

  return <div className="auth-page">
    <AuthArt mode={mode} />
    <main className="auth-main">
      <div className="auth-mobile-logo"><Logo /></div>
      <div className="auth-box">
        {(mode === 'forgot' || mode === 'reset') && <Link to="/login" className="back-link"><ArrowLeft /> Kembali ke login</Link>}
        {!sent ? <>
          <div className="auth-title"><span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : mode === 'register' ? 'NEW SPACE' : 'ACCOUNT RECOVERY'}</span><h1>{title}</h1><p>{subtitle}</p></div>
          {mode === 'login' && <div className="demo-accounts"><span>Coba akun demo:</span><button type="button" onClick={() => fillDemo('user')}>User</button><button type="button" onClick={() => fillDemo('admin')}>Admin</button></div>}
          <form className="auth-form" onSubmit={submit} noValidate>
            {mode === 'login' && <Input label="Email atau username" name="identifier" icon={<AtSign />} placeholder="contoh@langgor.store" autoComplete="username" required value={form.identifier} onChange={e => set('identifier', e.target.value)} />}
            {mode === 'register' && <>
              <Input label="Username" name="username" icon={<UserRound />} placeholder="raka_sore" autoComplete="username" required value={form.username} onChange={e => set('username', e.target.value.toLowerCase())} onBlur={() => blur('username')} error={touched.username ? errors.username : undefined} hint={form.username && !errors.username ? 'Username tersedia' : '4–20 karakter, tanpa spasi'} />
              <Input label="Email" name="email" icon={<Mail />} placeholder="kamu@email.com" type="email" autoComplete="email" required value={form.email} onChange={e => set('email', e.target.value)} onBlur={() => blur('email')} error={touched.email ? errors.email : undefined} />
            </>}
            {mode === 'forgot' && <Input label="Email terdaftar" name="email" icon={<Mail />} placeholder="kamu@email.com" type="email" required value={form.email} onChange={e => set('email', e.target.value)} onBlur={() => blur('email')} error={touched.email ? errors.email : undefined} />}
            {(mode === 'login' || mode === 'register' || mode === 'reset') && <div className="password-wrap"><Input label={mode === 'reset' ? 'Password baru' : 'Password'} name="password" icon={<KeyRound />} placeholder="Minimal 8 karakter" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required value={form.password} onChange={e => set('password', e.target.value)} onBlur={() => blur('password')} error={touched.password ? errors.password : undefined} /><button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showPassword ? <EyeOff /> : <Eye />}</button></div>}
            {(mode === 'register' || mode === 'reset') && <Input label="Konfirmasi password" name="confirm" icon={<LockKeyhole />} placeholder="Ulangi password" type="password" autoComplete="new-password" required value={form.confirm} onChange={e => set('confirm', e.target.value)} onBlur={() => blur('confirm')} error={touched.confirm ? errors.confirm : undefined} />}
            {mode === 'login' && <div className="form-row"><label className="check"><input type="checkbox" checked={form.remember} onChange={e => set('remember', e.target.checked)} /><span><Check /></span> Ingat saya</label><Link to="/forgot-password">Lupa password?</Link></div>}
            <Button type="submit" className="auth-submit" loading={loading}>{mode === 'login' ? 'Masuk' : mode === 'register' ? 'Buat akun' : mode === 'forgot' ? 'Kirim tautan reset' : 'Simpan password'} <ArrowRight /></Button>
          </form>
          {(mode === 'login' || mode === 'register') && <p className="auth-switch">{mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'} <Link to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Daftar sekarang' : 'Masuk di sini'}</Link></p>}
          <p className="auth-legal">Dengan melanjutkan, kamu menyetujui <a href="#terms">Syarat</a> dan <a href="#privacy">Kebijakan Privasi</a> Langgor.</p>
        </> : <div className="auth-success"><span><Check /></span><h1>{mode === 'forgot' ? 'Cek inbox kamu' : 'Password diperbarui'}</h1><p>{mode === 'forgot' ? `Jika ${form.email} terdaftar, tautan reset akan tiba dalam beberapa menit.` : 'Kamu sekarang bisa masuk dengan password yang baru.'}</p><Link className="btn btn--primary" to="/login">Kembali ke login <ArrowRight /></Link></div>}
      </div>
    </main>
  </div>
}
