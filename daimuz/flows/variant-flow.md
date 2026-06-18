# 🌊 Flujo de Variantes — Variant Lifecycle

> Ciclo completo desde la importación del catálogo hasta la venta y auditoría.

---

## 1. Importación (CSV → DB)

```
CSV de SE Sport (429 productos)
  │
  ▼
import.service.ts
  │  Agrupa por "Handle" (product slug)
  │  Crea products si no existen
  │  Bulk insert en product_variants
  │  Crea tiers por defecto (1, 6, 12, 24+ uds.)
  │  Asigna supplier_id = SE Sport
  ▼
product_variants pobladas con stock real por color
```

## 2. Exhibición (Storefront)

```
Storefront carga productos publicados
  │
  ▼
Por cada producto:
  ├── ¿Tiene variantes activas con stock > 0?
  │     Sí → Muestra producto con selector de variante
  │     No → Muestra como producto simple (stock del producto)
  │
  ▼
Selector de variante:
  ├── Chips de color (solo colores con stock > 0)
  ├── Selector de talla si aplica
  ├── Badge "Mejor precio a partir de 6 uds."
  └── Precio se actualiza en tiempo real según cantidad + tier
```

## 3. Compra (Checkout / POS)

```
Cliente elige:
  ├── Variante (ej: Body Siso Negro, Talla M)
  └── Cantidad (ej: 3 unidades)
       │
       ▼
resolvePrice(variantId=abc, qty=3, tenantId=xyz)
  │
  ├── Busca tier con min_qty <= 3 ORDER BY min_qty DESC
  │     → Encuentra tier con min_qty=1, price=45.000, margin=15%
  │     → Retorna { price: 45000, marginPct: 15, source: 'tier' }
  │
  └── Si no hay tier → usa price_override o sale_price del producto
       │
       ▼
Stock:
  ├── UPDATE product_variants SET stock = stock - 3 WHERE id = 'abc' AND stock >= 3
  ├── Si affectedRows === 0 → error "Stock insuficiente"
  └── INSERT INTO inventory_movements (variant_id, product_id, type='venta', quantity=-3, ...)
       │
       ▼
Sale Item (congelado):
  ├── variant_id, product_name, sku
  ├── price: 45000 (congelado del tier)
  ├── cost_price: 30000 (congelado de product_variants)
  ├── margin_pct: 15 (congelado del tier)
  └── margin_amount: 15000 (calculado al vender)
```

## 4. Post-Venta (Auditoría)

```
Reportes financieros:
  └── NUNCA leer variant_price_tiers para ventas pasadas
  └── SIEMPRE leer sale_items (datos congelados)

Auditoría de stock:
  └── inventory_movements tiene el ledger completo
  └── SUM(quantity) WHERE variant_id = ? = stock actual (verificación)

Reporte proveedor:
  └── SUM(ventas) por variante agrupado por supplier_id
  └── Ganancia real = SUM(sale_items.margin_amount)
```

---

## Diagrama de estado de una variante

```
Importada → Activa (stock > 0) → En venta (stock decrece)
                                        │
                          ┌─────────────┴─────────────┐
                          ▼                           ▼
                    Sin stock (stock = 0)        Stock bajo (stock <= min_stock)
                          │                           │
                          └─────────────┬─────────────┘
                                        ▼
                                  Reabastecimiento
                                        │
                                        ▼
                                  Activa (stock > 0)
```

---

← [[../modules/variants/variants]] | [[DAIMUZ]]
