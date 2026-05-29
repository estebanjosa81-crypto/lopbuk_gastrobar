# 📦 Flujo: Inventario y Stock

## Movimiento de Stock

```
Cualquier movimiento de stock:
  → Inserta en stock_movements (kardex)
  → UPDATE products.stock += delta
  → Si stock < stock_minimo → alerta
```

## Tipos de Movimiento y su origen

| Tipo | Origen | Quién lo genera |
|---|---|---|
| `entrada` | Compra proveedor | Módulo purchases |
| `salida` | Venta | Módulo sales (automático) |
| `ajuste` | Corrección manual | Admin via inventory |
| `merma` | Pérdida/daño | Staff via merma.tsx |
| `transferencia` | Entre sedes | Admin via inventory |

## Flujo de Compra → Stock

```
POST /api/purchases (nueva compra)
  → Inserta en purchases + purchase_items
  → Por cada ítem: stock_movement tipo 'entrada'
  → UPDATE products.stock += quantity
```

## Flujo de Venta → Stock (automático)

```
POST /api/sales
  → Por cada sale_item:
    → Verifica stock >= quantity (si no → error)
    → stock_movement tipo 'salida'
    → UPDATE products.stock -= quantity
```

## Flujo de Receta → Stock

```
Producir receta:
  → Por cada ingrediente de la receta:
    → stock_movement tipo 'salida'
    → UPDATE products.stock -= (cantidad_receta × porciones)
```

## Niveles PAR y Alertas

```
stock_actual < stock_minimo
  → Alerta visible en dashboard
  → Aparece en gastrobar-ops/par
  → Sistema sugiere cantidad de reorden
```

**Relacionado:** [[modules/inventory/inventory]] · [[modules/sales/sales]] · [[modules/gastrobar-ops/gastrobar-ops]]

---

← [[flows/order-flow]] | [[DAIMUZ]] | → [[flows/delivery-flow]]
