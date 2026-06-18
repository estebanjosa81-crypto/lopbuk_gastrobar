# sales — compressed

> 5 líneas. Si necesitas más → lee `sales.md`

- **Flujo**: POS llama `createSale()` → verifica caja activa → verifica stock todos los ítems → INSERT sales+sale_items → genera stock_movements 'salida' → si efectivo: suma a cash_session → socket evento dashboard
- **Body POST**: `{ items[{productId, quantity, discount, customAmount}], paymentMethod, amountPaid, globalDiscount, customerId, applyTax, sedeId }`
- **Inmutable**: las ventas no se editan. Solo `PATCH /sales/:id/cancel` con razón obligatoria. Queda en auditoría.
- **Fiado**: si `paymentMethod='fiado'` requiere cliente + cupo disponible → crea registro en `credits`
- **Archivos**: `sales.service.ts`, `sales-history.tsx`, `daily-closing-report.tsx`

---

← [[DAIMUZ]] | → [[modules/sales/sales]]
