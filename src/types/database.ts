export type EquipmentStatus = 'operativo' | 'mantencion' | 'fuera_servicio' | 'retirado'
export type InterventionType = 'correctivo' | 'preventivo' | 'inspeccion' | 'instalacion' | 'reparacion'
export type ServiceMode = 'presencial' | 'remoto'
export type InterventionStatus = 'completado' | 'en_progreso' | 'esperando_repuestos'
export type QrKind = 'cliente' | 'tecnico'

export interface Client {
  id: string
  name: string
  phone: string | null
  created_at: string
}

export interface Equipment {
  id: string
  client_id: string | null
  internal_code: string
  brand: string | null
  model: string | null
  serial_number: string | null
  location: string | null
  install_date: string | null
  status: EquipmentStatus
  photo_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Intervention {
  id: string
  equipment_id: string
  type: InterventionType
  service_mode: ServiceMode
  description: string
  solution: string | null
  technician_name: string | null
  hours: number
  parts_cost: number
  labor_cost: number
  status: InterventionStatus
  created_at: string
}

export interface InterventionPhoto {
  id: string
  intervention_id: string
  url: string
  created_at: string
}

export interface QrToken {
  id: string
  equipment_id: string
  kind: QrKind
  token: string
  created_at: string
}

export interface AiMonthlyReport {
  id: string
  period_month: number
  period_year: number
  content: Record<string, unknown>
  generated_at: string
}
