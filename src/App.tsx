import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { AdminRoute, ProtectedRoute } from './components/RouteGuards'
import { AdminPage } from './pages/AdminPage'
import { AuthPage } from './pages/AuthPages'
import { DashboardPage } from './pages/DashboardPage'
import { LandingPage } from './pages/LandingPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { ProfilePage, PublicProfilePage } from './pages/ProfilePages'
import { PurchasesPage } from './pages/PurchasesPage'
import { NewListingPage, SellerPage } from './pages/SellerPages'
import { StorePage } from './pages/StorePage'

export default function App() {
  return <Routes>
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
  </Routes>
}
