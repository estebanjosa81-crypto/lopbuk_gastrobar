# inventory — compressed

> 5 líneas. Si necesitas más → lee `inventory.md`

- **Kardex**: cada movimiento INSERT en `stock_movements` + UPDATE `products.stock`
- **Tipos**: entrada(+) · salida(-) · ajuste(±) · merma(-) · transferencia(- origen/+ destino)
- **Stock nunca < 0**: sistema bloquea. Todo movimiento requiere `reason` (auditoría obligatoria).
- **Alertas**: si `stock < stock_minimo` → alerta automática en dashboard y panel inventario
- **Archivos**: `inventory.service.ts`, `inventory-list.tsx`, `barcode-scanner.tsx`

---

← [[DAIMUZ]] | → [[modules/inventory/inventory]]
