import { Link } from 'react-router-dom'

export function Logo({ compact = false }: { compact?: boolean }) {
  return <Link to="/" className="logo" aria-label="Langgor Store beranda">
    <span className="logo__mark" aria-hidden="true"><span className="logo__bite" /></span>
    {!compact && <span>Langgor<span className="logo__muted">Store</span></span>}
  </Link>
}
