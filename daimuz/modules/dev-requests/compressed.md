# dev-requests — compressed

> 5 líneas. Módulo sin doc completo aún.

- **Qué hace**: los tenants envían solicitudes de nuevas funcionalidades — es el CRM interno de desarrollo de Lopbuk
- **Flujo**: tenant envía → `pendiente` → superadmin revisa → `cotizado` (con horas + precio) → tenant aprueba → `en_progreso` → `completado`
- **Tipos**: `objetivo` · `mejora` · `actualizacion` · `bug` · `otro` con prioridades `baja/media/alta`
- **Visibilidad**: el tenant solo ve sus propias solicitudes · el superadmin ve todas
- **Archivos**: `dev-requests.service.ts`, `dev-requests.controller.ts`, `dev-requests.routes.ts`, `developer-requests.tsx` · Tabla: `dev_requests`

---

← [[DAIMUZ]] | [[indexes/modules-index]]
