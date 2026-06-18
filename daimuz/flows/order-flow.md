# 📋 Flujo: Pedido Completo

## Estados

```
pendiente → aceptado → en_preparacion → listo → despachado → entregado
                                                           ↘ cancelado
```

## Pedido en Mesa (RestBar)

```
Mesero abre mesa
  → Agrega ítems (con modificaciones)
    → POST /api/restbar/orders → 'pendiente'
      → Socket emite a cocina Y barra (por área)
        → Cocina/Bartender ve el pedido
          → Cambia a 'en_preparacion'
            → Cambia a 'listo'
              → Mesero notificado
                → Lleva a la mesa
                  → Cierra comanda → genera venta (POS)
```

## Pedido Online (Storefront)

```
Cliente en /s/[slug]
  → Agrega al carrito (local)
    → Checkout: datos + dirección
      → POST /api/storefront/[slug]/order
        → Admin/Dispatcher ve el pedido
          → Acepta + asigna conductor (si delivery)
            → Driver recibe asignación (Socket)
              → Driver: en_camino → entregado
```

**Relacionado:** [[modules/orders/orders]] · [[modules/delivery/delivery]] · [[modules/gastrobar-ops/gastrobar-ops]]

---

← [[flows/sale-flow]] | [[DAIMUZ]] | → [[flows/inventory-flow]]
