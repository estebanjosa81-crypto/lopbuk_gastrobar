# 🍽️ Módulo: Gastrobar Ops

## Qué hace
Centro de mando específico para negocios gastronómicos. Unifica recetas, control de merma, food cost, niveles PAR y operaciones de cocina/barra.

## Submódulos

| Submódulo | Función |
|---|---|
| `gastrobar-ops` | Vista ejecutiva del gastrobar |
| `restbar` | Mesas, comandas, servicio en piso |
| `recipes` | Recetas BOM y food cost |
| `merma` | Control de desperdicio |
| `novedades` | Registro de novedades del turno |
| `gastrobar-ops.reservations` | Reservas de mesas |

## Archivos

**Backend:**
- `backend/src/modules/gastrobar-ops/gastrobar.service.ts`
- `backend/src/modules/restbar/restbar.service.ts`
- `backend/src/modules/recipes/recipes.service.ts`
- `backend/src/modules/merma/merma.service.ts`
- `backend/src/modules/novedades/novedades.service.ts`

**Frontend:**
- `frontend/components/gastrobar-ops.tsx` — centro de mando
- `frontend/components/restbar.tsx` — mesas y servicio
- `frontend/components/restbar-reservations.tsx` — reservas
- `frontend/components/recipes.tsx` — recetas y food cost
- `frontend/components/merma.tsx` — registro de merma
- `frontend/components/cocinero-panel.tsx` — panel cocina
- `frontend/components/bartender-panel.tsx` — panel barra
- `frontend/components/mesero-panel.tsx` — panel mesero

## Recetas BOM (Bill of Materials)

```
Receta: "Mojito"
Ingredientes:
  - Ron blanco: 60ml → costo $X
  - Limón: 1 unidad → costo $Y
  - Hierbabuena: 5g → costo $Z
  - Azúcar: 10g → costo $W
  
Food Cost = suma(ingrediente × cantidad × costo_unitario)
Food Cost % = (Food Cost / Precio de venta) × 100
```

## Niveles PAR

```
Nivel PAR = stock mínimo deseado por turno/semana
Si stock_actual < nivel_PAR → alerta de reorden
Sistema puede sugerir orden de compra automáticamente
```

## APIs Clave

```
# Gastrobar Ops
GET  /api/gastrobar-ops/modo-dueno         → snapshot ejecutivo diario: ventas, food cost, ganancia real, semáforo, alertas, top platos
GET  /api/gastrobar-ops/food-cost          → food cost % por receta BOM, con estado (ok/warning/danger)
GET  /api/gastrobar-ops/purchase-suggestions → sugerencias de compra por PAR + stock bajo reorder_point
GET  /api/gastrobar-ops/weekly-trend       → tendencia 14 días: ventas, pedidos, merma

# Merma
GET  /api/merma/dashboard                  → KPIs: % merma, por área, por tipo, top productos, tendencia diaria
GET  /api/merma                            → listado con filtros (fecha, área, tipo)
POST /api/merma                            → registrar merma (descuenta stock via stock_movements)
DELETE /api/merma/:id                      → eliminar registro
GET  /api/merma/par/levels                 → niveles PAR con stock_gap calculado
POST /api/merma/par/levels                 → crear/actualizar nivel PAR (upsert por producto)
DELETE /api/merma/par/levels/:id           → eliminar nivel PAR

# Recetas
GET  /api/recipes                          → lista recetas
GET  /api/recipes/:id/cost                 → calcula food cost
POST /api/recipes                          → crea receta con ingredientes

# Restbar
GET  /api/restbar/tables                   → estado de las mesas
POST /api/restbar/orders                   → crea comanda
```

## Tablas DB

| Tabla | Contenido |
|---|---|
| `waste_records` | Registros de merma: tipo, motivo, área, costo, responsable |
| `par_levels` | Nivel PAR por producto: uso_diario × días_entre_compras + stock_seguridad |

> Las tablas se crean en `startServer()` via `CREATE TABLE IF NOT EXISTS`.

## Rangos de Food Cost

| Área | OK | Warning | Danger |
|---|---|---|---|
| Cocina | < 35% | 35–40% | > 40% |
| Barra / Bar | < 28% | 28–33% | > 33% |

## Frontend — Tabs

| Componente | Tabs |
|---|---|
| `gastrobar-ops.tsx` | Modo Dueño (semáforo + KPIs) · Food Cost (por plato) · Compras (sugerencias) · Tendencia (14 días) |
| `merma.tsx` | Dashboard (KPIs + gráficos) · Registros (CRUD) · Niveles PAR |

## Reglas Críticas

- Al producir una receta → ingredientes se descuentan automáticamente del inventario
- La merma requiere justificación obligatoria (auditoría)
- El food cost se calcula en tiempo real con precios actuales de ingredientes
- Las reservas no pueden solaparse en la misma mesa
- Auth pattern correcto: `authorize('comerciante', 'superadmin')` — params sueltos, no array
- El sidebar muestra: Gauge (Centro de Mando) + Flame (Control de Merma)

## Dependencias
- [[modules/inventory/inventory]] — ingredientes del inventario
- [[modules/orders/orders]] — pedidos por mesa
- [[modules/pos/pos]] — venta al cerrar mesa

---

← [[DAIMUZ]]
