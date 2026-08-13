import { LoaderCircle, X } from 'lucide-react'
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'

export function Button({ children, variant = 'primary', loading, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; loading?: boolean }) {
  return <button className={`btn btn--${variant} ${className}`} disabled={props.disabled || loading} {...props}>
    {loading && <LoaderCircle className="spin" aria-hidden="true" />}<span>{loading ? 'Memproses…' : children}</span>
  </button>
}

export function Input({ label, error, hint, icon, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string; icon?: ReactNode }) {
  const id = props.id || props.name
  return <label className={`field ${error ? 'field--error' : ''}`} htmlFor={id}>
    <span className="field__label">{label}</span>
    <span className="field__control">{icon}{<input id={id} {...props} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />}</span>
    {error ? <span id={`${id}-error`} className="field__error">{error}</span> : hint && <span className="field__hint">{hint}</span>}
  </label>
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'gradient' }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export function Modal({ open, onClose, title, eyebrow, children, footer }: { open: boolean; onClose: () => void; title: string; eyebrow?: string; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.body.classList.add('modal-open')
    window.addEventListener('keydown', onKey)
    return () => { document.body.classList.remove('modal-open'); window.removeEventListener('keydown', onKey) }
  }, [open, onClose])
  if (!open) return null
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal__head"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2 id="modal-title">{title}</h2></div><button className="icon-btn" onClick={onClose} aria-label="Tutup dialog"><X /></button></div>
      <div className="modal__body">{children}</div>
      {footer && <div className="modal__footer">{footer}</div>}
    </section>
  </div>
}

export function Skeleton({ className = '' }: { className?: string }) { return <span className={`skeleton ${className}`} aria-hidden="true" /> }

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-state__icon">{icon}</span><h3>{title}</h3><p>{text}</p>{action}</div>
}
