# 🚚 Flujo: Delivery Completo

```mermaid
graph TD
    C[Cliente pide online] --> P[Pedido: pendiente]
    P --> D[Dispatcher ve el pedido]
    D --> V{¿Conductor disponible?}
    V -->|Sí| AS[Asigna conductor]
    V -->|No| W[Espera disponibilidad]
    AS --> N[Notificación al driver Socket.io]
    N --> DR[Driver acepta]
    DR --> EC[Driver: en_camino]
    EC --> MAP[Tracking en mapa en tiempo real]
    EC --> ENT[Driver: entregado]
    ENT --> FIN[Pedido completado ✅]
```

## Actualizaciones en Tiempo Real

```
Driver actualiza estado/ubicación
  → PATCH /api/delivery/:id/status
  → Socket.io emite a todo el tenant:
    → 'order-status' → dispatch panel se actualiza
    → 'driver-location' → mapa se actualiza
```

## Reglas del Conductor

- Solo puede tener 1 pedido activo a la vez
- Debe estar en estado `disponible` para ser asignado
- Puede rechazar una asignación (vuelve a la cola)
- El dispatcher puede reasignar en cualquier momento

**Relacionado:** [[modules/delivery/delivery]] · [[modules/orders/orders]]

---

← [[flows/inventory-flow]] | [[DAIMUZ]]
