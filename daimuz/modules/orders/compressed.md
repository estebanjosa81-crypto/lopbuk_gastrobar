# orders — compressed

> 5 líneas. Si necesitas más → lee `orders.md`

- **Estados**: pendiente → aceptado → en_preparacion → listo → despachado → entregado (unidireccional) | cancelado
- **Socket.io**: new-order → cocina/barra en tiempo real. order-status → todos los paneles.
- **Mesa vs Delivery**: restbar crea en `/restbar/orders`, delivery en `/orders` + `/delivery/assign`
- **Regla crítica**: estados no se pueden retroceder. Cancelados son inmutables con razón.
- **Archivos**: `orders.service.ts`, `restbar.service.ts`, `pedidos.tsx`, `cocinero-panel.tsx`, `bartender-panel.tsx`

---

← [[DAIMUZ]] | → [[modules/orders/orders]]
