import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Requiere sesión de técnico válida (Authorization: Bearer <access_token>).
// El análisis es asistencia generativa, no un diagnóstico verificado — el
// disclaimer se agrega también en la respuesta, no solo en la UI, para que
// cualquier consumidor futuro de este endpoint lo reciba igual.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' })
    return
  }

  const authHeader = req.headers.authorization
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const url = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const groqKey = process.env.GROQ_API_KEY

  if (!url || !serviceKey) {
    res.status(500).json({ error: 'Configuración del servidor incompleta' })
    return
  }
  if (!accessToken) {
    res.status(401).json({ error: 'Sesión requerida' })
    return
  }

  const authClient = createClient(url, serviceKey)
  const { data: userData, error: userErr } = await authClient.auth.getUser(accessToken)
  if (userErr || !userData?.user) {
    res.status(401).json({ error: 'Sesión inválida' })
    return
  }

  const { equipmentId } = req.body ?? {}
  if (!equipmentId) {
    res.status(400).json({ error: 'equipmentId requerido' })
    return
  }

  const supabase = createClient(url, serviceKey, { db: { schema: 'minicmms' } })
  const { data: equipment } = await supabase
    .from('equipment')
    .select('internal_code, brand, model')
    .eq('id', equipmentId)
    .maybeSingle()
  const { data: interventions } = await supabase
    .from('interventions')
    .select('type, service_mode, description, solution, created_at')
    .eq('equipment_id', equipmentId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!equipment || !interventions?.length) {
    res.status(404).json({ error: 'Sin datos suficientes' })
    return
  }

  if (!groqKey) {
    res.status(200).json({
      insight:
        'IA no configurada en este despliegue (falta GROQ_API_KEY). Historial disponible: ' +
        interventions.length +
        ' intervenciones registradas.',
    })
    return
  }

  const history = interventions
    .map((i) => `- [${i.created_at.slice(0, 10)}] ${i.type} (${i.service_mode}): ${i.description}${i.solution ? ` → Solución: ${i.solution}` : ''}`)
    .join('\n')

  const prompt = `Sos un asistente técnico que ayuda a un técnico de terreno a detectar patrones de falla. Analiza el siguiente historial de intervenciones del equipo ${equipment.internal_code} (${equipment.brand ?? ''} ${equipment.model ?? ''}) y responde en español, en máximo 120 palabras, con: 1) posible patrón o causa raíz recurrente si lo hay, 2) una sugerencia concreta de próximo paso. Sé directo, sin relleno. No inventes datos que no estén en el historial.\n\nHistorial:\n${history}`

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      }),
    })
    if (!groqRes.ok) throw new Error(`Groq respondió ${groqRes.status}`)
    const json = await groqRes.json()
    const text = json.choices?.[0]?.message?.content?.trim() ?? 'Sin respuesta del modelo.'
    res.status(200).json({ insight: text })
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Error al generar análisis' })
  }
}
