# customers — compressed

> 5 líneas. Si necesitas más → lee `customers.md`

- **CRM**: nombre, email, teléfono, cédula, dirección, cupo de crédito, deuda actual, historial de compras
- **Fiado**: requiere cliente registrado. `credit_balance < credit_limit` para permitir venta. Pagos parciales permitidos.
- **Flujo fiado**: POS método 'fiado' → verifica cupo → venta → crea registro en `credits` → NO suma a caja → cobra luego con POST /api/credits/:id/payment
- **Importación**: bulk upload CSV desde `bulk-upload-customers-dialog.tsx`
- **Archivos**: `customers.service.ts`, `credits.service.ts`, `customers.tsx`, `credits.tsx`, `fiados.tsx`

---

← [[DAIMUZ]] | → [[modules/customers/customers]]
