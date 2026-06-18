# ⚡ Products — Compressed

## Modelo
```
products (plantilla) → product_variants (stock, costo, color/talla) → variant_price_tiers (min_qty, price, margin)
```

## Tablas nuevas
| Tabla | Propósito |
|---|---|
| `product_variants` | Stock individual, SKU, cost_price, price_override, supplier_id |
| `variant_price_tiers` | Precios por volumen (min_qty solo, sin max_qty) |
| `inventory_movements` | Kardex por variant_id (reemplaza stock_movements) |

## Rules
1. Stock atómico: `UPDATE SET stock = stock - ? WHERE id = ? AND stock >= ?`
2. Precio: tier con `min_qty <= cantidad` → `ORDER BY min_qty DESC LIMIT 1`
3. `order_items` congela: product_name, sku, unit_price, cost_price, margin_pct, margin_amount
4. `tenant_id` en variants y movements (no en tiers)

## Endpoints
```
GET    /products/:id/variants      → lista variantes
POST   /variants                   → crea variante
PUT    /variants/:id               → actualiza
DELETE /variants/:id               → soft delete
POST   /variants/:id/adjust-stock  → movimiento atómico
GET    /variants/:id/price-tiers   → lista tiers
POST   /variants/:id/price-tiers   → crea tier
DELETE /price-tiers/:id            → elimina tier
POST   /variants/resolve-price     → { variantId, qty } → { price, marginPct }
```

## Sprints
| Sprint | Qué |
|---|---|
| 1 | Schema DB + migración |
| 2 | Backend CRUD + price-tier service + import CSV |
| 3 | Frontend POS + storefront + admin tiers |
| 4 | Panel proveedor + márgenes |

→ [[modules/products/products]]
