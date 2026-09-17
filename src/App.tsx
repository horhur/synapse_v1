import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import EquipmentPage from './pages/Equipment'
import EquipmentDetail from './pages/EquipmentDetail'
import Dashboard from './pages/Dashboard'
import PublicEquipment from './pages/PublicEquipment'

function ProtectedRoutes() {
  const { session, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Cargando...</div>
  if (!session) return <Navigate to="/login" replace />
  return <Layout />
}

function LoginRoute() {
  const { session, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Cargando...</div>
  if (session) return <Navigate to="/" replace />
  return <Login />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/q/:token" element={<PublicEquipment />} />
        <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<EquipmentPage />} />
          <Route path="/equipo/:id" element={<EquipmentDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
