import { ArrowLeft, SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFoundPage() { return <main className="not-found"><span><SearchX /></span><small>404 / NYASAR DI LANGGOR</small><h1>Halaman ini tidak ada di rak.</h1><p>Mungkin alamatnya berubah atau produknya sudah dipindahkan.</p><Link className="btn btn--primary" to="/"><ArrowLeft /> Kembali ke beranda</Link></main> }
