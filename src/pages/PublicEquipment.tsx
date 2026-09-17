import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

interface PublicIntervention {
  type: string
  service_mode: string
  description: string
  solution: string | null
  created_at: string
}

interface PublicData {
  internal_code: string
  brand: string | null
  model: string | null
  status: string
  location: string | null
  interventions: PublicIntervention[]
}

export default function PublicEquipment() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<PublicData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/public-equipment?token=${token}`)
        if (!res.ok) throw new Error('Código QR inválido o equipo no encontrado')
        setData(await res.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error')
      }
    }
    load()
  }, [token])

  if (error) return <div className="min-h-screen flex items-center justify-center text-sm text-red-400">{error}</div>
  if (!data) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Cargando...</div>

  return (
    <div className="min-h-screen max-w-lg mx-auto px-4 py-8 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{data.internal_code}</h1>
        <p className="text-sm text-slate-400">{[data.brand, data.model].filter(Boolean).join(' ')}</p>
        {data.location && <p className="text-xs text-slate-500 mt-1">📍 {data.location}</p>}
        <p className="text-xs text-slate-500 mt-1">Estado: {data.status}</p>
      </div>
      <div>
        <h2 className="font-medium text-sm mb-2">Historial de servicio</h2>
        {data.interventions.length === 0 ? (
          <p className="text-sm text-slate-500">Sin intervenciones registradas.</p>
        ) : (
          <div className="space-y-2">
            {data.interventions.map((iv, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm">
                <p className="text-xs text-slate-500">{new Date(iv.created_at).toLocaleDateString('es-CL')} · {iv.type}</p>
                <p className="mt-1">{iv.description}</p>
                {iv.solution && <p className="mt-1 text-emerald-400/90">Solución: {iv.solution}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-slate-600 pt-4">PCSmartech — soporte técnico</p>
    </div>
  )
}
