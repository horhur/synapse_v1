import QRCode from 'qrcode'
import { supabase } from './supabase'
import type { QrKind } from '../types/database'

/** Devuelve el token de un equipo para el tipo de QR dado, creándolo si no existe. */
export async function getOrCreateQrToken(equipmentId: string, kind: QrKind): Promise<string> {
  const { data: existing } = await supabase
    .from('qr_tokens')
    .select('token')
    .eq('equipment_id', equipmentId)
    .eq('kind', kind)
    .maybeSingle()
  if (existing) return existing.token

  const { data: created, error } = await supabase
    .from('qr_tokens')
    .insert({ equipment_id: equipmentId, kind })
    .select('token')
    .single()
  if (error) throw error
  return created.token
}

export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 1, width: 220 })
}
