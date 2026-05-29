# 📍 Estado Actual — Mayo 2026

> Actualiza este archivo después de cada sesión de trabajo significativa.

## Qué está funcionando al 100%

- ✅ **Auth** — Login local + Google OAuth + roles + multi-tenant
- ✅ **Dashboard** — KPIs, gráficas, métricas en tiempo real
- ✅ **POS** — Ventas, descuentos por ítem y global, múltiples pagos
- ✅ **Inventario** — Kardex completo, movimientos, alertas de stock
- ✅ **Caja** — Apertura/cierre, arqueo, historial inmutable
- ✅ **Ventas** — Historial con filtros, cancelaciones con auditoría
- ✅ **Clientes** — CRM básico, historial de compras
- ✅ **Créditos/Fiados** — Control de cupo, pagos parciales
- ✅ **Finanzas** — Flujo de caja, ingresos/egresos
- ✅ **Gastrobar** — Mesas, comandas, reservas, recetas BOM, food cost, merma
- ✅ **Compras** — Órdenes de compra, facturas de entrada
- ✅ **Delivery** — Pedidos, asignación de conductores, tracking básico
- ✅ **Flota** — Gestión de vehículos y conductores
- ✅ **Storefront** — Tienda online pública, checkout, pedidos online
- ✅ **WhatsApp** — Integración básica con WhatsApp Business
- ✅ **Stripe** — Pagos y suscripciones SaaS
- ✅ **Multi-tenant** — Sistema completo de tenants y módulos activables
- ✅ **Multi-sede** — Sedes con inventario y caja independientes

## En ajuste / desarrollo activo

- 🔄 **Agente IA** — RAG funcionando, mejorando respuestas y herramientas
- 🔄 **Inmobiliaria** — Módulo base listo, refinando flujos
- 🔄 **Tapicería/WorkOrders** — Módulo listo, refinando UX

## Pendiente / Backlog

- ⏳ Ver [[context/pending]] para la lista priorizada

## Últimos cambios

> Agrega aquí cada vez que termines algo significativo

- `[2026-05-28]` — **Dividir cuenta en partes iguales — RestBar Caja** (`restbar.tsx`): nueva opción en el selector de cobro de la sección Caja. Muestra un panel ámbar con contador +/− de personas, calcula "cada persona paga $XXX", desglose por persona numerado. Solo frontend, sin cambios en backend. El cobro sigue procesándose como pago de mesa completa. Disponible para todas las mesas (con o sin comensales asignados). Selector ahora siempre muestra las opciones al elegir mesa (antes auto-saltaba a modo tabla si no había split de comensales).
- `[2026-05-28]` — **SQL principal sincronizado** (`inventarioEsteban_v3_multitenant.sql`): migración v3.8 agrega `categories.is_active/color/sort_order` + tablas `rb_gastos`, `rb_ingresos_diarios`, `rb_gastos_fijos`. SQL ahora está full para levantar desde 0.
- `[2026-05-27]` — **Tracker Financiero Gastrobar** (`restbar-finanzas.tsx` + `restbar.finanzas.routes.ts`): tab "Finanzas" (admin-only) en RestBar con timeline, gastos variables, ingresos diarios, gastos fijos y resumen quincenal. Auto-timestamp en servidor. 3 tablas nuevas: `rb_gastos`, `rb_ingresos_diarios`, `rb_gastos_fijos`.
- `[2026-05-27]` — **Categorías CRUD completo** en módulo Inventario: backend (PUT /:id, PATCH /:id/visibility), frontend dialog con lista de categorías + edición inline + color picker + hide/show + delete con validación. `CategoryItem` actualizado con `isActive`, `color`, `sortOrder`. Store con `updateCategory`, `toggleCategoryVisibility`.
- `[2026-05-27]` — **daimuz v3** (100/100): gobernanza completa, todos los compressed.md, synapses completas, bugs-history poblado, deployment.md corregido (Dokploy + Evolution API v2).
- `[2026-05-27]` — **daimuz v2**: arquitectura cognitiva avanzada. Añadidos `indexes/` (4 archivos), `synapses/` (4 cadenas de impacto), `ontology/entities.md`, `governance/universal-constraints.md`, `compressed.md` en 7 módulos clave. DAIMUZ.md y CLAUDE.md actualizados.
- `[2026-05-27]` — **División de cuenta igualitaria** en `cajero-panel.tsx`: el cajero puede dividir el total entre N personas, con contador +/−, grid de acceso rápido (2–10 personas), y botón para auto-llenar el monto por persona.
- `[2026-05-27]` — **Limpieza de READMEs**: eliminado `README copy.md` (obsoleto, era del proyecto viejo "inventariodaniel"), reescritos `backend/README.md` y `frontend/README.md` con info actual de Lopbuk.
- `[2026-05-27]` — **CLAUDE.md** creado en root: Claude usa `daimuz/` como sistema de memoria del proyecto.
- `[2026-05-26]` — Creado núcleo cognitivo DAIMUZ en Obsidian
- `[anterior]` — Ajustes en POS y storefront
- `[anterior]` — Mejoras en landing page y portafolio

---

← [[DAIMUZ]] | → [[completed-features]]
