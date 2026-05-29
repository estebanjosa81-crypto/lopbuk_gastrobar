# purchases — compressed

> 5 líneas. Si necesitas más → lee `purchases.md`

- **Estados**: borrador → confirmada → recibida → cancelada. El stock SOLO entra al confirmar, no al crear.
- **Al confirmar**: POST /api/purchases/:id/confirm → por cada item: stock_movement 'entrada' + UPDATE products.stock + UPDATE products.cost al nuevo precio
- **Cuidado**: compra cancelada después de confirmada NO revierte el stock automáticamente → requiere ajuste manual
- **Sourced from**: PAR levels de gastrobar-ops sugieren qué productos comprar y en qué cantidad
- **Archivos**: `purchases.service.ts`, `purchases.routes.ts`, `purchase-invoices.tsx`

---

← [[DAIMUZ]] | → [[modules/purchases/purchases]]
