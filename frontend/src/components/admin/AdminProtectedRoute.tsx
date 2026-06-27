import { Navigate, Outlet } from 'react-router-dom'
import { useAdminAuthStore } from '../../stores/adminAuthStore'

const AdminProtectedRoute = () => {
  const token = useAdminAuthStore((state) => state.token)

  if (!token) {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}

export default AdminProtectedRoute
