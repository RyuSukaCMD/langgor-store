import type { ReactNode } from 'react'
import { Badge } from './UI'

const labels: Record<string, string> = {
  ready: 'Tersedia', limited: 'Stok terbatas', sold: 'Terjual', completed: 'Selesai', processing: 'Diproses', pending: 'Menunggu', failed: 'Gagal', cancelled: 'Dibatalkan', refunded: 'Dikembalikan'
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status === 'ready' || status === 'completed' ? 'success' : status === 'limited' || status === 'processing' || status === 'pending' ? 'warning' : status === 'refunded' ? 'info' : 'error'
  return <Badge tone={tone}>{labels[status] || status}</Badge>
}

export function SectionHead({ eyebrow, title, text, action }: { eyebrow?: string; title: string; text?: string; action?: ReactNode }) {
  return <div className="section-head"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{text && <p>{text}</p>}</div>{action}</div>
}
