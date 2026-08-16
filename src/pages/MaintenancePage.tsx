import { Clock3, LogIn, RefreshCw, ShieldCheck, Wrench } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Button } from '../components/UI'
import { useMaintenance } from '../context/MaintenanceContext'

export function MaintenancePage(){
  const {maintenance,refreshMaintenance}=useMaintenance()
  const [checking,setChecking]=useState(false)
  const [message,setMessage]=useState('')
  const estimated=maintenance.estimatedEndAt?new Date(maintenance.estimatedEndAt).toLocaleString('id-ID',{weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}):null
  const check=async()=>{setChecking(true);setMessage('');try{const latest=await refreshMaintenance();if(latest.enabled)setMessage('Maintenance masih berlangsung. Terima kasih sudah menunggu.')}catch{setMessage('Status belum dapat diperiksa. Coba beberapa saat lagi.')}finally{setChecking(false)}}
  return <main className="maintenance-page"><div className="maintenance-page__brand"><Logo/></div><section className="maintenance-card" aria-labelledby="maintenance-title"><span className="maintenance-card__icon"><Wrench/></span><span className="maintenance-card__eyebrow"><i/> PEMELIHARAAN TERJADWAL</span><h1 id="maintenance-title">Kami sedang merapikan layanan.</h1><p className="maintenance-card__reason">{maintenance.reason||'Beberapa bagian sedang diperbarui agar pengalamanmu tetap nyaman.'}</p>{estimated&&<div className="maintenance-estimate"><Clock3/><span><small>PERKIRAAN SELESAI</small><strong>{estimated}</strong><em>Waktu dapat berubah sesuai proses pemeliharaan.</em></span></div>}<div className="maintenance-card__actions"><Button loading={checking} onClick={()=>void check()}><RefreshCw/> Periksa lagi</Button><Link className="btn btn--secondary" to="/login"><LogIn/> Masuk sebagai staf</Link></div>{message&&<p className="maintenance-card__message" role="status">{message}</p>}<footer><ShieldCheck/><span><strong>Data akunmu tetap aman.</strong><small>Silakan kembali setelah pemeliharaan selesai.</small></span></footer></section></main>
}
