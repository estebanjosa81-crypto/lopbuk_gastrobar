# Sinapsis: Cadena Proveedor

> Si modificas cualquier nodo, estos son los efectos secundarios garantizados.

## Flujo: Proveedor > Variantes > Precios > Ventas > Liquidacion

```
suppliers (alta del proveedor)
    |
    v
supplier_products (asocia productos con costo/lead time)
    |
    v
products (producto base)
    |
    v
product_variants (variante con stock, sku, cost_price, supplier_id)
    |
    v
variant_price_tiers (tiers de precio por cantidad)
    |
    v
storefront / POS (cliente elige variante + cantidad)
    |
    v
price-tier.service.resolvePrice() (calcula precio segun qty)
    |
    v
sale_items INSERT (PRECIOS CONGELADOS: price, cost_price, margin_pct)
    |
    v
inventory_movements INSERT (type: 'salida' / variant_id)
    |
    v
product_variants UPDATE stock = stock - qty (condicional)
    |
    v
calculo liquidacion: price - (price * margin_pct / 100) = pago al proveedor
```

## Impacto por Cambio

### Si cambias `variants.service.ts`
- Afecta: products (stock agregado), inventory (inventory_movements), sales (sale_items congelados), storefront (variantes visibles), price-tiers (resolvePrice)
- Verificar: UPDATE stock condicional, tenant_id correcto, supplier_id opcional

### Si cambias `price-tier.service.ts`
- Afecta: variants (resolvePrice llamado desde POS y storefront), sales (precio en sale_items), storefront (precio mostrado al cliente)
- Verificar: ORDER BY min_qty DESC, sin max_qty, fallback a price_override o base_price

### Si cambias `suppliers.service.ts`
- Afecta: variants (supplier_id en variantes), purchases (ordenes de compra), inventory (costo del proveedor)
- Verificar: supplier_products N:N, is_preferred, cost_price independiente de sale_price

### Si cambias `import.service.ts`
- Afecta: products (creacion), variants (creacion masiva), suppliers (asignacion)
- Verificar: agrupacion por Handle, bulk insert, transaccion atomica

## Regla de Oro de Esta Cadena

```
NO hay venta de variante sin:
  1. UPDATE stock condicional (race condition safe)
  2. price congelado en sale_items (nunca leer tiers para historico)
  3. tenant_id correcto en variant, tier, inventory_movement, sale_item
  4. supplier_id opcional pero registrado si existe
```

## Modulos de esta cadena
[[modules/variants/variants]] . [[modules/suppliers/suppliers]] . [[modules/products/products]] . [[modules/sales/sales]] . [[modules/inventory/inventory]] . [[modules/storefront/storefront]]

<- [[DAIMUZ]] | -> [[synapses/delivery-chain]]
