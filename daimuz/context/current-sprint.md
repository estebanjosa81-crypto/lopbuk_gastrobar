# Sprint / Foco Actual

> Actualiza este archivo al inicio de cada sesion de trabajo.

## Sprint activo: Junio 2026

### ✅ Completado [2026-06-21]: Carrito Tema 2 + fixes pagos + "Te encontré"/GPS + Módulo LEGEND (G1–G8)

| Tarea | Estado | Descripción |
|---|---|---|
| Carrito Tema 2 responsivo + fotos | ✅ | `theme2-order-flow.tsx`: modal `h-[100dvh]` + header/footer `shrink-0`; miniatura de producto/variante en cada línea |
| Promo "lleva 2, −X%" en Tema 2 | ✅ | `lib/qty-promo.ts` nuevo `qtyPromoUnit()` (escala a cualquier qty); badge en lista, banner en detalle, precio combinado en carrito/WhatsApp/pedido. `T2Product.qtyPromo` |
| Fix 400 /orders/public con Wompi | ✅ | validadores `optional({ checkFalsy: true })` para email/cédula/depto/municipio/dirección/barrio (vacíos ya no rompen) |
| Fix 401 pago de productos | ✅ | endpoint público `POST /payments/public/checkout` (sin auth) + `createCheckout` resuelve monto/tenant del pedido en BD (context 'order'); `api.createPublicOrderCheckout`; landing-page usa el público |
| Wizard ML captura completa | ✅ | campo Notas (opcional) agregado; flujo revisado (captura los 9 campos) |
| "Te encontré" (Tema 2) | ✅ | `GET /orders/public/lookup` (por teléfono+tenant) **verificado por nombre** (privacidad); autocompleta dirección/GPS de pedido anterior |
| Ubicación GPS + mini-mapa | ✅ | botón captura `navigator.geolocation`, muestra mini-mapa OSM (iframe, sin coords); lat/lng al pedido + link Maps. Botón "Confirmar pedido" (antes "Enviar por WhatsApp") |
| **Módulo LEGEND G1–G8** | ✅ | Consumer Plans completo (ver abajo) |

**Módulo Consumer Plans / LEGEND (nuevo, end-to-end):**
- **G1** Schema idempotente en `index.ts` (`consumer_access_codes`, `consumer_plan_grants`, `consumer_access_ledger`, `consumer_entitlements` + seed) · `migrations/006_consumer_plans.sql` · `consumer-plans.types.ts`. Ids VARCHAR(36) (no BIGINT).
- **G2** `consumer-plans.service.ts`: `redeemCode` (FOR UPDATE, idempotente, hash código, stack_policy extend con tope 180d, ledger), `getUserTier`, `hasEntitlement`, CRUD códigos, get/saveLegendConfig.
- **G3** `consumer-plans.routes.ts` (`/api/consumer-plans`): `/redeem` (rate-limit 5/15min), `/me`, `/legend-config`, admin codes + config.
- **G4** `consumer-plans-view.tsx` (pestaña Planes en `consumer-routine.tsx`): estado + contador en vivo + canje + beneficios.
- **G5** `legend-reveal.tsx` (glitch dorado skippable ≤2.5s) + tema LEGEND en el panel (header/tab dorados).
- **G6** `superadmin/tabs/LegendCodesTab.tsx`: generar/listar/desactivar códigos + config animación.
- **G7** Gamificación: `legend-badge.tsx` reutilizable, `powerDays` (streak), milestones 30/90/180/365 en `getUserTier` + UI.
- **G8** `getAnalytics()` + `GET /admin/analytics` + KPIs en LegendCodesTab (activos, por vencer, canjes 30d, retención, milestones).

**Archivos clave:** backend `index.ts` (migración G1 + registro ruta), `modules/consumer-plans/*`, `modules/orders/orders.routes.ts` (lookup + checkFalsy), `modules/payments/{payments.service,payments.routes}.ts` (checkout público order); frontend `lib/api.ts`, `theme2/theme2-order-flow.tsx`, `lib/qty-promo.ts`, `consumer-routine.tsx`, `consumer-plans-view.tsx`, `legend-reveal.tsx`, `legend-badge.tsx`, `theme-ml/checkout-wizard-ml.tsx`, `superadmin/{SuperadminLayout,tabs/LegendCodesTab}.tsx`.

**PENDIENTE (próxima sesión):** conectar `hasEntitlement(userId, key)` a features reales (gatear asistente IA con `routine_ai`, descuentos con `discounts`, etc.). Además: tsc front+back en Windows y **Deploy en Komodo** (la migración G1 corre al boot). NO se hizo push.

### ✅ Completado [2026-06-18 parte 2]: Integración de variantes COMPLETA (asiento + pasarelas + variant_id + cupo)

| Tarea | Estado | Descripción |
|---|---|---|
| Migraciones idempotentes | ✅ | `index.ts` addCol: `variant_id`+congeladas en `storefront_order_items`/`sale_items`; `preorder_limit`+`preorder_count` en `product_variants` |
| Asiento al confirmar | ✅ | `settleVariantForSale(conn)` descuenta stock variante, libera reserva, movimiento `salida`, congela en `sale_items`; SELECT de items con `variant_id`+`is_preorder` |
| Cupo de preventa | ✅ | `reserveForPublicOrder` enforce atómico `preorder_count + qty <= preorder_limit`; distinción por `reference_type`; `create`/`update`+UI |
| Reserva en pasarelas | ✅ | MP/ADDI/Sistecrédito reservan + persisten `variant_id` + cancelan/409 si no alcanza; liberan en webhooks de rechazo + `cancel-gateway` |
| Trazabilidad | ✅ | `variant_id` en `storefront_order_items` y `sale_items` |
| Auditoría | ✅ | tsc backend + frontend: **0 errores totales** |

**Archivos clave:** `backend/src/index.ts` (migraciones), `modules/variants/variants.service.ts` (`settleVariantForSale` + reserve/release con cupo), `modules/variants/variants.controller.ts` (pasa preorderLimit), `modules/orders/orders.routes.ts` (asiento + reserva en 3 pasarelas + liberación en webhooks), `modules/storefront/storefront.routes.ts` (attachVariants expone cupo), `common/types/index.ts`; frontend `components/variant-manager.tsx` (campo cupo), `lib/types.ts`.

**Solo queda operativo:** arrancar backend (corre migraciones) + cargar AnMarg + **Deploy en Komodo**.

### ✅ Completado [2026-06-18]: Variantes en todo el storefront + selección dinámica (Tema 2) + reserva atómica + preventa

| Tarea | Estado | Descripción |
|---|---|---|
| Producto AnMarg (carga) | ✅ | `imports/anmarg-camiseta-clasica/`: CSV 90 variantes + SQL tiers (6+/12+/24+) + README. No cargado en BD aún. |
| Selector dinámico Tema 2 | ✅ | `VariantSelector` integrado en `theme2-order-flow.tsx`: precio/imagen/stock al instante, bloqueo hasta elegir, variante en carrito/WhatsApp/pedido, `+`/"Ordenar Ahora" abren detalle si hay variantes |
| Tema 1 payload variantId | ✅ | `variantId` agregado a los 4 `items.map` de `landing-page` (público + 3 pasarelas) |
| Attach variantes centralizado | ✅ | helper `attachVariants()` en `storefront.routes.ts` aplicado a lista, /offers, /new-launches, /platform-featured, /drop/:id, store-config featured+trending (fix: no cargaban hasta recargar) |
| Visibilidad por variante | ✅ | lista incluye productos `stock=0` con variante disponible (`EXISTS` sobre `product_variants`) |
| Reserva atómica en /orders/public | ✅ | `reserveForPublicOrder`/`releaseForOrder` en `variants.service.ts`; `checkStockAvailability` ignora `variantId`; libera en `cancel-gateway` |
| Preventa backorder | ✅ | `allowOutOfStock` en `VariantSelector` (agotadas seleccionables); ítems `isPreorder` no reservan stock; conectado en ambos themes |
| Auditoría tsc | ✅ | backend + frontend sin errores nuevos en archivos tocados |

**Archivos clave:**
- Backend: `storefront.routes.ts` (helper `attachVariants` + visibilidad por variante), `orders.routes.ts` (`/public` reserva + `cancel-gateway` libera + `checkStockAvailability` variant-aware), `variants.service.ts` (`reserveForPublicOrder`/`releaseForOrder`)
- Frontend: `theme2/theme2-order-flow.tsx`, `variant-selector.tsx` (prop `allowOutOfStock`), `landing-page.tsx`
- Datos: `imports/anmarg-camiseta-clasica/` (CSV + SQL + README)

**Pendiente variantes:** asiento al confirmar (pedido→venta) para variantes (hoy descuenta `products.stock`, no asienta `reserved_stock`→`stock`); reserva en flujos de pasarela (solo `/public`); columna `variant_id` en `storefront_order_items` (cambio de schema, no hecho por la regla); cupo máximo de preventa por variante. **Falta Deploy en Komodo.**

### ✅ Completado [2026-06-17]: Afiliados (backend S1–4) + tarjetas externas + imagen por variante + barra config + cierre Tema 2

| Tarea | Estado | Descripción |
|---|---|---|
| Afiliados Sprint 1 (schema) | ✅ | 10 tablas, migración inline idempotente + tipos + 005_affiliates.sql |
| Afiliados Sprint 2 (core) | ✅ | service+routes, auth propia promotor, campañas/conversiones/retiros/misiones, superadmin/comercio |
| Afiliados Sprint 3 (paquetes) | ✅ | CRUD + contratación + pago inmediato al wallet |
| Afiliados Sprint 4 (atribución) | ✅ | hook `?ref=` en /orders/public + auto-aprobación; código POS listo (sin enganchar) |
| Tarjetas externas | ✅ | tabla + CRUD superadmin + merge en /storefront/stores + redirect en home |
| Imagen por variante | ✅ | campo en variant-manager + swap de imagen al elegir color (tienda) |
| Barra de bienvenida configurable | ✅ | platform_settings + LandingConfigTab + props home-theme2 |
| Cierre Tema 2 | ✅ | éxito holo+ticket, fix duplicados, carrito minimalista, premium, confirmación desde pedidos |
| Home móvil | ✅ | carrusel sin franjas + bienvenida sin recorte + "Únete a DAIMUZ" (3 públicos) |

**Pendiente afiliados (ver `context/roadmap-afiliados.md`):** Sprint 4b (hook POS por código), 4c (cron auto-aprobación),
Sprint 5 (tier engine + reset mensual), Sprints 6–8 (frontend: portal `/promotor`, panel comercio, tab superadmin).

**Acción requerida:** commit + push + **Deploy en Komodo** (las tablas de afiliados se crean al arrancar el backend).

### ✅ Completado [2026-06-16]: Tema 2 (reservas/pedidos) + QR de mesa administrable

| Tarea | Estado | Descripción |
|---|---|---|
| Reservas Tema 2 que guardan | ✅ Completo | `POST /restbar/reservations/public-quick` + pantalla de éxito + WhatsApp opcional |
| Pedidos sin falla silenciosa | ✅ Completo | `registerOrder` valida `res.ok`; no abre WhatsApp si falla; error en UI |
| "Ordenar Ahora" en Favoritos | ✅ Completo | `initialProductId` → producto ya en el carrito al abrir el flujo |
| Botón "todas las tiendas" a la derecha | ✅ Completo | Móvil: pill a la derecha (antes centrado); escritorio: pestaña borde derecho |
| QR de mesa administrable | ✅ Completo | GET sesión (invitados + consumo c/u) + close; panel con compartir/regenerar/eliminar |

**Archivos clave:**
- Backend: `restbar-qr.routes.ts` (GET/POST `/tables/:id/session(/close)`), `restbar/reservations.routes.ts` (`/public-quick`)
- Frontend: `theme2/theme2-reserve-flow.tsx`, `theme2/theme2-order-flow.tsx`, `theme2/theme2-storefront.tsx`, `restbar/table-qr-button.tsx`, `landing-page.tsx`, `lib/api.ts`

**Pendiente Tema 2:** restyle carrito minimalista, animación holo "en camino" al activar ubicación, tarjeta de ticket de éxito y tarjeta premium (Uiverse). **Falta Deploy en Komodo** para ver todo en prod.

### ✅ Completado [2026-06-14]: Colorimetría de marca por IA + fixes

| Tarea | Estado | Descripción |
|---|---|---|
| Arquitectura 2 niveles | ✅ Completo | Paleta plataforma (home/login/default) + paleta comercio (tienda full / panel acento) |
| Colorimetría superadmin | ✅ Completo | Tarjeta en LandingConfigTab; genera desde logo, guarda `platform_theme_colors` |
| Acento global default | ✅ Completo | `platform-theme-loader` en layout; fallback en `merchant-panel` |
| Auto-colorimetría comerciante | ✅ Completo | Al subir logo: genera+aplica+guarda + toast "¿desea editar?" |
| Fix favicon | ✅ Completo | `daimuz-icon-transparent.png` (sin recuadro blanco) |
| Fix guardado de tema (tarjeta) | ✅ Completo | `store-card-config.tsx` guarda al instante; backend `card-config` ya no falla por INSERT duplicado |

**Archivos clave:**
- Nuevos: `frontend/lib/platform-theme.ts`, `frontend/components/platform-theme-loader.tsx`, `frontend/components/platform-theme-generator.tsx`
- Editados: `frontend/app/layout.tsx`, `frontend/components/dynamic-favicon.tsx`, `frontend/components/superadmin/tabs/LandingConfigTab.tsx`, `frontend/components/logo-theme-generator.tsx`, `frontend/components/store-customization.tsx`, `frontend/components/landing-page.tsx`, `frontend/components/merchant-panel.tsx`, `frontend/components/store-card-config.tsx`
- Backend: `backend/src/modules/storefront/storefront.routes.ts` (fix `card-config`)
- Sin cambios de schema (reutiliza `platform_settings` + `/storefront/theme/*`)

**Pendiente de verificar en runtime:** levantar dev server, generar colorimetría desde superadmin y desde un comercio, confirmar tinte en home/login/panel; confirmar que el tema de la tarjeta del comercio persiste tras recargar. Requiere clave de IA de visión (Gemini/Groq/OpenAI) en Integraciones.

### ✅ Completado [2026-06-12]: Sprint 5 — Centro de Pedidos v2 + TenantManagement

| Sprint | Estado | Descripción |
|---|---|---|
| Sprint 5a — TenantManagement | ✅ Completo | DropdownMenu acciones con labels, eliminar, editar slug, trial configurable con días |
| Sprint 5b — Kanban + Bulk | ✅ Completo | KanbanView con @dnd-kit, acciones masivas, bulk toolbar flotante |
| Sprint 5c — Quick wins SLA | ✅ Completo | Banner alerta, priority chips, filtro comercio, border-l-4, antigüedad coloreada |
| Sprint 5d — Asignación rápida | ✅ Completo | Drawer muestra repartidores del tenant, asigna por driverId directo |

**Archivos clave:**
- `frontend/components/superadmin/shared/KanbanView.tsx` (nuevo — @dnd-kit)
- `frontend/components/superadmin/hooks/useOrders.ts` (expandido — bulk, drivers, kanban, priorityStats)
- `frontend/components/superadmin/tabs/OrdersCenterTab.tsx` (reescrito)
- `frontend/components/tenant-management.tsx` (mejorado — DropdownMenu, delete, slug, trial days)
- `backend/src/modules/orders/superadmin-orders.routes.ts` (3 endpoints nuevos, assign con assigneeId)
- `backend/src/modules/tenants/tenants.service.ts` (update acepta slug; activateTrial acepta days)
- Dep nueva: `@dnd-kit/core` + `@dnd-kit/utilities` (instalado con pnpm, npm da error en este proyecto)

### ✅ Completado [2026-06-12]: Panel Superadmin Modular (Sprints 0-4)

| Sprint | Estado | Descripción |
|---|---|---|
| Sprint 0 — Refactor monolito | ✅ Completo | 3444 líneas → 25 archivos, arquitectura hook+tab |
| Sprint 2 — Centro de Pedidos | ✅ Completo | Bandeja cross-tenant, SSE, state machine, drawer |
| Sprint 3 — Wizard + Papelera | ✅ Completo | Wizard 4 pasos, soft-delete, restore tenants |
| Sprint 4 — Analytics + SSE | ✅ Completo | KPIs plataforma, heatmap 7×24, SSE reemplaza polling |

**Archivos clave del resultado:**
- Backend: `superadmin-orders.routes.ts` (ahora 11 endpoints)
- Frontend: `frontend/components/superadmin/` (26 archivos tras Sprint 5)
- DB: `storefront_orders.assigned_to` (col) + `order_status_history` (tabla)

---

### ✅ Completado [2026-06-09]: Variantes + Precios por Volumen

### Estado Variantes

| Sprint | Estado | Proximo paso |
|---|---|---|
| DAIMUZ - Arquitectura disenada | Completo | En DAIMUZ |
| Sprint 1 - Schema DB | Pendiente | Migracion SQL |
| Sprint 2 - Backend | Pendiente | services + endpoints |
| Sprint 3 - Frontend POS + Storefront | Pendiente | selectores + precio dinamico |
| Sprint 4 - Panel Proveedor + Admin | Pendiente | vista proveedor + margenes |

### Sesion [2026-06-07] - Arquitectura Variantes en DAIMUZ
- **Modulo variants** -> `daimuz/modules/variants/variants.md` (completo + compressed.md)
- **Flujo** -> `daimuz/flows/variant-flow.md` (ciclo import -> storefront -> venta -> auditoria)
- **Sinapsis** -> `daimuz/synapses/variants-chain.md` (cadena impacto + matriz + flujo transaccional)
- **Plan definitivo** -> `daimuz/brain/variants-implementation-plan.md` (analisis critico, scorecard, roadmap 4 sprints)
- **Indexes**: modules-index (duplicados limpiados), db-tables-index (3 tablas nuevas + ALTERs), endpoints-index (endpoints variants + tiers + import + suppliers)
- **Governance**: universal-constraints.md con reglas de stock atomico, price tiers (min_qty solo), congelacion en ventas, inventory_movements como fuente de verdad
- **Ontologia**: entities.md con ProductVariant, VariantPriceTier, Supplier, SupplierProduct, InventoryMovement
- **Pending**: consolidado en 1 entrada con 4 sprints + migracion legacy
- **Scorecard**: diseno actual 9.4/10, plan 9.8/10 vs mejores practicas SaaS
- Pendiente: ejecutar migracion SQL, codificar services, endpoints, frontend

### Sesión [2026-06-09] — Integración análisis crítico externo + corrección de inconsistencias

- **Análisis externo integrado**: propuesta original (8.0/10) → crítica refinada (9.6/10) → DAIMUZ ya estaba en 9.4/10 → confirmado y corregido a 9.8/10
- ✅ **`variants-implementation-plan.md`**: `variant_price_tiers` ahora incluye `tenant_id` en DDL (antes solo en nota); unificado `attribute_1/2` → `color`/`size`/`material`; timestamps explícitos
- ✅ **`db-tables-index.md`**: `product_variants` ahora incluye `reserved_stock`, `min_stock`, `images`, `sort_order`; `platform_margin_pct` → `tenant_margin_pct`; `supplier_products` con timestamps
- ✅ **Estado confirmado**: race conditions, min_qty sin gaps, cost_price, inventory_movements, price freezing — TODO ya estaba en DAIMUZ antes de este análisis
- Pendiente: ejecutar migraciones SQL, codificar services, endpoints, frontend (Sprints 1-4)

### Sesión [2026-06-07] — Plan variants consolidado en DAIMUZ (ronda 2)
- ✅ **Módulo variants**: `daimuz/modules/variants/variants.md` + `compressed.md` creados
- ✅ **Synapse**: `daimuz/synapses/variants-chain.md` con flujo variante → venta → stock atómico
- ✅ **Ontología limpiada**: entidades duplicadas (ProductVariant x3, PriceTier x4) consolidadas en 10 entidades únicas
- ✅ **db-tables-index**: esquemas completos de `product_variants`, `variant_price_tiers`, `suppliers`, `supplier_products`
- ✅ **files-index**: variants + suppliers services + frontend components agregados
- ✅ **endpoints-index**: variantes consolidado en una sola sección (eliminados 3 duplicados)
- ✅ **Arquitectura**: min_qty sin gaps, UPDATE atómico `WHERE stock >= ?`, congelar precios en sale_items, cost_price para margen real

### Sesiones anteriores (IA Agent)

| Fase | Estado |
|---|---|
| Fase 1 - RAG + Function Calling | Completo |
| Fase 2 - WhatsApp (Evolution API) | Completo |
| Fase 3 - Voz IA (Vapi) | Pendiente |
| Fase 4 - Panel Admin del Agente | Pendiente |

---

## Template para nueva sesion

```markdown
## [YYYY-MM-DD]

### Objetivo de hoy
[que quiero lograr]

### Archivos que voy a tocar
- [archivo 1]
- [archivo 2]

### Resultado
[que logre al final]
```

---

[[context/pending]] | [[DAIMUZ]] | -> [[context/environment]]
