# storefront — compressed

> 5 líneas. Si necesitas más → lee `storefront.md`

- **URLs públicas** (sin auth): `/links/[slug]` tienda · `/menu/[slug]` menú gastrobar · `/reservar/[slug]` reservas · `/s/[slug]/[section]` secciones custom
- **SSR**: todas las páginas públicas son server-side render para SEO. El checkout es cliente.
- **Pedido online**: POST /api/storefront/:slug/order → crea order 'pendiente' → socket al panel del negocio → flujo delivery
- **Reglas**: productos con stock=0 no aparecen · slug único global · precios online pueden diferir del POS
- **Archivos**: `storefront.service.ts`, `StoreBuilder.tsx`, `landing-page.tsx`, `app/links/[slug]/page.tsx`, `CheckoutView.tsx`

---

← [[DAIMUZ]] | → [[modules/storefront/storefront]]
