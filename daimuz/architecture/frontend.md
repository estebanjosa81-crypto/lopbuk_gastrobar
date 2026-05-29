# 🖥️ Arquitectura Frontend

**Stack:** Next.js 16 · React 19 · Tailwind CSS · Zustand 5 · shadcn/ui · Socket.io-client

## Estructura de Carpetas

```
frontend/
├── app/                            → App Router (rutas URL)
│   ├── layout.tsx                  → Root layout
│   ├── page.tsx                    → Entrada principal (app de gestión)
│   ├── portfolio/                  → Portafolio público de la marca
│   ├── links/[slug]/               → Tienda online pública del tenant
│   ├── menu/[slug]/                → Menú digital gastrobar (QR)
│   ├── reservar/[slug]/            → Reservas online  ← NO "reservations/"
│   ├── inmobiliaria/[slug]/        → Portal inmobiliario público
│   ├── s/[storeSlug]/[sectionSlug]/→ Secciones HTML personalizadas
│   └── scanner-remote/[sessionId]/ → Escáner remoto vía móvil  ← NO "scanner/"
│
├── components/                     → 88 componentes por módulo
│   └── ui/                         → shadcn/ui base (button, input, etc.)
│
└── lib/                            → Lógica central
    ├── api.ts              → HTTP service (clase ApiService)
    ├── store.ts            → Estado global (Zustand)
    ├── auth-store.ts       → Estado de auth
    ├── types.ts            → Interfaces TypeScript
    ├── modules.ts          → Config módulos activables (sidebar dinámico)
    ├── socket.ts           → WebSocket client
    ├── product-config.ts   → Presets de campos por tipo de industria
    └── utils.ts            → Helpers de formato y URL
```

## Capas de la App

```
┌─────────────────────────────────────┐
│  COMPONENTES REACT (presentación)   │
│  solo muestran y capturan input     │
├─────────────────────────────────────┤
│  ZUSTAND STORE (estado global)      │
│  store.ts + auth-store.ts           │
├─────────────────────────────────────┤
│  API SERVICE (comunicación)         │
│  api.ts → fetch → Express           │
└─────────────────────────────────────┘
```

## Páginas públicas vs App privada

| Tipo | Ruta real | Renderizado |
|---|---|---|
| Tienda online / landing | `/links/[slug]` | SSR (SEO) |
| Menú digital gastrobar | `/menu/[slug]` | SSR (SEO) |
| Reservas online | `/reservar/[slug]` | SSR (SEO) |
| Portal inmobiliaria | `/inmobiliaria/[slug]` | SSR (SEO) |
| Sección custom storefront | `/s/[slug]/[section]` | SSR (SEO) |
| Portafolio de la marca | `/portfolio` | SSR (SEO) |
| Escáner remoto | `/scanner-remote/[id]` | CSR |
| App de gestión | `/` (autenticado) | SPA/CSR |

## Estado Global (Zustand store.ts)

El store principal contiene:
- **Products** — catálogo + CRUD
- **Cart** — carrito local del POS
- **Sales** — historial de ventas
- **Customers** — CRM
- **Categories** — categorías
- **StockMovements** — kardex
- **Sedes** — sucursales
- **StoreInfo** — config del negocio
- **UI** — loading states, modales abiertos

## Sidebar dinámico

El `sidebar.tsx` se genera según:
1. El **rol** del usuario (cajero solo ve ventas, admin ve todo)
2. Los **módulos activos** del tenant (si no tiene delivery, no aparece)

---

← [[architecture/overview]] | [[DAIMUZ]] | → [[architecture/backend]]
