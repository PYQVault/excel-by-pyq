import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import Loader from '@/components/common/Loader'

// Wraps any route that requires authentication
// If not logged in → redirect to /login
const ProtectedRoute = () => {
  const { user, loading } = useAuth()

  if (loading) return <Loader text="Verifying session..." />
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}

export default ProtectedRoute