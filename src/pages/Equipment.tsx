import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Equipment, EquipmentStatus } from '../types/database'
import { EquipmentStatusBadge } from '../components/StatusBadge'
import EquipmentFormModal from '../components/EquipmentFormModal'

interface EquipmentWithClient extends Equipment {
  client_name: string | null
  recent_failures: number
}

export default function EquipmentPage() {
  const [items, setItems] = useState<EquipmentWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'todos'>('todos')
  const [onlyProblematic, setOnlyProblematic] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    setLoading(true)
    const { data: equipmentRows } = await supabase
      .from('equipment')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: clientRows } = await supabase.from('clients').select('id, name')
    const clientMap = new Map((clientRows ?? []).map((c) => [c.id, c.name]))

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const { data: interventionRows } = await supabase
      .from('interventions')
      .select('equipment_id, type, created_at')
      .in('type', ['correctivo', 'reparacion'])
      .gte('created_at', sixMonthsAgo.toISOString())

    const failureCount = new Map<string, number>()
    for (const row of interventionRows ?? []) {
      failureCount.set(row.equipment_id, (failureCount.get(row.equipment_id) ?? 0) + 1)
    }

    setItems(
      (equipmentRows ?? []).map((eq) => ({
        ...eq,
        client_name: eq.client_id ? clientMap.get(eq.client_id) ?? null : null,
        recent_failures: failureCount.get(eq.id) ?? 0,
      }))
    )
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((eq) => {
      if (statusFilter !== 'todos' && eq.status !== statusFilter) return false
      if (onlyProblematic && eq.recent_failures < 3) return false
      if (!q) return true
      return (
        eq.internal_code.toLowerCase().includes(q) ||
        (eq.client_name ?? '').toLowerCase().includes(q) ||
        (eq.brand ?? '').toLowerCase().includes(q) ||
        (eq.model ?? '').toLowerCase().includes(q)
      )
    })
  }, [items, search, statusFilter, onlyProblematic])

  const counts = useMemo(() => {
    const total = items.length
    const operativo = items.filter((i) => i.status === 'operativo').length
    const fueraServicio = items.filter((i) => i.status === 'fuera_servicio').length
    return { total, operativo, fueraServicio }
  }, [items])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Inventario de Equipos</h1>
          <p className="text-sm text-slate-400">{counts.total} equipos registrados</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-3 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-500"
        >
          + Nuevo
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Operativos" value={counts.operativo} tone="emerald" />
        <StatCard label="Fuera de servicio" value={counts.fueraServicio} tone="red" />
        <StatCard label="Total" value={counts.total} tone="slate" />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          placeholder="Buscar equipo, cliente, marca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-md bg-slate-900 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as EquipmentStatus | 'todos')}
          className="rounded-md bg-slate-900 border border-slate-800 px-3 py-2 text-sm"
        >
          <option value="todos">Todos</option>
          <option value="operativo">Operativo</option>
          <option value="mantencion">En mantención</option>
          <option value="fuera_servicio">Fuera de servicio</option>
          <option value="retirado">Retirado</option>
        </select>
        <button
          onClick={() => setOnlyProblematic((v) => !v)}
          className={`px-3 py-2 text-sm rounded-md border transition ${
            onlyProblematic
              ? 'bg-amber-950 border-amber-800 text-amber-400'
              : 'border-slate-800 text-slate-400 hover:text-white'
          }`}
          title="3+ fallas correctivas en los últimos 6 meses"
        >
          ⚠ Problemáticos
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500">No hay equipos que coincidan.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((eq) => (
            <Link
              key={eq.id}
              to={`/equipo/${eq.id}`}
              className="block bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{eq.internal_code}</span>
                <EquipmentStatusBadge status={eq.status} />
              </div>
              <p className="text-sm text-slate-400 mt-1">
                {[eq.brand, eq.model].filter(Boolean).join(' ') || 'Sin marca/modelo'}
              </p>
              {eq.client_name && <p className="text-xs text-slate-500 mt-1">👤 {eq.client_name}</p>}
              {eq.location && <p className="text-xs text-slate-500">📍 {eq.location}</p>}
              {eq.recent_failures >= 3 && (
                <p className="text-xs text-amber-500 mt-2">⚠ {eq.recent_failures} fallas en 6 meses</p>
              )}
            </Link>
          ))}
        </div>
      )}

      {showForm && (
        <EquipmentFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'emerald' | 'red' | 'slate' }) {
  const tones = {
    emerald: 'border-emerald-900 bg-emerald-950/40 text-emerald-400',
    red: 'border-red-900 bg-red-950/40 text-red-400',
    slate: 'border-slate-800 bg-slate-900 text-slate-300',
  }
  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  )
}
