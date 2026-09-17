import type { EquipmentStatus, InterventionStatus } from '../types/database'

const EQUIPMENT_STYLES: Record<EquipmentStatus, string> = {
  operativo: 'bg-emerald-950 text-emerald-400 border-emerald-800',
  mantencion: 'bg-amber-950 text-amber-400 border-amber-800',
  fuera_servicio: 'bg-red-950 text-red-400 border-red-800',
  retirado: 'bg-slate-800 text-slate-400 border-slate-700',
}

const EQUIPMENT_LABELS: Record<EquipmentStatus, string> = {
  operativo: 'Operativo',
  mantencion: 'En mantención',
  fuera_servicio: 'Fuera de servicio',
  retirado: 'Retirado',
}

export function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${EQUIPMENT_STYLES[status]}`}>
      {EQUIPMENT_LABELS[status]}
    </span>
  )
}

const INTERVENTION_STYLES: Record<InterventionStatus, string> = {
  completado: 'bg-emerald-950 text-emerald-400 border-emerald-800',
  en_progreso: 'bg-blue-950 text-blue-400 border-blue-800',
  esperando_repuestos: 'bg-amber-950 text-amber-400 border-amber-800',
}

const INTERVENTION_LABELS: Record<InterventionStatus, string> = {
  completado: 'Completado',
  en_progreso: 'En progreso',
  esperando_repuestos: 'Esperando repuestos',
}

export function InterventionStatusBadge({ status }: { status: InterventionStatus }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${INTERVENTION_STYLES[status]}`}>
      {INTERVENTION_LABELS[status]}
    </span>
  )
}
