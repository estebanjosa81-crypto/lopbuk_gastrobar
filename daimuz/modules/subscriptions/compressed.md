# subscriptions — compressed

> 5 líneas. Si necesitas más → lee `subscriptions.md`

- **Planes**: Free (POS+inventario) · Básico (+clientes+finanzas) · Pro (+delivery+storefront+gastrobar) · Enterprise (todo)
- **Ciclo**: checkout Stripe → webhook `invoice.payment_succeeded` → activa plan → módulos disponibles → renovación mensual auto
- **Vencimiento**: 7 días de gracia tras vencer → luego solo lectura
- **Webhooks Stripe que importan**: `subscription.created`, `invoice.payment_succeeded`, `subscription.deleted`
- **Archivos**: `subscriptions.service.ts`, `stripe.service.ts`. La suscripción activa controla `tenant_modules`.

---

← [[DAIMUZ]] | → [[modules/subscriptions/subscriptions]]
