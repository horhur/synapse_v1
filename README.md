# MiniCMMS v2

CMMS liviano para PCSmartech, construido tomando como referencia Synapse
(soporte.pcsmartech.com) pero manteniendo simplicidad operativa.

Ver `docs/AUDITORIA_SYNAPSE.md` para la auditoría, tabla comparativa y plan de
implementación que originaron este proyecto.

## Stack

- React 19 + Vite + TypeScript + Tailwind CSS v4
- React Router
- Supabase (esquema aislado `minicmms` dentro del proyecto `cmms-pcsmartech`, sin tocar los datos de Synapse)
- Vercel Functions (`/api`) para el acceso público por QR y el análisis con IA (Groq)

## Variables de entorno

Ver `.env.example`. En Vercel además se necesita, solo del lado servidor:

- `SUPABASE_SERVICE_ROLE_KEY` — nunca en el bundle del cliente.
- `GROQ_API_KEY` — opcional; sin ella, el análisis IA muestra un mensaje de respaldo.

## Desarrollo local

```bash
npm install
npm run dev
```
