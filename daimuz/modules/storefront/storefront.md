# 🌐 Módulo: Storefront

## Qué hace
La tienda online pública del negocio. Cada tenant tiene su propia URL (`/s/[slug]`), catálogo de productos, sistema de pedidos online y checkout completo.

## Archivos

**Backend:**
- `backend/src/modules/storefront/storefront.routes.ts`
- `backend/src/modules/portfolio/portfolio.routes.ts`
- `backend/src/modules/client/client.routes.ts`

**Frontend:**
- `frontend/components/tienda.tsx` — config de la tienda (admin)
- `frontend/components/StoreBuilder.tsx` — constructor visual
- `frontend/components/store-customization.tsx` — diseño
- `frontend/components/landing-page.tsx` — landing pública
- `frontend/app/s/` — ruta pública de la tienda
- `frontend/app/links/[slug]/` — links personalizados
- `frontend/app/menu/` — menú digital público
- `frontend/components/CheckoutView.tsx` — checkout del cliente
- `frontend/components/ModalExito.tsx` — confirmación de compra

## URLs Públicas por Tenant

```
/s/[slug]              → tienda online completa
/menu/[slug]           → menú digital (gastrobar)
/links/[slug]          → página de links (tipo Linktree)
/reservations/[slug]   → reservas públicas
```

## Flujo de Compra Online

```
1. Cliente visita /s/[mi-negocio]
2. Ve catálogo de productos (SSR para SEO)
3. Agrega al carrito (estado local)
4. Checkout: datos + dirección + método de pago
5. POST /api/storefront/[slug]/order
6. Backend crea pedido con estado 'pendiente'
7. Admin/Dispatcher ve el pedido en su panel
8. Si tiene delivery: flujo de [[modules/delivery/delivery]]
```

## APIs

```
GET  /api/storefront/:slug          → config pública de la tienda
GET  /api/storefront/:slug/products → catálogo público
POST /api/storefront/:slug/order    → crea pedido desde tienda

GET  /api/portfolio/:slug           → portafolio público
```

## Configuración de la Tienda

Cada tenant personaliza:
- Nombre, logo, colores, tipografía
- Productos visibles y precios online
- Métodos de pago disponibles
- ¿Delivery o solo pickup?
- Horarios de atención
- Redes sociales y links

## Reglas Críticas

- Los precios online pueden ser diferentes a los del POS
- Si un producto tiene `stock = 0` → no aparece en la tienda
- El slug es único globalmente en la plataforma
- Las páginas públicas son SSR (importante para SEO)

## Dependencias
- [[modules/inventory/inventory]] — stock visible en tienda
- [[modules/orders/orders]] — pedidos generados
- [[modules/delivery/delivery]] — si el pedido requiere delivery
- [[modules/customers/customers]] — registro/login del cliente

---

← [[DAIMUZ]]
