import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Layout() {
  const { signOut } = useAuth()

  const link = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition ${
      isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
    }`

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 sticky top-0 bg-slate-950/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-semibold">MiniCMMS</span>
            <nav className="flex gap-1">
              <NavLink to="/" end className={link}>Inventario</NavLink>
              <NavLink to="/dashboard" className={link}>Dashboard</NavLink>
            </nav>
          </div>
          <button
            onClick={() => signOut()}
            className="text-sm text-slate-400 hover:text-white transition"
          >
            Salir
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
