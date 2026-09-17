# Auditoría de Synapse y plan de MiniCMMS v2

Fecha: 2026-09-17. Auditoría hecha por observación directa en
`soporte.pcsmartech.com` con sesión de técnico. Todo lo marcado como hallazgo
es hecho verificado; las prioridades de la tabla comparativa son criterio
técnico (hipótesis), no verificación externa.

## Hallazgos de Synapse

- **Dashboard** (3 pestañas): Resumen (6 KPIs + resumen mensual con IA +
  export), Análisis Detallado (8 KPIs incl. tiempo promedio de respuesta y
  tasa de re-intervención, distribución de tipos de intervención, timeline 30
  días, mapa de calor por ubicación, top 10 equipos con más fallas), Alertas y
  Garantías (alertas por marca, análisis de garantía en 4 estados).
- **Inventario**: grid/lista, búsqueda simple, filtro "problemáticos" (3+
  fallas en 6 meses), búsqueda avanzada (7 criterios + guardar filtro),
  agrupación por marca/cliente/ubicación/estado, paginación.
  Bug detectado (no replicar): el header de "N equipos registrados" muestra
  el tamaño de página, no el total real (53 según Dashboard).
- **Ficha de equipo**: foto, serie, ubicación, cliente, garantía, bloque de
  IA bloqueado hasta 2+ intervenciones correctivas, historial con fotos, QR
  dual cliente(sin auth)/técnico(con auth).
- **Nueva intervención**: selector de 5 proveedores IA, plantillas, "copiar
  última", tipo + tipo de servicio (presencial/remoto), descripción/solución
  con IA + búsqueda en manuales + búsqueda de soluciones previas (RAG),
  checklist de 9 ítems, horas/repuestos/mano de obra, estado.
- **Citas**: calendario mes/semana/día, prioridades, tipo (express/inventariado).
- **Clientes**: 65 registrados, conteos por cliente.
- **Reportes de Incidencias**: intake público con triage (pendiente/agendada/
  resuelta/spam/duplicado).
- **IA — Resumen Mensual**: genera resumen ejecutivo + tendencias + equipos
  críticos + recomendaciones + predicciones. Gap detectado: no se presenta
  explícitamente como asistencia no verificada — corregido en MiniCMMS v2.

## Tabla comparativa (resumen — ver el hilo de la sesión para la versión completa)

| Feature | Migrar a v1 | Clasificación |
|---|---|---|
| CRUD equipo + foto + estado | Sí | MUST HAVE |
| Historial intervenciones + fotos + costo/horas | Sí | MUST HAVE |
| QR dual cliente/técnico | Sí | MUST HAVE |
| Garantía (vencida/por vencer/sin fecha) | Sí | MUST HAVE |
| Dashboard básico (6 KPIs) | Sí | MUST HAVE |
| Agrupación, filtro problemáticos, top-fallas, alertas de marca | Sí | SHOULD HAVE |
| Resumen mensual IA con disclaimer explícito | Sí | SHOULD HAVE |
| Búsqueda avanzada completa, checklist editable, RAG manuales/soluciones | Parcial/futuro | OPTIONAL |
| Selector de 5 proveedores IA | No | DO NOT MIGRATE |
| Módulo de Citas, Reportes de Incidencias públicos | No en v1 | DO NOT MIGRATE |

## Decisión de arquitectura

Se reutiliza el proyecto Supabase `cmms-pcsmartech` (cuota de proyectos
simultáneos agotada) mediante un esquema Postgres aislado `minicmms`
(tablas, RLS y bucket de Storage propios). Cero contacto con las tablas
`public.*` de Synapse — verificado antes/después de cada migración
(mismos conteos de filas).

## Nota sobre MiniCMMS v1 (existente)

Ya existe un repo/deploy previo (`github.com/horhur/minicmms`, app
"Synapse One", live en minicmms.vercel.app, 24 commits 9–14 sept 2026) con
funciones que este v2 todavía no tiene (OAuth por invitación, PDF, panel de
admin, IA de solo lectura). Por decisión explícita, v2 se construye y
despliega aparte, sin tocar ese repo/deploy.
