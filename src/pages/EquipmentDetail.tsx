import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getOrCreateQrToken, qrDataUrl } from '../lib/qr'
import type { Equipment, Intervention, InterventionPhoto } from '../types/database'
import { EquipmentStatusBadge, InterventionStatusBadge } from '../components/StatusBadge'
import EquipmentFormModal from '../components/EquipmentFormModal'
import InterventionFormModal from '../components/InterventionFormModal'
import WarrantyBadge from '../components/WarrantyBadge'

type InterventionWithPhotos = Intervention & { photos: InterventionPhoto[] }

export default function EquipmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [clientName, setClientName] = useState<string | null>(null)
  const [interventions, setInterventions] = useState<InterventionWithPhotos[]>([])
  const [clienteQr, setClienteQr] = useState<string | null>(null)
  const [tecnicoQr, setTecnicoQr] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [showIntervention, setShowIntervention] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const { data: eq } = await supabase.from('equipment').select('*').eq('id', id).single()
    setEquipment(eq)

    if (eq?.client_id) {
      const { data: client } = await supabase.from('clients').select('name').eq('id', eq.client_id).single()
      setClientName(client?.name ?? null)
    } else {
      setClientName(null)
    }

    const { data: rows } = await supabase
      .from('interventions')
      .select('*')
      .eq('equipment_id', id)
      .order('created_at', { ascending: false })

    const ids = (rows ?? []).map((r) => r.id)
    const { data: photoRows } = ids.length
      ? await supabase.from('intervention_photos').select('*').in('intervention_id', ids)
      : { data: [] as InterventionPhoto[] }

    setInterventions(
      (rows ?? []).map((r) => ({
        ...r,
        photos: (photoRows ?? []).filter((p) => p.intervention_id === r.id),
      }))
    )

    const clienteToken = await getOrCreateQrToken(id, 'cliente')
    setClienteQr(await qrDataUrl(`${window.location.origin}/q/${clienteToken}`))
    setTecnicoQr(await qrDataUrl(`${window.location.origin}/equipo/${id}`))

    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function onDelete() {
    if (!equipment) return
    if (!confirm(`¿Eliminar ${equipment.internal_code}? Esta acción no se puede deshacer.`)) return
    await supabase.from('equipment').delete().eq('id', equipment.id)
    navigate('/')
  }

  const correctiveCount = interventions.filter((i) => i.type === 'correctivo' || i.type === 'reparacion').length

  if (loading) return <p className="text-sm text-slate-500">Cargando...</p>
  if (!equipment) return <p className="text-sm text-slate-500">Equipo no encontrado.</p>

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/')} className="text-sm text-slate-400 hover:text-white">
        ← Volver
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap gap-4 justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold">{equipment.internal_code}</h1>
            <EquipmentStatusBadge status={equipment.status} />
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {[equipment.brand, equipment.model].filter(Boolean).join(' ') || 'Sin marca/modelo'}
          </p>
          <div className="text-sm text-slate-500 mt-2 space-y-0.5">
            {equipment.serial_number && <p>Número de serie: {equipment.serial_number}</p>}
            {equipment.location && <p>📍 {equipment.location}</p>}
            {clientName && <p>👤 {clientName}</p>}
          </div>
        </div>
        <div className="flex gap-2 h-fit">
          <button onClick={() => setShowEdit(true)} className="px-3 py-1.5 text-sm rounded-md border border-slate-700 hover:bg-slate-800">
            Editar
          </button>
          <button onClick={onDelete} className="px-3 py-1.5 text-sm rounded-md border border-red-900 text-red-400 hover:bg-red-950/40">
            Eliminar
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <WarrantyBadge installDate={equipment.install_date} />
      </div>

      <details className="bg-slate-900 border border-slate-800 rounded-xl p-5 group">
        <summary className="cursor-pointer font-medium text-sm">Identificación digital (códigos QR)</summary>
        <p className="text-xs text-slate-500 mt-2 mb-3">
          El QR de cliente muestra el historial sin login. El QR de técnico abre la ficha completa y requiere sesión iniciada.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-xs text-emerald-400 mb-2">CLIENTE</p>
            {clienteQr && <img src={clienteQr} alt="QR cliente" className="mx-auto rounded bg-white p-2" />}
          </div>
          <div className="text-center">
            <p className="text-xs text-blue-400 mb-2">TÉCNICO</p>
            {tecnicoQr && <img src={tecnicoQr} alt="QR técnico" className="mx-auto rounded bg-white p-2" />}
          </div>
        </div>
      </details>

      {correctiveCount < 2 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-sm text-slate-500">
          Análisis IA: se necesitan al menos 2 intervenciones correctivas para generar un análisis de patrones.
        </div>
      ) : (
        <AiEquipmentInsight equipmentId={equipment.id} />
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Historial de intervenciones</h2>
          <button onClick={() => setShowIntervention(true)} className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 hover:bg-emerald-500">
            + Nueva intervención
          </button>
        </div>
        {interventions.length === 0 ? (
          <p className="text-sm text-slate-500">Sin intervenciones registradas.</p>
        ) : (
          <div className="space-y-3">
            {interventions.map((iv) => (
              <div key={iv.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full border border-slate-700 capitalize">{iv.type}</span>
                  <span>{iv.service_mode === 'remoto' ? '💻 Remoto' : '🔧 Presencial'}</span>
                  <span className="text-slate-500">{new Date(iv.created_at).toLocaleDateString('es-CL')}</span>
                  {iv.technician_name && <span className="text-slate-500">• {iv.technician_name}</span>}
                  <InterventionStatusBadge status={iv.status} />
                </div>
                <p className="text-sm mt-2">{iv.description}</p>
                {iv.solution && (
                  <p className="text-sm mt-1 text-emerald-400/90">
                    <span className="font-medium">Solución:</span> {iv.solution}
                  </p>
                )}
                {(iv.hours > 0 || iv.parts_cost > 0 || iv.labor_cost > 0) && (
                  <p className="text-xs text-slate-500 mt-2">
                    {iv.hours > 0 && `${iv.hours} h`} {iv.parts_cost > 0 && `· repuestos $${iv.parts_cost}`}{' '}
                    {iv.labor_cost > 0 && `· mano de obra $${iv.labor_cost}`}
                  </p>
                )}
                {iv.photos.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {iv.photos.map((p) => (
                      <img key={p.id} src={p.url} alt="" className="w-20 h-20 object-cover rounded-md border border-slate-800" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showEdit && (
        <EquipmentFormModal
          equipment={equipment}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false)
            load()
          }}
        />
      )}
      {showIntervention && (
        <InterventionFormModal
          equipmentId={equipment.id}
          onClose={() => setShowIntervention(false)}
          onSaved={() => {
            setShowIntervention(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function AiEquipmentInsight({ equipmentId }: { equipmentId: string }) {
  const [insight, setInsight] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      const res = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ equipmentId }),
      })
      if (!res.ok) throw new Error('No se pudo generar el análisis')
      const data = await res.json()
      setInsight(data.insight)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-sm">Análisis IA de patrones de falla</h2>
        <button onClick={generate} disabled={loading} className="px-3 py-1.5 text-xs rounded-md border border-slate-700 hover:bg-slate-800 disabled:opacity-50">
          {loading ? 'Analizando...' : insight ? 'Regenerar' : 'Generar análisis'}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      {insight && (
        <div className="mt-3 text-sm bg-purple-950/30 border border-purple-900/50 rounded-md p-3">
          <p className="text-xs text-purple-400 mb-1">⚠ Generado por IA — asistencia, no un diagnóstico verificado. Revisar antes de actuar.</p>
          <p className="whitespace-pre-wrap">{insight}</p>
        </div>
      )}
    </div>
  )
}
