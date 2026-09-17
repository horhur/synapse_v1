import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Equipment, EquipmentStatus } from '../types/database'
import Modal from './Modal'

const STATUS_OPTIONS: { value: EquipmentStatus; label: string }[] = [
  { value: 'operativo', label: 'Operativo' },
  { value: 'mantencion', label: 'En mantención' },
  { value: 'fuera_servicio', label: 'Fuera de servicio' },
  { value: 'retirado', label: 'Retirado' },
]

export default function EquipmentFormModal({
  equipment,
  onClose,
  onSaved,
}: {
  equipment?: Equipment
  onClose: () => void
  onSaved: () => void
}) {
  const [clientName, setClientName] = useState('')
  const [internalCode, setInternalCode] = useState(equipment?.internal_code ?? '')
  const [brand, setBrand] = useState(equipment?.brand ?? '')
  const [model, setModel] = useState(equipment?.model ?? '')
  const [serial, setSerial] = useState(equipment?.serial_number ?? '')
  const [location, setLocation] = useState(equipment?.location ?? '')
  const [installDate, setInstallDate] = useState(equipment?.install_date ?? '')
  const [status, setStatus] = useState<EquipmentStatus>(equipment?.status ?? 'operativo')
  const [notes, setNotes] = useState(equipment?.notes ?? '')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!internalCode.trim()) {
      setError('El código interno es obligatorio')
      return
    }
    setSaving(true)
    setError(null)
    try {
      let clientId = equipment?.client_id ?? null
      if (clientName.trim()) {
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .eq('name', clientName.trim())
          .maybeSingle()
        if (existing) {
          clientId = existing.id
        } else {
          const { data: created, error: clientErr } = await supabase
            .from('clients')
            .insert({ name: clientName.trim() })
            .select('id')
            .single()
          if (clientErr) throw clientErr
          clientId = created.id
        }
      }

      let photoUrl = equipment?.photo_url ?? null
      if (photoFile) {
        const path = `${internalCode.trim()}/${Date.now()}-${photoFile.name}`
        const { error: uploadErr } = await supabase.storage
          .from('minicmms-photos')
          .upload(path, photoFile, { upsert: true })
        if (uploadErr) throw uploadErr
        const { data: signed } = await supabase.storage
          .from('minicmms-photos')
          .createSignedUrl(path, 60 * 60 * 24 * 365)
        photoUrl = signed?.signedUrl ?? null
      }

      const payload = {
        client_id: clientId,
        internal_code: internalCode.trim(),
        brand: brand.trim() || null,
        model: model.trim() || null,
        serial_number: serial.trim() || null,
        location: location.trim() || null,
        install_date: installDate || null,
        status,
        notes: notes.trim() || null,
        photo_url: photoUrl,
      }

      if (equipment) {
        const { error: updateErr } = await supabase
          .from('equipment')
          .update(payload)
          .eq('id', equipment.id)
        if (updateErr) throw updateErr
      } else {
        const { error: insertErr } = await supabase.from('equipment').insert(payload)
        if (insertErr) throw insertErr
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={equipment ? 'Editar equipo' : 'Nuevo equipo'} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3">
        {error && (
          <div className="text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md px-3 py-2">
            {error}
          </div>
        )}
        <Field label="Cliente">
          <input
            className={inputCls}
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Ej: Veterinaria Las Condes"
          />
        </Field>
        <Field label="Código interno *">
          <input className={inputCls} value={internalCode} onChange={(e) => setInternalCode(e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Marca">
            <input className={inputCls} value={brand} onChange={(e) => setBrand(e.target.value)} />
          </Field>
          <Field label="Modelo">
            <input className={inputCls} value={model} onChange={(e) => setModel(e.target.value)} />
          </Field>
        </div>
        <Field label="Número de serie">
          <input className={inputCls} value={serial} onChange={(e) => setSerial(e.target.value)} />
        </Field>
        <Field label="Ubicación">
          <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha de instalación">
            <input type="date" className={inputCls} value={installDate ?? ''} onChange={(e) => setInstallDate(e.target.value)} />
          </Field>
          <Field label="Estado">
            <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as EquipmentStatus)}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Foto">
          <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} className="text-sm" />
        </Field>
        <Field label="Notas">
          <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md border border-slate-700 hover:bg-slate-800">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50">
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
