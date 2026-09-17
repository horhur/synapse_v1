import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { InterventionStatus, InterventionType, ServiceMode } from '../types/database'
import Modal from './Modal'

const TYPE_OPTIONS: { value: InterventionType; label: string }[] = [
  { value: 'correctivo', label: 'Correctivo' },
  { value: 'preventivo', label: 'Preventivo' },
  { value: 'inspeccion', label: 'Inspección' },
  { value: 'instalacion', label: 'Instalación' },
  { value: 'reparacion', label: 'Reparación' },
]

export default function InterventionFormModal({
  equipmentId,
  onClose,
  onSaved,
}: {
  equipmentId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [type, setType] = useState<InterventionType>('correctivo')
  const [serviceMode, setServiceMode] = useState<ServiceMode>('presencial')
  const [description, setDescription] = useState('')
  const [solution, setSolution] = useState('')
  const [technicianName, setTechnicianName] = useState('')
  const [hours, setHours] = useState('0')
  const [partsCost, setPartsCost] = useState('0')
  const [laborCost, setLaborCost] = useState('0')
  const [status, setStatus] = useState<InterventionStatus>('completado')
  const [photos, setPhotos] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) {
      setError('La descripción del problema es obligatoria')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const { data: intervention, error: insertErr } = await supabase
        .from('interventions')
        .insert({
          equipment_id: equipmentId,
          type,
          service_mode: serviceMode,
          description: description.trim(),
          solution: solution.trim() || null,
          technician_name: technicianName.trim() || null,
          hours: Number(hours) || 0,
          parts_cost: Number(partsCost) || 0,
          labor_cost: Number(laborCost) || 0,
          status,
        })
        .select('id')
        .single()
      if (insertErr) throw insertErr

      for (const file of photos) {
        const path = `${equipmentId}/${intervention.id}/${Date.now()}-${file.name}`
        const { error: uploadErr } = await supabase.storage
          .from('minicmms-photos')
          .upload(path, file, { upsert: true })
        if (uploadErr) throw uploadErr
        const { data: signed } = await supabase.storage
          .from('minicmms-photos')
          .createSignedUrl(path, 60 * 60 * 24 * 365)
        if (signed?.signedUrl) {
          await supabase.from('intervention_photos').insert({
            intervention_id: intervention.id,
            url: signed.signedUrl,
          })
        }
      }

      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Nueva intervención" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3">
        {error && (
          <div className="text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md px-3 py-2">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo *">
            <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as InterventionType)}>
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Tipo de servicio *">
            <select className={inputCls} value={serviceMode} onChange={(e) => setServiceMode(e.target.value as ServiceMode)}>
              <option value="presencial">🔧 Presencial</option>
              <option value="remoto">💻 Remoto</option>
            </select>
          </Field>
        </div>
        <Field label="Técnico">
          <input className={inputCls} value={technicianName} onChange={(e) => setTechnicianName(e.target.value)} />
        </Field>
        <Field label="Descripción del problema *">
          <textarea className={inputCls} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required />
        </Field>
        <Field label="Solución aplicada">
          <textarea className={inputCls} rows={3} value={solution} onChange={(e) => setSolution(e.target.value)} />
        </Field>
        <Field label="Fotos del trabajo">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, 6))}
            className="text-sm"
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Horas">
            <input type="number" step="0.5" className={inputCls} value={hours} onChange={(e) => setHours(e.target.value)} />
          </Field>
          <Field label="Repuestos $">
            <input type="number" className={inputCls} value={partsCost} onChange={(e) => setPartsCost(e.target.value)} />
          </Field>
          <Field label="Mano de obra $">
            <input type="number" className={inputCls} value={laborCost} onChange={(e) => setLaborCost(e.target.value)} />
          </Field>
        </div>
        <Field label="Estado">
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as InterventionStatus)}>
            <option value="completado">Completado</option>
            <option value="en_progreso">En progreso</option>
            <option value="esperando_repuestos">Esperando repuestos</option>
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md border border-slate-700 hover:bg-slate-800">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

const inputCls = 'w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-slate-400">{label}</label>
      {children}
    </div>
  )
}
