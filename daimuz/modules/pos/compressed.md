# pos — compressed

> 5 líneas. Si necesitas más → lee `pos.md`

- **Flujo**: caja abierta → buscar producto → carrito (Zustand) → descuentos → método pago → POST /api/sales
- **Split bill**: cajero activa división de cuenta, elige N personas, sistema calcula monto por persona (Math.ceil(total/N))
- **Métodos**: efectivo · tarjeta · transferencia · nequi · daviplata · fiado · mixto
- **Regla crítica**: sin cash_session activa = bloqueado. Sin stock = bloqueado.
- **Archivos**: `point-of-sale.tsx`, `billing-pos.tsx`, `cajero-panel.tsx`, `store.ts` (cart)

---

← [[DAIMUZ]] | → [[modules/pos/pos]]
