# 🍳 Sinapsis: Cadena Gastrobar

> Dependencias del ecosistema gastronómico. Cada cambio puede tener efecto cascada.

## Flujo: Receta → Producción → Inventario → Food Cost

```
recipes (BOM: ingredientes × cantidad × costo)
    │
    ├──► calculateFoodCost()
    │         └──► products.cost (precio actual del ingrediente)
    │                   └──► CUIDADO: si cost cambia → food cost cambia automático
    │
    └──► producción de receta
              │
              ▼
    inventory.addMovement(type: 'salida', reason: 'receta')
              │
              └──► products.stock -= cantidad_ingrediente
```

## Flujo: Merma → Inventario → Costo

```
merma.service.registerWaste()
    ├──► waste_records INSERT (tipo, motivo, área, responsable, costo)
    └──► inventory.addMovement(type: 'merma')
              └──► products.stock -= quantity
```

## Flujo: PAR Level → Alertas → Compras

```
par_levels (stock_minimo deseado por producto)
    │
    ├──► gastrobar-ops/purchase-suggestions
    │         └──► WHERE products.stock < par_levels.par_level
    │                   → genera lista de compra sugerida
    │
    └──► merma.par.levels dashboard
              └──► stock_gap = par_level - stock_actual
```

## Flujo: Restbar → Pedido → Cocina/Barra → Cobro

```
mesero (mesero-panel.tsx)
    │
    ▼
POST /api/restbar/orders  { table_id, items }
    │
    ├──► socket.emit('new-order', order)  → cocina + barra reciben en tiempo real
    │
    └──► cocina/barra cambia estado: pendiente → en_preparacion → listo
              │
              └──► socket.emit('order-status', {id, status})
                        │
                        └──► mesero ve "LISTO" en su panel
                                  │
                                  └──► cajero cierra mesa → POST /api/sales
```

## Impacto por Cambio

### Si cambias `products.cost`
- ⚠️ food cost de TODAS las recetas que usen ese producto cambia inmediatamente
- ✅ Revisar: `gastrobar-ops/food-cost` puede pasar de OK a DANGER sin tocar recetas

### Si cambias `recipes.service.ts`
- ⚠️ Afecta: `gastrobar-ops` (food cost %), `inventory` (descuento al producir), `pos` (precio final)
- ✅ Verificar: BOM usa IDs de productos activos, calcular cost en tiempo real

### Si cambias `merma.service.ts`
- ⚠️ Afecta: `inventory` (descuenta stock), `gastrobar-ops` (reporte % merma), `finances` (costo de merma)
- ✅ Verificar: motivo obligatorio, tenant_id, responsable registrado

### Si cambias estados de `restbar`
- ⚠️ Socket.io depende de los nombres exactos de los estados
- ✅ Verificar: cocinero-panel.tsx, bartender-panel.tsx, mesero-panel.tsx usan mismos strings

## Flujo: RestBar Finanzas (tracker P&L)

```
rb_gastos (gastos variables, auto-timestamp servidor)
rb_ingresos_diarios (upsert por tenant+fecha)
rb_gastos_fijos (recurrentes: quincenal/semanal/mensual)
    │
    └──► GET /api/restbar/finanzas/resumen
              └──► ganancia_neta = ventas - gastos_var - gastos_fijos_prorrateados
```

> ⚠️ Los ingresos aquí son MANUALES — no se sincronizan con `sales` automáticamente.

## Rangos de Food Cost

| Área | OK | ⚠️ Warning | 🚨 Danger |
|---|---|---|---|
| Cocina | < 35% | 35–40% | > 40% |
| Barra | < 28% | 28–33% | > 33% |

---

**Módulos de esta cadena:** [[modules/gastrobar-ops/gastrobar-ops]] · [[modules/recipes/recipes]] · [[modules/inventory/inventory]] · [[modules/merma/merma]] · [[modules/purchases/purchases]] · [[modules/restbar-finanzas/restbar-finanzas]] · [[modules/orders/orders]]

← [[synapses/ops-chain]] | [[DAIMUZ]] | → [[synapses/delivery-chain]]
