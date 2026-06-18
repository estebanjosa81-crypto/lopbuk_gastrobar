# 🗄️ Arquitectura de Base de Datos

**Motor:** MySQL · **Patrón:** Multi-tenant por columna

## Principio Multi-Tenant

```sql
-- TODAS las tablas de negocio tienen tenant_id
-- NUNCA hacer queries sin filtrar por tenant_id

SELECT * FROM products
WHERE tenant_id = 'uuid-del-negocio'   -- OBLIGATORIO
  AND is_active = 1
```

## Tablas Principales (nombres reales en DB)

```
Core:
  tenants                   → registro de cada negocio
  users                     → todos los usuarios (con roles y cargos)
  sedes                     → sucursales por tenant
  employee_cargos           → cargos personalizados (FK users.cargo_id)
  refresh_tokens            → tokens de renovación JWT
  login_attempts            → intentos de login (brute force protection)

Inventario:
  products                  → catálogo (plantilla: name, base_price, category)
  product_variants          → variantes con stock, SKU, cost_price, supplier_id, price_override
  variant_price_tiers       → precios escalonados por variante (min_qty, price, margin_pct)
  inventory_movements       → kardex por variante (fuente de verdad del stock)
  stock_movements           → kardex legacy (productos sin variantes, se migrará a inventory_movements)
  categories                → categorías (is_active, color, sort_order)
  waste_records             → mermas con justificación  ← NO "merma_records"
  par_levels                → niveles PAR por producto
  product_recipes           → recetas BOM (product_id → ingredient_id)  ← NO "recipe_items"
  suppliers                 → proveedores
  purchase_invoices         → facturas de compra
  purchase_invoice_items    → líneas de facturas de compra

Ventas:
  sales                     → ventas registradas
  sale_items                → líneas de venta
  cash_sessions             → sesiones de caja
  cash_movements            → entradas/salidas manuales de caja
  orders                    → pedidos storefront/delivery
  storefront_orders         → pedidos tienda online
  storefront_order_items    → líneas de pedidos online
  credit_payments           → pagos de créditos

Clientes:
  customers                 → CRM
  discount_coupons          → cupones de descuento
  product_reviews           → reseñas de productos

Finanzas:
  finance_categories        → categorías de ingresos/egresos
  finance_transactions      → libro diario (cada peso)
  finance_budgets           → presupuesto mensual por categoría
  subscriptions             → suscripciones SaaS

RRHH:
  payroll_records           → nóminas generadas
  payroll_adjustments       → bonos y descuentos manuales
  employee_novelties        → ausencias, permisos, incapacidades
  employee_vacation_balances → saldo de vacaciones por año

Gastrobar:
  rb_tables                 → mesas del restaurante  ← NO "tables"
  rb_orders                 → comandas               ← NO "table_orders"
  rb_order_items            → ítems de comanda
  rb_payments               → pagos de comandas
  rb_reservations           → reservas online
  rb_order_sequence         → numeración automática comandas
  rb_reservation_sequence   → numeración automática reservas
  rb_gastos                 → gastos variables (auto-timestamp)
  rb_ingresos_diarios       → ingresos diarios (upsert por fecha)
  rb_gastos_fijos           → gastos fijos recurrentes

Delivery:
  fleet_vehicles            → vehículos
  fleet_maintenance         → mantenimientos de vehículos
  drivers                   → conductores  ← NO "fleet_drivers"

Digital/Storefront:
  store_info                → config de la tienda por tenant
  store_banners             → banners hero
  store_drops               → lanzamientos con descuentos
  store_announcement_bar    → barra de anuncio
  store_order_bump          → cross-sell automático
  store_featured_products   → productos destacados
  store_custom_sections     → secciones HTML personalizadas
  services                  → catálogo de servicios/citas
  service_bookings          → reservas de servicios
  service_availability      → horarios de disponibilidad

IA/Chatbot:
  chatbot_config            → config del agente por tenant
  chatbot_sessions          → sesiones de conversación
  chatbot_messages          → historial de mensajes
  agent_actions             → auditoría de herramientas IA

  supplier_products         → multi-proveedor: catálogo (supplier_id + product_id unique)

Sistema:
  work_orders               → órdenes de trabajo (tapicería)
  work_order_materials      → materiales por orden
  work_order_payments       → cobros parciales por orden
  re_properties / re_leads / re_contracts → módulo inmobiliario
  inventory_holds           → reserva de stock durante checkout
  audit_log                 → auditoría de acciones
  media_library             → ⚠️ NO existe como tabla — Cloudinary es externo
  printers                  → impresoras POS
  dev_requests              → solicitudes de features
```

## Convenciones

| Regla | Implementación |
|---|---|
| PK | `id VARCHAR(36)` — UUID v4 |
| Timestamps | `created_at`, `updated_at` DATETIME |
| Soft delete | `is_active TINYINT(1)` — nunca DELETE físico |
| Datos sensibles | Encriptados con `utils/crypto.ts` |
| Índices | Siempre en `tenant_id` + columnas de filtro frecuente |

## Schema Principal

Archivo: `backend/inventarioEsteban_v3_multitenant.sql`  
No hay carpeta `migrations/` — todas las migraciones están integradas en el script principal como procedimientos idempotentes (`sp_migrate_vX()`). Para levantar desde 0: ejecutar ese único archivo.

---

← [[architecture/backend]] | [[DAIMUZ]] | → [[architecture/deployment]]
