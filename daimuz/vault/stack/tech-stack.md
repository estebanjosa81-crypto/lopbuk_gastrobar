# 🛠️ Tech Stack Detallado

## Frontend

### Next.js 16 (App Router)
- SSR para páginas públicas → SEO del [[modules/storefront/storefront]]
- CSR/SPA para la app de gestión
- App Router: layouts anidados, loading states, error boundaries
- Ver [[architecture/frontend]]

### React 19
- Concurrent features: `useTransition`, `useDeferredValue`
- Server Components para páginas públicas
- Nuevo compilador → mejor performance automática

### Tailwind CSS + shadcn/ui
- Utilidad → sin CSS custom en la mayoría de casos
- shadcn: componentes que son código propio (no librería)
- Ver [[brain/coding-standards]] para patrones de uso

### Zustand 5
- Estado global sin boilerplate → Ver [[decisions/state-management]]
- Dos stores: `store.ts` (app) + `auth-store.ts` (auth)
- Persist middleware para sessions

### Socket.io Client
- Tiempo real para [[modules/orders/orders]], [[modules/delivery/delivery]], [[modules/dashboard/dashboard]]
- Ver [[architecture/overview]] para los eventos

---

## Backend

### Express 4.21
- Framework minimalista: control total
- Alternativa considerada: NestJS → descartado por overhead

### TypeScript 5.5
- Tipos estrictos en services y controllers
- Interfaces para DB rows (extienden RowDataPacket)
- Ver [[brain/coding-standards]]

### MySQL2 3.11
- Queries directas sin ORM → Ver [[decisions/db-design]]
- Pool de conexiones
- Prepared statements → protección SQL injection

### JWT + bcryptjs
- Autenticación → Ver [[decisions/auth-approach]]
- Tokens firmados con HS256
- Passwords hasheados con salt 12

### Socket.io 4.7
- WebSockets bidireccionales
- Rooms por tenant para aislar eventos

---

## Servicios Externos
Ver [[vault/integrations]] para la configuración completa.

- **Stripe** → [[modules/subscriptions/subscriptions]] · [[modules/finances/finances]]
- **Google OAuth** → [[modules/auth/auth]]
- **WhatsApp** → [[modules/whatsapp/whatsapp]]
- **Cloudinary** → [[modules/storefront/storefront]]

---

← [[DAIMUZ]]
