import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Este endpoint corre SOLO en el servidor (Vercel Function). Usa la
// service_role key, que nunca se envía al navegador, para poder resolver
// el token público sin depender de políticas RLS para "anon". La respuesta
// se filtra a mano: nunca incluye costos, nombre de técnico ni fotos —
// eso es lo que separa el acceso "cliente" del acceso "técnico".
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = req.query.token
  if (typeof token !== 'string') {
    res.status(400).json({ error: 'Token requerido' })
    return
  }

  const url = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    res.status(500).json({ error: 'Configuración del servidor incompleta' })
    return
  }

  const supabase = createClient(url, serviceKey, { db: { schema: 'minicmms' } })

  const { data: qrToken } = await supabase
    .from('qr_tokens')
    .select('equipment_id, kind')
    .eq('token', token)
    .maybeSingle()

  if (!qrToken || qrToken.kind !== 'cliente') {
    res.status(404).json({ error: 'Código QR inválido' })
    return
  }

  const { data: equipment } = await supabase
    .from('equipment')
    .select('internal_code, brand, model, status, location')
    .eq('id', qrToken.equipment_id)
    .maybeSingle()

  if (!equipment) {
    res.status(404).json({ error: 'Equipo no encontrado' })
    return
  }

  const { data: interventions } = await supabase
    .from('interventions')
    .select('type, service_mode, description, solution, created_at')
    .eq('equipment_id', qrToken.equipment_id)
    .order('created_at', { ascending: false })

  res.status(200).json({
    ...equipment,
    interventions: interventions ?? [],
  })
}
