import { ArrowUpRight, BadgeCheck, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { rupiah } from '../data'
import type { Product } from '../types'
import { StatusBadge } from './StatusBadge'

export function ProductCard({ product, layout = 'grid' }: { product: Product; layout?: 'grid' | 'row' }) {
  return <article className={`product-card product-card--${layout}`}>
    <div className={`product-art product-art--${product.accent} ${product.imageUrl?'has-image':''}`}>
      {product.imageUrl&&<img src={product.imageUrl} alt={`Foto ${product.name}`} loading="lazy"/>}<span>{product.icon}</span><small>COOKIE DROP</small>
    </div>
    <div className="product-card__content">
      <div className="product-card__top"><span className="product-category">{product.category}</span><StatusBadge status={product.status} /></div>
      <h3><Link to={`/product/${product.id}`}>{product.name}</Link></h3>
      <p>{product.description}</p>
      <div className="seller-line"><span>{product.seller.name}</span>{product.seller.verified && <BadgeCheck aria-label="Seller terverifikasi" />}<span className="dot-separator">•</span><Star className="star" /> {product.rating}</div>
      <div className="product-card__bottom"><div><small>Mulai</small><strong>{rupiah(product.price)}</strong></div><Link className="round-arrow" to={`/product/${product.id}`} aria-label={`Lihat ${product.name}`}><ArrowUpRight /></Link></div>
    </div>
  </article>
}
