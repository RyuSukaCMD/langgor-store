import { ArrowLeft, LockKeyhole, Scale } from 'lucide-react'
import { Link } from 'react-router-dom'

const content={
  terms:{eyebrow:'LEGAL / TERMS',title:'Syarat penggunaan',icon:<Scale/>,sections:[['Penggunaan layanan','Langgor menyediakan katalog dan proses transaksi Cookie login. Kamu wajib memberikan data akun yang benar, menjaga keamanan akses, dan tidak menggunakan layanan untuk kegiatan yang melanggar hukum.'],['Transaksi dan validasi','Status transaksi hanya ditetapkan setelah validasi pada server. Harga, stok, dan ketersediaan dapat berubah sebelum pembayaran berhasil dikonfirmasi.'],['Pengembalian dana','Permintaan pengembalian dana ditinjau berdasarkan status transaksi dan hasil validasi. Hubungi bantuan dengan menyertakan ID order tanpa mengirim password, token sesi, atau informasi rahasia lainnya.']]},
  privacy:{eyebrow:'LEGAL / PRIVACY',title:'Kebijakan privasi',icon:<LockKeyhole/>,sections:[['Data yang diproses','Kami memproses email, profil publik, informasi transaksi, dan data teknis yang diperlukan untuk autentikasi, keamanan, serta dukungan pelanggan.'],['Penyimpanan dan keamanan','Data aplikasi disimpan melalui infrastruktur layanan yang terlindungi. Password dikelola oleh sistem autentikasi dan tidak ditampilkan di daftar akun atau panel publik.'],['Pilihan kamu','Kamu dapat memperbarui profil dari halaman akun. Untuk permintaan terkait data atau privasi, hubungi halo@langgor.store dan sertakan informasi yang cukup untuk memverifikasi akunmu.']]}
} as const

export function LegalPage({kind}:{kind:keyof typeof content}){
  const page=content[kind]
  return <main className="legal-page page-enter"><div className="legal-page__shell"><Link to="/" className="legal-back"><ArrowLeft/> Kembali ke beranda</Link><header><span className="eyebrow">{page.eyebrow}</span><i>{page.icon}</i><h1>{page.title}</h1><p>Terakhir diperbarui: 15 Agustus 2026</p></header><div className="legal-copy">{page.sections.map(([title,text],index)=><section key={title}><span>{String(index+1).padStart(2,'0')}</span><div><h2>{title}</h2><p>{text}</p></div></section>)}</div><p className="legal-contact">Pertanyaan? <a href="mailto:halo@langgor.store">halo@langgor.store</a></p></div></main>
}
