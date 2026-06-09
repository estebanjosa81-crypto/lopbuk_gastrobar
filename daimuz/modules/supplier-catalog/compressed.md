# ⚡ Supplier Catalog (compressed)

**Productos con variantes (color/talla) + precios escalonados por volumen + importación proveedor.**

## Tablas
- `product_variants` — cada variante con stock, sku, cost_price, supplier_id
- `variant_price_tiers` — N filas por variante, cada una con `min_qty`, `price`, `tenant_margin_pct`

## Endpoints clave
```
GET /products/:id/variants           → lista variantes
POST /variants/:id/price-tiers       → crear tier
GET /variants/:id/price?qty=N        → resolvePrice()
POST /supplier-catalog/import        → subir CSV
```

## Reglas de negocio
- Stock atómico: `UPDATE SET stock = stock - X WHERE stock >= X` — race condition safe
- Precios congelados en sale_items al comprar (nunca leer de tiers para históricos)
- Solo variantes con stock > 0 en storefront
- tenant_id duplicado en tablas hijas para queries rápidas

## Dependencias
products · inventory · sales · storefront · pos · suppliers

---

← [[modules/supplier-catalog/supplier-catalog]] · [[DAIMUZ]]
