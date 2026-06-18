# 🌊 Flujo: Proveedor → Plataforma → Cliente

> Flujo completo desde que SE Sport sube su catálogo hasta que el cliente compra y se liquida al proveedor.

## Diagrama

```
1. PROVEEDOR
   └── Sube CSV con: Handle, Product Name, Color, Size, SKU, Stock, Cost Price

2. IMPORTACIÓN (import.service.ts)
   ├── Agrupa rows por Handle (mismo producto, distintas variantes)
   ├── Crea/Normaliza products (uno por Handle)
   ├── Bulk insert en product_variants (una fila por variante)
   └── Asigna supplier_id a cada variante

3. CONFIGURACIÓN DE TIERS (admin)
   ├── Define escalones de precio por cantidad
   │   1 ud  → $45.000 (margin 10%)
   │   6 uds → $42.000 (margin 12%)
   │   12 uds → $39.000 (margin 15%)
   └── tenant_margin_pct = lo que gana Lopbuk como plataforma

4. STOREFRONT (cliente)
   ├── Producto se muestra con variantes (color/talla)
   ├── Solo variantes con stock > 0 son seleccionables
   ├── Badge: "Mejor precio a partir de 6 uds."
   ├── Cliente selecciona: color, talla, cantidad
   ├── price-tier.service.ts calcula precio automático
   └── Al hacer checkout → se descuenta stock (UPDATE condicional)

5. POST-VENTA
   ├── order_items congela: price, cost_price, margin_pct, margin_amount, sku
   ├── InventoryMovement registra la salida
   └── Pago al proveedor = price - (price × margin_pct / 100)

6. PANEL PROVEEDOR (Sprint 4)
   ├── Ver productos activos con stock
   ├── Ver ventas generadas
   └── Reportes de liquidación
```

## Reglas del Flujo

- El stock se descuenta con `UPDATE ... WHERE stock >= ?` — nunca hay sobreventa
- Los precios y márgenes se congelan al momento de la venta
- Los tiers usan solo `min_qty` — sin gaps ni solapamientos
- Si no hay tier aplicable → se usa `price_override` de la variante o `base_price` del producto

## Módulos involucrados
- [[modules/variants/variants]] — gestión de variantes
- [[modules/suppliers/suppliers]] — catálogo de proveedores
- [[modules/storefront/storefront]] — tienda online con variantes
- [[modules/sales/sales]] — ventas con precios congelados
- [[modules/inventory/inventory]] — inventory_movements

---

← [[DAIMUZ]]
