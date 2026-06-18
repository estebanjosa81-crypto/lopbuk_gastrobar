# 🔧 Módulo: Work Orders (Órdenes de Trabajo)

## Qué hace
Gestiona órdenes de trabajo para negocios de servicios técnicos (tapicería, reparaciones, instalaciones). Cada orden tiene un cliente, descripción del trabajo, materiales usados y estado.

## Archivos
- `backend/src/modules/workorders/workorders.service.ts`
- `backend/src/modules/workorders/workorders.routes.ts`
- `frontend/components/tapiceria.tsx` — panel de tapicería
- `frontend/components/gastrobar-ops.tsx` (compartido en UX)

## APIs
```
GET    /api/workorders             → lista órdenes
GET    /api/workorders/:id         → orden con materiales y estados
POST   /api/workorders             → crea orden de trabajo
PUT    /api/workorders/:id         → actualiza orden
PATCH  /api/workorders/:id/status  → cambia estado
```

## Estados de una Orden
```
recibida → presupuestada → aprobada → en_proceso → terminada → entregada
                                                             ↘ cancelada
```

## Reglas Críticas
- Los materiales usados descuentan del [[modules/inventory/inventory]]
- El cliente debe ser notificado al cambiar estado (via [[modules/whatsapp/whatsapp]])
- Una orden entregada genera una venta en [[modules/sales/sales]]

## Estado Actual
🔄 En ajuste — flujos base listos, mejorando UX del panel

## Dependencias
- [[modules/inventory/inventory]] — materiales = consumo de stock
- [[modules/customers/customers]] — cliente de la orden
- [[modules/sales/sales]] — genera venta al entregar

---
← [[DAIMUZ]]
