# 🕸️ Sinapsis — Variants Chain

> Cadena de impacto del módulo Variants en el ecosistema Lopbuk.

---

## Cadena principal

```
[Variants]
   │
   ├──→ [Products] — product_id FK, el producto padre
   │
   ├──→ [Sales / Sale Items] — congelan variant_id, price, cost, margin al vender
   │     └──→ [Finances] — el margen real afecta los reportes financieros
   │
   ├──→ [Inventory / Stock Movements] — inventory_movements como ledger
   │     └──→ [Purchases] — reabastecimiento por variante
   │
   ├──→ [Storefront] — expone variantes con stock > 0, resuelve precio por tiers
   │     └──→ [Orders] — storefront_orders usan variant_id
   │           └──→ [Delivery] — picking por variante
   │
   ├──→ [POS] — selector de variante al elegir producto
   │
   └──→ [Dashboard] — KPIs de ventas por variante, stock bajo, margen real
```

---

## Matriz de Impacto

| Si cambias Variants... | Afecta a... | Tipo de impacto |
|---|---|---|
| Agregas variante a producto | Storefront (nuevo option), Inventory (nuevo stock) | Aditivo |
| Eliminas variante (is_active=0) | Storefront (deja de mostrar), POS (no seleccionable) | Visual |
| Cambias precio de tier | Sale items futuros (históricos congelados) | Comercial |
| Cambias cost_price | Reportes financieros (margen real) | Financiero |
| Descuentas stock (venta) | Inventory, Sales, Dashboard | Transaccional |
| Importas CSV | Products, Variants, Price Tiers | Masivo |

---

## Dependencias inversas (qué necesita Variants)

```
Para funcionar, Variants necesita:
  ├── products — el producto padre (sin producto no hay variante)
  ├── suppliers — opcional, para supplier_id
  └── tenants — multi-tenant obligatorio

Qué necesita a Variants:
  ├── POS — necesita selector de variante
  ├── Storefront — necesita mostrar variantes y resolver precio
  ├── Sales — necesita congelar datos de variante
  ├── Inventory — necesita inventory_movements
  ├── Purchases — necesita reabastecer por variante
  ├── Dashboard — necesita KPIs por variante
  └── Agent IA — necesita entender variantes en consultas
```

---

## Flujo transaccional crítico

```
POS/Storefront                   Variants Service                  DB
     │                                │                            │
     │  1. Elegir producto            │                            │
     │───────────────────────────────>│                            │
     │                                │  2. GET variantes (stock)  │
     │                                │───────────────────────────>│
     │                                │<───────────────────────────│
     │  3. Elegir variante + qty      │                            │
     │───────────────────────────────>│                            │
     │                                │  4. resolvePrice(qty)      │
     │                                │  (SELECT tier)             │
     │                                │───────────────────────────>│
     │                                │<───────────────────────────│
     │  <price, margin>               │                            │
     │<───────────────────────────────│                            │
     │                                │                            │
     │  5. Confirmar venta            │                            │
     │───────────────────────────────>│                            │
     │                                │  6. UPDATE stock (atómico) │
     │                                │───────────────────────────>│
     │                                │  7. INSERT inventory_mvt   │
     │                                │───────────────────────────>│
     │                                │  8. INSERT sale_item (frozen)│
     │                                │───────────────────────────>│
     │  Venta exitosa                 │                            │
     │<───────────────────────────────│                            │
```

---

← [[../modules/variants/variants]] | [[DAIMUZ]]
