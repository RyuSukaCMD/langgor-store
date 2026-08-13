import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type Toast = { id: number; title: string; message?: string; tone: 'success' | 'error' | 'info' }
type ToastInput = Omit<Toast, 'id'>
const ToastContext = createContext<{ showToast: (toast: ToastInput) => void } | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = useCallback((id: number) => setToasts(t => t.filter(item => item.id !== id)), [])
  const showToast = useCallback((toast: ToastInput) => {
    const id = Date.now()
    setToasts(t => [...t.slice(-2), { ...toast, id }])
    window.setTimeout(() => dismiss(id), 4500)
  }, [dismiss])

  return <ToastContext.Provider value={{ showToast }}>
    {children}
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map(t => <div className={`toast toast--${t.tone}`} key={t.id}>
        <span className="toast__icon">{t.tone === 'success' ? <CheckCircle2 /> : t.tone === 'error' ? <CircleAlert /> : <Info />}</span>
        <div><strong>{t.title}</strong>{t.message && <p>{t.message}</p>}</div>
        <button className="icon-btn icon-btn--sm" onClick={() => dismiss(t.id)} aria-label="Tutup notifikasi"><X /></button>
      </div>)}
    </div>
  </ToastContext.Provider>
}

export function useToast() {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used inside ToastProvider')
  return value
}
