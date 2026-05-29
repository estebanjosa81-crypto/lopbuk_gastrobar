# ⚡ Sinapsis: Cadena Operativa

> Si modificas cualquier nodo, estos son los efectos secundarios garantizados.

## Flujo: POS → Venta → Inventario → Caja

```
cash-sessions (open)
    │
    ▼
pos (carrito + cobro)
    │
    ├──► sales.service.createSale()
    │         │
    │         ├──► stock_movements INSERT (type: 'salida')
    │         │         │
    │         │         └──► products UPDATE stock = stock - qty
    │         │                   │
    │         │                   └──► si stock < stock_minimo → ALERTA
    │         │
    │         ├──► sale_items INSERT
    │         │
    │         └──► si método = 'efectivo' → cash_movements INSERT
    │                         │
    │                         └──► cash_sessions calculado += monto
    │
    └──► cart.clearCart()  [frontend Zustand]
```

## Impacto por Cambio

### Si cambias `sales.service.ts`
- ⚠️ Afecta: `inventory` (descuento stock), `cash-sessions` (suma al calculado), `customers` (historial compras), `finances` (flujo de caja)
- ✅ Verificar: stock no queda negativo, cash_session_id válido, sale_items correctos

### Si cambias `inventory.service.ts`
- ⚠️ Afecta: `pos` (bloquea ventas sin stock), `gastrobar-ops` (food cost), `recipes` (costo ingredientes), `purchases` (stock entra aquí)
- ✅ Verificar: stock nunca < 0, movimiento tiene reason, tenant_id correcto

### Si cambias `cash-sessions.service.ts`
- ⚠️ Afecta: `sales` (necesitan session activa), `pos` (bloquea sin sesión), `dashboard` (estado de caja), `finances` (al cerrar alimenta flujo de caja)
- ✅ Verificar: solo 1 activa por sede, históricos inmutables

### Si cambias `products.service.ts`
- ⚠️ Afecta: `inventory` (kardex referencia product_id), `recipes` (BOM usa product_id + cost), `pos` (busca productos), `storefront` (muestra productos públicos)
- ✅ Verificar: soft delete con is_active, no borrar producto con movimientos

## Regla de Oro de Esta Cadena

```
NO hay venta sin:
  1. cash_session activa para esa sede
  2. stock >= quantity vendida
  3. tenant_id correcto en todos los registros
```

---

**Módulos de esta cadena:** [[modules/pos/pos]] · [[modules/sales/sales]] · [[modules/inventory/inventory]] · [[modules/cash-sessions/cash-sessions]] · [[modules/customers/customers]] · [[modules/dashboard/dashboard]]

← [[DAIMUZ]] | → [[synapses/gastrobar-chain]]
