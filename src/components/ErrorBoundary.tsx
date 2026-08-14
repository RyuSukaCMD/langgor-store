import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw, ShieldAlert } from 'lucide-react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ui-boundary]', error.message, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return <main className="fatal-screen" role="alert">
      <span className="fatal-screen__icon"><ShieldAlert /></span>
      <small>LANGGOR / RECOVERY MODE</small>
      <h1>Halaman gagal dimuat.</h1>
      <p>Data kamu tidak berubah. Muat ulang untuk mengambil bundle dan konfigurasi terbaru.</p>
      <button className="btn btn--primary" onClick={() => window.location.reload()}><RefreshCw /> Muat ulang</button>
      <a href="/">Kembali ke beranda</a>
    </main>
  }
}
