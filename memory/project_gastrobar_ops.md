---
name: gastrobar-ops-module
description: Módulo operacional completo para gastrobares — merma, food cost, modo dueño, niveles PAR, sugerencias de compra
metadata:
  type: project
---

Se implementó el sistema operacional completo para gastrobares con los siguientes módulos:

## Backend (2 nuevos módulos)

### `/api/merma`
- `GET /merma/dashboard` — KPIs de merma: % merma, por área, por tipo, top productos, tendencia diaria
- `GET /merma` — listado de registros con filtros (fecha, área, tipo)
- `POST /merma` — registrar merma (descuenta stock automáticamente via stock_movements)
- `DELETE /merma/:id` — eliminar registro
- `GET /merma/par/levels` — niveles PAR con stock_gap calculado
- `POST /merma/par/levels` — crear/actualizar nivel PAR (upsert por producto)
- `DELETE /merma/par/levels/:id` — eliminar nivel PAR

### `/api/gastrobar-ops`
- `GET /gastrobar-ops/modo-dueno` — snapshot ejecutivo diario: ventas, food cost, ganancia real (después de merma), semáforo, alertas, top platos
- `GET /gastrobar-ops/food-cost` — food cost % por receta BOM, con estado (ok/warning/danger) vs rangos cocina 25-35% / bar 18-28%
- `GET /gastrobar-ops/purchase-suggestions` — sugerencias de compra por PAR + stock bajo reorder_point
- `GET /gastrobar-ops/weekly-trend` — tendencia 14 días: ventas, pedidos, merma

## Base de datos (2 nuevas tablas)

- `waste_records` — registro de merma con tipo, motivo, área, costo, responsable
- `par_levels` — nivel PAR por producto: uso diario × días entre compras + stock de seguridad

Las tablas se crean automáticamente en `startServer()` via CREATE TABLE IF NOT EXISTS.

## Frontend (2 nuevos componentes)

- `merma.tsx` — 3 tabs: Dashboard (KPIs + gráficos), Registros (CRUD), Niveles PAR
- `gastrobar-ops.tsx` — 4 tabs: Modo Dueño (semáforo + KPIs), Food Cost (por plato), Compras (sugerencias), Tendencia (14 días)

## Sidebar

Nueva sección "Gastrobar" con iconos Gauge (Centro de Mando) y Flame (Control de Merma).

**Why:** Los gastrobares pierden dinero sin saberlo por compras improvisadas, merma no registrada y food cost desconocido. El sistema saca la operación de la cabeza del dueño.

**How to apply:** Si el usuario pide más funcionalidades de gastrobar, extender estos módulos. El patrón de `authorize('comerciante', 'superadmin')` es el correcto (resto params, no array).
