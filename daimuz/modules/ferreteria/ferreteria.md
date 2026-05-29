# 🔩 Módulo: Ferretería

> Plan de implementación acordado. Estado: **⏳ Pendiente de desarrollo.**  
> Ver backlog: [[context/pending]]

## Qué hace

Extiende Lopbuk para ferreterías: inventario especializado (peso, dimensiones, calibre), flota de vehículos con asignación por peso, despacho en pista, y storefront con cálculo de peso y sugerencia de vehículo de entrega.

## Por qué

El comerciante de ferretería necesita gestionar inventario especializado, una flota de camiones con asignación por peso, control de despacho en pista, y domicilio con ubicación exacta en la tienda online.

## Bases ya disponibles (reusar)

- Productos con tipo `ferreteria` y campos: `dimensions`, `weight`, `caliber`, `resistance`, `finish`, `recommended_use`
- Módulo `delivery` con statuses completos
- `driver-panel.tsx` existente
- Rol `repartidor` existente
- Geolocalización en `storefront_orders`
- `billing-pos.tsx` con carrito completo
- `LocationPicker.tsx` y `ModalExito.tsx` en checkout

---

## Plan — 9 Fases

### FASE 1 — Base de Datos
- Tabla `fleet_vehicles`: `id, tenant_id, name, plate, type (planta|ligera|moto), max_weight_kg, status (disponible|en_ruta|mantenimiento|inactivo), notes`
- Tabla `fleet_maintenance`: `id, vehicle_id, tenant_id, type (preventivo|correctivo), description, scheduled_date, completed_date, cost, status`
- Tabla `fleet_vehicle_metrics`: pedidos_hoy, peso_transportado, km_recorridos
- Extender `storefront_orders`: `+vehicle_id, +dispatch_status (pendiente|en_pista|cargado|despachado|entregado), +total_weight_kg, +dispatch_notes, +dispatch_assigned_at, +dispatched_at`
- Extender `sales`: `+vehicle_id, +dispatch_status, +total_weight_kg`
- Nuevo rol: `despachador`

### FASE 2 — Backend: Módulo `fleet` (nuevo)
```
GET/POST/PUT/DELETE /api/fleet/vehicles      → CRUD vehículos
GET/POST/PUT        /api/fleet/maintenance   → CRUD mantenimientos
GET                 /api/fleet/metrics       → rendimiento por vehículo
PUT                 /api/fleet/assign        → asignar orden → vehículo
PUT                 /api/fleet/dispatch-status → cambiar estado despacho
```
- Lógica: `weightBasedAssignment(weight_kg) → vehicle_id`
  - Camión planta: > 500 kg
  - Camión ligero: 100–500 kg
  - Moto / domicilio: < 100 kg

### FASE 3 — Backend: Extensiones módulos existentes
- `orders`: calcular peso total al crear (sum `product.weight_kg × qty`)
- `sales`: misma lógica de peso en POS
- `delivery`: aceptar `vehicle_id` además de `driver_id`
- `products`: `weight_kg` requerido para tipo ferretería

### FASE 4 — Frontend: Panel Despachador (`dispatch-panel.tsx`)
- Visible para rol `despachador`
- Lista de órdenes agrupadas por estado de despacho
- Por orden: factura, peso total, vehículo asignado (auto o manual)
- Flujo: "En pista" → "Cargado" → "Despachado" (actualiza driver-panel)
- Puede reasignar vehículo antes de marcar salida

### FASE 5 — Frontend: Driver Panel (extensión)
- Ver pedido asignado con dirección + mapa
- Estados: "Esperando salida" → "En ruta" → marcar "Entregado"
- Historial del día por vehículo

### FASE 6 — Frontend: Inventario ferretería
- Formulario con `peso_kg` prominente y requerido
- Selector de unidades: kg, ton, lb (conversión automática a kg)
- Vista resumen: peso total del inventario disponible

### FASE 7 — Frontend: Storefront cliente
- Modal de producto: mostrar peso
- Carrito: peso acumulado visible
- Mínimo de compra configurable → activa domicilio
- Modal "¿Quieres domicilio?" al superar mínimo
- Reusar `LocationPicker` para capturar ubicación exacta
- Al confirmar: mostrar vehículo asignado estimado

### FASE 8 — Frontend: POS (`billing-pos.tsx`)
- Peso total del carrito en tiempo real
- Indicador visual de peso acumulado
- Auto-sugerir vehículo según peso
- Selector manual de vehículo
- Mostrar vehículo en el recibo/factura

### FASE 9 — Frontend: Gestión de Flota (panel comerciante)
- Sub-sección "Mi Flota" en panel del comerciante
- CRUD vehículos: tipo, capacidad, placa, estado
- Calendario de mantenimientos con alertas
- Dashboard: pedidos por vehículo, peso transportado, disponibilidad
- Mapa en tiempo real de vehículos en ruta
- Reportes: rendimiento mensual por vehículo

---

## Dependencias
- [[modules/delivery/delivery]] — reusar lógica de delivery
- [[modules/inventory/inventory]] — weight_kg en productos
- [[modules/orders/orders]] — cálculo de peso al crear orden
- [[modules/storefront/storefront]] — checkout con peso y vehículo

---

← [[DAIMUZ]] | → [[context/pending]]
