# 🧩 Suppliers (compressed)

Catálogo de proveedores con relación N:N a productos.

**Tablas:** `suppliers`, `supplier_products`

**Endpoints:**
```
GET/POST /suppliers
PUT/DELETE /suppliers/:id
GET/POST /suppliers/:id/products
PUT/DELETE /suppliers/products/:spid
```

**Reglas:** supplier_id opcional en variantes, cost_price independiente de sale_price, is_preferred para reorden.

**Dependencias:** products, variants, purchases.

← [[DAIMUZ]] | → [[suppliers]]
