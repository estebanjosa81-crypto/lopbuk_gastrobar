# finances — compressed

> 5 líneas. Si necesitas más → lee `finances.md`

- **Flujo de caja**: ingresos (ventas cobradas) + egresos (compras, gastos manuales) = balance. Los fiados NO son ingreso hasta cobro real.
- **Auto-alimentado**: cierres de caja → alimentan flujo automáticamente. Compras confirmadas → generan egreso.
- **Stripe**: webhooks actualizan suscripciones automáticamente (created → renovado → eliminado)
- **Acceso**: solo `admin`. El flujo de caja es de solo lectura para otros roles.
- **Archivos**: `finances.service.ts`, `stripe.service.ts`, `subscriptions.service.ts`, `finances.tsx`

---

← [[DAIMUZ]] | → [[modules/finances/finances]]
