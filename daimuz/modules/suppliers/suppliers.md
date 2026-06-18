# 🧩 Módulo: Suppliers

## Qué hace
Catálogo de proveedores y sus productos asociados. Cada proveedor puede tener múltiples productos, y cada producto puede tener múltiples proveedores (relación N:N). Permite configurar costo por proveedor, lead time y preferencia.

## Archivos del Módulo

**Backend:**
- `backend/src/modules/suppliers/suppliers.service.ts` — CRUD proveedores + supplier_products
- `backend/src/modules/suppliers/suppliers.controller.ts`
- `backend/src/modules/suppliers/suppliers.routes.ts`

## APIs

```
GET    /api/suppliers                      → lista del tenant
POST   /api/suppliers                      → crea proveedor
PUT    /api/suppliers/:id                  → actualiza
DELETE /api/suppliers/:id                  → soft delete

GET    /api/suppliers/:id/products         → productos de ese proveedor
POST   /api/suppliers/:id/products         → asocia producto con costo/lead time
PUT    /api/suppliers/products/:spid       → actualiza relación
DELETE /api/suppliers/products/:spid       → elimina relación
```

## Reglas Críticas

- `supplier_products` es N:N — un producto puede tener múltiples proveedores
- `supplier_id` en `product_variants` es opcional (variante puede no tener proveedor)
- El costo del proveedor (`cost_price`) es independiente del precio de venta
- `is_preferred` marca al proveedor principal para reorden automático

## Dependencias
- [[modules/products/products]] — productos
- [[modules/variants/variants]] — variantes con supplier_id
- [[modules/purchases/purchases]] — órdenes de compra a proveedores

---

← [[DAIMUZ]]
