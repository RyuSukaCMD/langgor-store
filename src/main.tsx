import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ProductProvider } from './context/ProductContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles.css'
import './responsive.css'
import './game-redesign.css'
import './cookie-shop.css'
import './game-dashboard.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user" transition={{ duration: .4, ease: [0.22, 1, 0.36, 1] }}>
        <ToastProvider><ErrorBoundary><AuthProvider><ProductProvider><App /></ProductProvider></AuthProvider></ErrorBoundary></ToastProvider>
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>,
)
