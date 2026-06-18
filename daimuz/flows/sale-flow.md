# 💸 Flujo: Venta Completa en POS

```mermaid
graph TD
    A[Cajero abre la app] --> B{¿Caja abierta?}
    B -->|No| C[Abre sesión de caja]
    B -->|Sí| D[Busca productos]
    C --> D
    D --> E[Agrega ítems al carrito]
    E --> F{¿Descuentos?}
    F -->|Por ítem| G[applyItemDiscount]
    F -->|Global| H[globalDiscount %]
    F -->|No| I[Selecciona pago]
    G & H --> I
    I --> J{Método de pago}
    J -->|Efectivo| K[Calcula cambio]
    J -->|Fiado| L{¿Cliente registrado?}
    J -->|Tarjeta/Transfer| M[Registra directo]
    L -->|No| N[Error: selecciona cliente]
    L -->|Sí| O{¿Tiene cupo?}
    O -->|No| P[Error: cupo excedido]
    O -->|Sí| Q[POST /api/sales]
    K & M --> Q
    Q --> R[Valida stock de cada ítem]
    R --> S[Inserta sale + sale_items]
    S --> T[Descuenta inventario]
    T --> U[Actualiza cliente si aplica]
    U --> V[Socket emit → dashboard]
    V --> W[✅ Venta completada]
    W --> X[Limpia carrito]
```

## Puntos Críticos

| Punto | Regla |
|---|---|
| Sin caja abierta | Bloquea todo |
| Stock insuficiente | Rechaza TODA la venta |
| Fiado sin cliente | No permitido |
| Cupo excedido | Bloquea crédito |

**Relacionado:** [[modules/pos/pos]] · [[modules/sales/sales]] · [[modules/inventory/inventory]]

---

← [[flows/auth-flow]] | [[DAIMUZ]] | → [[flows/order-flow]]
