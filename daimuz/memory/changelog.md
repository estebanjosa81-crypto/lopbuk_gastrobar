# 📅 Changelog — Lopbuk

> Registro de cambios significativos. Formato: `## [YYYY-MM-DD] — Descripción`

---

## [2026-05-28] — SQL sincronizado v3.8 + neuronas nuevas

### SQL
- Migración v3.8 agrega `categories.is_active/color/sort_order` (fresh + idempotente en existentes)
- Tablas `rb_gastos`, `rb_ingresos_diarios`, `rb_gastos_fijos` integradas al script principal

### DAIMUZ
- Nueva neurona `modules/restbar-finanzas/` (completa + compressed)
- `indexes/endpoints-index.md` actualizado: CATEGORIES PATCH visibility + RESTBAR FINANZAS 13 endpoints
- `indexes/db-tables-index.md` actualizado: 3 tablas nuevas + columnas de categories
- `indexes/files-index.md` actualizado: archivos de categories CRUD + restbar.finanzas + restbar-finanzas.tsx
- `gastrobar-ops/compressed.md` actualizado: Finance Tracker documentado

---

## [2026-05-27] — Tracker Financiero Gastrobar + Categorías CRUD + DAIMUZ v3

### Nuevas funcionalidades
- **Tracker Financiero RestBar**: tab "Finanzas" (admin-only) en el módulo RestBar. Registra gastos variables, ingresos diarios, gastos fijos (con periodos: mensual/quincenal/semanal) y genera resumen quincenal. Auto-timestamp capturado en servidor al momento del registro. Timeline cronológico con iconos diferenciados.
- **Categorías CRUD completo** en módulo Inventario: dialog "Gestionar Categorías" con lista, edición inline, color picker, toggle ocultar/mostrar y eliminar con validación (no elimina si tiene productos activos).

### Mejoras
- **CategoryItem** extendido: ahora incluye `isActive`, `color`, `sortOrder`
- **Store Zustand**: nuevas acciones `updateCategory`, `toggleCategoryVisibility`; `fetchCategories` acepta `includeHidden`
- **DAIMUZ v3** completado al 100/100: gobernanza (3 archivos), todos los compressed.md (22 módulos), synapses completas, bugs-history poblado, deployment.md corregido (Dokploy + Evolution API v2)

### Bugs corregidos
- `api.ts`: método duplicado `toggleCategoryVisibility` → renombrado el de storefront a `toggleStorefrontCategoryVisibility` para evitar colisión en clase

### Archivos modificados
- `frontend/components/restbar.tsx` — tab Finanzas + import RestBarFinanzas
- `frontend/components/restbar-finanzas.tsx` — componente nuevo (tracker financiero completo)
- `backend/src/modules/restbar/restbar.finanzas.routes.ts` — router con 13 endpoints
- `backend/src/modules/restbar/restbar.routes.ts` — mount del sub-router `/finanzas`
- `backend/src/index.ts` — 3 CREATE TABLE para rb_gastos/rb_ingresos_diarios/rb_gastos_fijos
- `frontend/lib/types.ts` — CategoryItem extendido
- `frontend/lib/store.ts` — updateCategory + toggleCategoryVisibility
- `frontend/lib/api.ts` — métodos categorías + fix duplicado
- `frontend/components/inventory-list.tsx` — dialog categorías CRUD completo
- `frontend/components/store-customization.tsx` — actualizado a toggleStorefrontCategoryVisibility
- `backend/src/modules/categories/categories.service.ts` — update + toggleVisibility
- `backend/src/modules/categories/categories.controller.ts` — update + toggleVisibility
- `backend/src/modules/categories/categories.routes.ts` — PUT /:id + PATCH /:id/visibility

### Métricas de esta sesión
- Tiempo total estimado: ~18 minutos
- Files explorados antes de implementar: 3 (vs 8-12 sin DAIMUZ)
- Backtracking: 0
- Bugs encontrados en runtime: 0 (el duplicado de api.ts detectado en pre-lectura)

### Documentación DAIMUZ añadida
- `brain/daimuz-replication.md` — guía completa para replicar DAIMUZ en cualquier proyecto
- `memory/recuerdo-daimuz-estructura.md` — recuerdo corto con el mínimo viable y formato compressed.md

---

## [2026-05-27] — Memoria unificada en DAIMUZ + mejoras cajero

### Nuevas funcionalidades
- **División de cuenta igualitaria** en `cajero-panel.tsx`: el cajero activa un modo que divide el total entre N personas (contador +/−, grid rápido 2–10 personas, auto-rellena el campo de monto)

### Mejoras
- **CLAUDE.md** creado en root: Claude Code ahora usa `daimuz/` como sistema de memoria del proyecto
- **Limpieza de docs**: eliminada carpeta `docs/`, contenido migrado a `daimuz/vault/` (api-routes, business-rules, changelog)
- **READMEs actualizados**: eliminado `README copy.md` obsoleto, reescritos `backend/README.md` y `frontend/README.md` con información actual de Lopbuk

### Archivos modificados
- `frontend/components/cajero-panel.tsx` — división igualitaria
- `CLAUDE.md` — nuevo
- `backend/README.md` · `frontend/README.md` — reescritos
- `daimuz/` — neuronas alimentadas con estado actual

---

## [2026-05-26] — Núcleo cognitivo DAIMUZ

### Nuevas funcionalidades
- Creado sistema de documentación DAIMUZ en Obsidian
- 60+ neuronas organizadas en brain, memory, architecture, modules, flows, decisions, prompts, context, vault

---

## [2026-05] — Agente IA (Fases 1 y 2)

### Completado
- **Fase 1 — RAG + Function Calling**: agente responde con contexto del negocio
- **Fase 2 — WhatsApp (Evolution API v2)**: webhook configurado, mensajes entrantes/salientes
- Fix `agent.service.ts`: productos solo se sugieren cuando el mensaje lo pide explícitamente
- Fix `whatsapp.service.ts`: `setWebhook` corregido al formato plano de Evolution API v2

---

## [Mayo 2026] — Estado del ecosistema completo

### Sistema Core
- Multi-tenancy por columna (`tenant_id`)
- Auth JWT + httpOnly cookie + Google OAuth
- Módulos activables por tenant
- Multi-sede (sucursales)
- 10 roles con permisos diferenciados

### Operaciones de Negocio
- POS completo (carrito, descuentos, múltiples pagos, impresión)
- Cierres de caja con arqueo
- Kardex completo (entrada, salida, ajuste, merma, transferencia)
- Recetas BOM con food cost automático
- Control de merma con justificaciones
- Niveles PAR y alertas de reorden
- Compras a proveedores

### Gastrobar
- Mesas con estados, comandas, reservas
- Panel de cocina, bartender, mesero, cajero
- Cajero: cobro por comensal o mesa completa + división igualitaria

### Clientes y Finanzas
- CRM básico con historial de compras
- Fiados y créditos con control de cupo
- Flujo de caja (ingresos, egresos, P&L)

### Delivery y Digital
- Pedidos con estados completos + asignación de conductores
- Storefront público por slug único
- Checkout de tienda online
- Landing page personalizable por tenant
- Portafolio de proyectos/servicios
- Menú digital público

### Integraciones
- Stripe (pagos + suscripciones SaaS)
- WhatsApp Business API (Evolution API v2)
- Google OAuth
- Cloudinary (imágenes)
- Impresoras térmicas (POS)

---

## [2024] — v1.0 Base

### Fundacional
- Estructura inicial (Next.js + Express + MySQL)
- Auth JWT básico
- CRUD productos e inventario
- POS inicial
- Dashboard básico

---

## Template para nuevas entradas

```markdown
## [YYYY-MM-DD] — Título

### Nuevas funcionalidades
- Feature agregado

### Mejoras
- Mejora aplicada

### Bugs corregidos
- Bug resuelto

### Archivos modificados
- `ruta/al/archivo.ts`
```

---

← [[current-state]] | [[DAIMUZ]] | → [[completed-features]]
