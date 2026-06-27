import { Route, Routes } from 'react-router-dom'
import AdminProtectedRoute from './components/admin/AdminProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import MainLayout from './layouts/MainLayout'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import HomePage from './pages/HomePage'
import MembershipPage from './pages/MembershipPage'
import MemoPage from './pages/MemoPage'
import PaymentCompletePage from './pages/PaymentCompletePage'

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/membership" element={<MembershipPage />} />
        <Route path="/payment/complete" element={<PaymentCompletePage />} />
        <Route path="/memo/:id" element={<MemoPage />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="login" element={<AdminLoginPage />} />
        <Route element={<AdminProtectedRoute />}>
          <Route index element={<AdminDashboardPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
