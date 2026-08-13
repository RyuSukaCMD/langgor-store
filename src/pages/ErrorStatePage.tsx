import { RefreshCcw, WifiOff } from 'lucide-react'

export function ErrorStatePage() { return <div className="content-page"><div className="empty-state error-state"><span className="empty-state__icon"><WifiOff /></span><span className="eyebrow">KONEKSI TERPUTUS</span><h2>Data belum bisa dimuat.</h2><p>Koneksi ke Langgor sedang terganggu. Tidak ada perubahan yang disimpan.</p><button className="btn btn--primary" onClick={() => location.reload()}><RefreshCcw /> Coba lagi</button></div></div> }
