# 🧩 Variants (compressed)

Variantes color/talla con stock propio, precio escalonado y kardex por variante.

**Tablas:** `product_variants`, `variant_price_tiers`, `inventory_movements`

**Endpoints:**
```
GET/POST /products/:id/variants
PUT/DELETE /variants/:id
PATCH /variants/:id/stock
GET/POST /variants/:id/price-tiers
PUT/DELETE /price-tiers/:id
POST /variants/:id/resolve-price
POST /products/variants/import
```

**Reglas clave:**
- UPDATE stock atómico: `WHERE stock >= ?` (race condition safe)
- Price tiers con solo `min_qty` (sin `max_qty` ni gaps)
- `ORDER BY min_qty DESC LIMIT 1 WHERE min_qty <= ?`
- Precios congelados en sale_items/order_items — nunca leer de tiers para históricos
- `inventory_movements` = fuente de verdad del stock por variante
- `tenant_id` en variants, tiers y movements
- CSV normalizado: Handle → Product → Variants (bulk insert)

**Dependencias:** products, inventory, sales, storefront, suppliers.

---

← [[variants]] | [[DAIMUZ]]
