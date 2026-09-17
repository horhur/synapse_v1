import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const err = await signIn(email, password)
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div>
          <h1 className="text-xl font-semibold">MiniCMMS</h1>
          <p className="text-sm text-slate-400">Acceso técnico</p>
        </div>
        {error && (
          <div className="text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md px-3 py-2">
            {error}
          </div>
        )}
        <div className="space-y-1">
          <label className="text-sm text-slate-400">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-slate-400">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-3 py-2 text-sm font-medium transition"
        >
          {busy ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
