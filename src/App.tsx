import { lazy, Suspense } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { AdminRoute, ProtectedRoute } from './components/RouteGuards'

const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })))
const AuthPage = lazy(() => import('./pages/AuthPages').then(m => ({ default: m.AuthPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePages').then(m => ({ default: m.ProfilePage })))
const PublicProfilePage = lazy(() => import('./pages/ProfilePages').then(m => ({ default: m.PublicProfilePage })))
const PurchasesPage = lazy(() => import('./pages/PurchasesPage').then(m => ({ default: m.PurchasesPage })))
const SellerPage = lazy(() => import('./pages/SellerPages').then(m => ({ default: m.SellerPage })))
const NewListingPage = lazy(() => import('./pages/SellerPages').then(m => ({ default: m.NewListingPage })))
const StorePage = lazy(() => import('./pages/StorePage').then(m => ({ default: m.StorePage })))
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })))

function RouteFallback() {
  return <div className="route-loader"><LoaderCircle className="spin" /><span>Menyiapkan Langgor…</span></div>
}

export default function App() {
  return <Suspense fallback={<RouteFallback />}><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
    <Route path="/reset-password" element={<AuthPage mode="reset" />} />
    <Route path="/store/cookies" element={<StorePage kind="cookie" />} />
    <Route path="/store/accounts" element={<StorePage kind="account" />} />
    <Route path="/product/:id" element={<ProductDetailPage />} />
    <Route path="/u/:username" element={<PublicProfilePage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/purchases" element={<PurchasesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/seller" element={<SellerPage />} />
        <Route path="/seller/new" element={<NewListingPage />} />
        <Route element={<AdminRoute />}><Route path="/admin" element={<AdminPage />} /></Route>
      </Route>
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes></Suspense>
}
