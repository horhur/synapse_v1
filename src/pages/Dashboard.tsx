import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase } from '../lib/supabase'
import type { Equipment, Intervention } from '../types/database'

export default function Dashboard() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: eq }, { data: iv }] = await Promise.all([
        supabase.from('equipment').select('*'),
        supabase.from('interventions').select('*'),
      ])
      setEquipment(eq ?? [])
      setInterventions(iv ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const stats = useMemo(() => {
    const total = equipment.length
    const operativo = equipment.filter((e) => e.status === 'operativo').length
    const fueraServicio = equipment.filter((e) => e.status === 'fuera_servicio').length
    const enGarantia = equipment.filter((e) => {
      if (!e.install_date) return false
      const expires = new Date(e.install_date)
      expires.setFullYear(expires.getFullYear() + 1)
      return expires.getTime() > Date.now()
    }).length
    const costoTotal = interventions.reduce((sum, i) => sum + (i.parts_cost ?? 0) + (i.labor_cost ?? 0), 0)

    const now = new Date()
    const thisMonth = interventions.filter((i) => {
      const d = new Date(i.created_at)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length

    return { total, operativo, fueraServicio, enGarantia, costoTotal, thisMonth }
  }, [equipment, interventions])

  const topFailures = useMemo(() => {
    const counts = new Map<string, number>()
    for (const iv of interventions) {
      if (iv.type === 'correctivo' || iv.type === 'reparacion') {
        counts.set(iv.equipment_id, (counts.get(iv.equipment_id) ?? 0) + 1)
      }
    }
    return [...counts.entries()]
      .map(([equipment_id, fallas]) => {
        const eq = equipment.find((e) => e.id === equipment_id)
        return { code: eq?.internal_code ?? '—', fallas }
      })
      .sort((a, b) => b.fallas - a.fallas)
      .slice(0, 10)
  }, [interventions, equipment])

  const brandAlerts = useMemo(() => {
    const byBrand = new Map<string, { total: number; fallas: number }>()
    for (const eq of equipment) {
      const brand = eq.brand?.trim() || 'Sin marca'
      if (!byBrand.has(brand)) byBrand.set(brand, { total: 0, fallas: 0 })
      byBrand.get(brand)!.total += 1
    }
    for (const iv of interventions) {
      if (iv.type !== 'correctivo' && iv.type !== 'reparacion') continue
      const eq = equipment.find((e) => e.id === iv.equipment_id)
      const brand = eq?.brand?.trim() || 'Sin marca'
      if (byBrand.has(brand)) byBrand.get(brand)!.fallas += 1
    }
    return [...byBrand.entries()]
      .map(([brand, v]) => ({ brand, rate: v.total ? Math.round((v.fallas / v.total) * 100) : 0, total: v.total }))
      .filter((b) => b.rate >= 50 && b.total >= 2)
      .sort((a, b) => b.rate - a.rate)
  }, [equipment, interventions])

  if (loading) return <p className="text-sm text-slate-500">Cargando...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi label="Total equipos" value={stats.total} />
        <Kpi label="Operativos" value={stats.operativo} tone="emerald" />
        <Kpi label="Fuera de servicio" value={stats.fueraServicio} tone="red" />
        <Kpi label="En garantía" value={stats.enGarantia} tone="blue" />
        <Kpi label="Intervenciones (mes)" value={stats.thisMonth} />
        <Kpi label="Costo total" value={`$${stats.costoTotal.toLocaleString('es-CL')}`} small />
      </div>

      {brandAlerts.length > 0 && (
        <div className="space-y-2">
          {brandAlerts.map((b) => (
            <div key={b.brand} className="text-sm bg-amber-950/30 border border-amber-900/50 rounded-md px-3 py-2 text-amber-400">
              ⚠ {b.brand} tiene una tasa de fallas del {b.rate}% ({b.total} equipos)
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="font-medium text-sm mb-4">Top equipos con más fallas</h2>
        {topFailures.length === 0 ? (
          <p className="text-sm text-slate-500">Sin fallas correctivas registradas.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topFailures} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="code" stroke="#64748b" fontSize={12} width={100} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', fontSize: 12 }} />
              <Bar dataKey="fallas" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

function Kpi({ label, value, tone, small }: { label: string; value: number | string; tone?: 'emerald' | 'red' | 'blue'; small?: boolean }) {
  const tones: Record<string, string> = {
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
  }
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`font-semibold ${small ? 'text-lg' : 'text-2xl'} ${tone ? tones[tone] : ''}`}>{value}</p>
    </div>
  )
}
