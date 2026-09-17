import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anonKey) {
  throw new Error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
}

// Todas las tablas de MiniCMMS viven en el esquema "minicmms" (aislado de
// "public", que es el esquema de Synapse). db: { schema } apunta el cliente
// ahí por defecto para el resto de la app. Auth usa su propio endpoint
// (/auth/v1) sin importar este ajuste, así que el login es el mismo de
// Synapse (mismo proyecto Supabase, mismo auth.users).
//
// Nota: no se usa el generic <Database> de supabase-js aquí — sin CLI local
// de Supabase para generar los tipos reales, un tipo manual incompleto
// rompe la inferencia del query builder (todo cae a "never"). Se prefiere
// tipar los datos en el límite de cada componente con las interfaces de
// ../types/database en vez de forzar un genérico a medias.
export const supabase = createClient(url, anonKey, {
  db: { schema: 'minicmms' },
})
