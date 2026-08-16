import { lazy, Suspense } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { AdminRoute, ProtectedRoute } from './components/RouteGuards'
import { MaintenanceGate } from './components/MaintenanceGate'
import { ProductProvider } from './context/ProductContext'

const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })))
const AuthPage = lazy(() => import('./pages/AuthPages').then(m => ({ default: m.AuthPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePages').then(m => ({ default: m.ProfilePage })))
const PublicProfilePage = lazy(() => import('./pages/ProfilePages').then(m => ({ default: m.PublicProfilePage })))
const PurchasesPage = lazy(() => import('./pages/PurchasesPage').then(m => ({ default: m.PurchasesPage })))
const StorePage = lazy(() => import('./pages/StorePage').then(m => ({ default: m.StorePage })))
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })))
const LegalPage = lazy(() => import('./pages/LegalPage').then(m => ({ default: m.LegalPage })))

function RouteFallback() {
  return <div className="route-loader"><LoaderCircle className="spin" /><span>Menyiapkan Langgor…</span></div>
}

export default function App() {
  const staffAuth={
    '/login':<Suspense fallback={<RouteFallback/>}><AuthPage mode="login"/></Suspense>,
    '/forgot-password':<Suspense fallback={<RouteFallback/>}><AuthPage mode="forgot"/></Suspense>,
    '/reset-password':<Suspense fallback={<RouteFallback/>}><AuthPage mode="reset"/></Suspense>,
    '/verify-email':<Suspense fallback={<RouteFallback/>}><AuthPage mode="verify"/></Suspense>,
  }
  return <MaintenanceGate staffAuth={staffAuth}><ProductProvider><Suspense fallback={<RouteFallback />}><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route path="/verify-email" element={<AuthPage mode="verify" />} />
    <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
    <Route path="/reset-password" element={<AuthPage mode="reset" />} />
    <Route path="/store/cookies" element={<StorePage kind="cookie" />} />
    <Route path="/store/accounts" element={<Navigate to="/store/cookies" replace />} />
    <Route path="/product/:id" element={<ProductDetailPage />} />
    <Route path="/u/:username" element={<PublicProfilePage />} />
    <Route path="/terms" element={<LegalPage kind="terms" />} />
    <Route path="/privacy" element={<LegalPage kind="privacy" />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/purchases" element={<PurchasesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/seller" element={<Navigate to="/dashboard" replace />} />
        <Route path="/seller/new" element={<Navigate to="/dashboard" replace />} />
        <Route element={<AdminRoute />}><Route path="/admin" element={<AdminPage />} /></Route>
      </Route>
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes></Suspense></ProductProvider></MaintenanceGate>
}
