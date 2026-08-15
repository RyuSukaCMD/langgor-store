import { Check, Clock3, PackageCheck, ReceiptText } from 'lucide-react'
import { rupiah } from '../data'
import type { Order } from '../types'
import { StatusBadge } from './StatusBadge'
import { Button, Modal } from './UI'

export function OrderDetailModal({order,onClose}:{order:Order|null;onClose:()=>void}){
  if(!order)return null
  return <Modal open onClose={onClose} eyebrow="ORDER / DETAIL" title={order.id} footer={<Button onClick={onClose}>Tutup</Button>}>
    <div className="order-detail-modal"><span className="order-detail-modal__icon">{order.productIcon}</span><div><small>PRODUK</small><strong>{order.productName}</strong><span>{order.date}</span></div><StatusBadge status={order.status}/></div>
    <div className="order-detail-values"><span><small>TOTAL</small><strong>{rupiah(order.price)}</strong></span><span><small>PRODUCT ID</small><strong>{order.productId}</strong></span><span><small>DIBUAT</small><strong>{new Date(order.createdAt).toLocaleString('id-ID')}</strong></span></div>
    <div className="order-detail-flow"><span className="done"><Check/><b>Order tersimpan</b></span><i/><span className={order.status!=='pending'?'done':'active'}><Clock3/><b>Diproses</b></span><i/><span className={order.status==='completed'?'done':''}><PackageCheck/><b>Selesai</b></span></div>
    <p className="order-detail-note"><ReceiptText/> Status pesanan diperbarui otomatis setelah setiap tahap selesai.</p>
  </Modal>
}
