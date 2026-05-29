# stripe — compressed

> 5 líneas. Módulo sin doc completo aún.

- **Qué hace**: maneja el webhook de Stripe y crea PaymentIntents para pagos online del storefront
- **Webhook**: `POST /api/stripe/webhook` — verifica firma con `STRIPE_WEBHOOK_SECRET` → despacha eventos al handler correcto
- **Eventos críticos**: `invoice.payment_succeeded` → renueva suscripción · `customer.subscription.deleted` → desactiva plan · `payment_intent.succeeded` → confirma pago storefront
- **Separación**: `stripe` maneja el transporte del pago; `subscriptions` maneja la lógica de negocio del plan — NO mezclar
- **Archivos**: `stripe.service.ts`, `stripe.controller.ts`, `stripe.routes.ts` · Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` · Ver: [[modules/subscriptions/compressed]]

---

← [[DAIMUZ]] | [[indexes/modules-index]]
