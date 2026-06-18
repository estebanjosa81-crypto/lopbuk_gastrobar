# delivery — compressed

> 5 líneas. Si necesitas más → lee `delivery.md`

- **Flujo**: pedido 'pendiente' → dispatcher asigna conductor disponible → driver actualiza estado → 'en_camino' → 'entregado'
- **Restricción**: conductor debe estar `disponible` · solo 1 pedido activo por conductor · dispatcher puede reasignar
- **Tracking**: driver POST /api/fleet/location {lat,lng} → socket 'driver-location' → mapa en tiempo real
- **Vehículos**: `fleet_vehicles` con tipo (planta/ligera/moto) + capacidad en kg (base para módulo ferretería)
- **Archivos**: `delivery.service.ts`, `dispatch-panel.tsx`, `driver-panel.tsx`, `fleet-management.tsx`, `OrdersMap.tsx`

---

← [[DAIMUZ]] | → [[modules/delivery/delivery]]
