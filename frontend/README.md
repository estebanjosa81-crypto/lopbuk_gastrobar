# Lopbuk — Frontend

Frontend de la plataforma **Lopbuk**: Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS.  
Interfaces por rol: admin, cajero, mesero, cocinero, bartender, vendedor, conductor, despachador.

---

## Requisitos

- Node.js 18+
- Backend corriendo en `http://localhost:3001`

---

## Instalación

```bash
cd frontend
npm install
npm run dev   # → http://localhost:3000
```

---

## Variables de Entorno (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Google OAuth (opcional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...

# Cloudinary (subida de imágenes, opcional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...

# Stripe (pagos públicos, opcional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo Next.js |
| `npm run build` | Build de producción |
| `npm start` | Servidor de producción |
| `npm run lint` | ESLint |

---

## Estructura

```
frontend/
├── app/                    → Next.js App Router (páginas y rutas)
│   ├── page.tsx            → Raíz: login / routing por rol
│   ├── links/[slug]/       → Vista pública de tienda
│   ├── menu/               → Menú digital público
│   ├── pos/                → POS embebido
│   ├── reservations/       → Reservas públicas
│   ├── s/                  → Storefront público
│   └── scanner/            → Escáner de código de barras
│
├── components/             → 70+ componentes por módulo
│   ├── ui/                 → Componentes base shadcn/ui
│   └── ...                 → Ver components/INDEX.md
│
└── lib/                    → Estado, API, tipos y config
    └── ...                 → Ver lib/INDEX.md
```

**Ver:** [`components/INDEX.md`](components/INDEX.md) — lista completa de componentes.  
**Ver:** [`lib/INDEX.md`](lib/INDEX.md) — descripción de stores, API service y tipos.  
**Ver:** [`../daimuz/architecture/frontend.md`](../daimuz/architecture/frontend.md) — mapa detallado del frontend.

---

## Stack

| Tecnología | Uso |
|---|---|
| Next.js 16 (App Router) | Framework principal |
| React 19 | UI |
| TypeScript 5 | Tipado |
| Tailwind CSS | Estilos |
| shadcn/ui | Componentes base (Radix UI) |
| Zustand 5 | Estado global |
| Socket.io-client | Tiempo real |
| Recharts | Gráficos |
| Sonner | Toasts / notificaciones |
| React Hook Form + Zod | Formularios y validación |
| Lucide React | Iconos |
| next-themes | Dark / light mode |

---

## Roles y Paneles

| Rol | Panel principal |
|---|---|
| `superadmin` | `superadmin-home.tsx` |
| `admin` | Acceso a todos los módulos |
| `cajero` | `cajero-panel.tsx` |
| `cocinero` | `cocinero-panel.tsx` |
| `bartender` | `bartender-panel.tsx` |
| `mesero` | `mesero-panel.tsx` |
| `vendedor` | `vendedores-panel.tsx` |
| `driver` | `driver-panel.tsx` |
| `dispatcher` | `dispatch-panel.tsx` |
| `cliente` | Vista de tienda y pedidos |

---

## Convenciones

- **Auth:** token JWT en memoria (`auth-store.ts`) + httpOnly cookie automática
- **API calls:** siempre a través de `lib/api.ts` (clase `ApiService`)
- **Estado global:** Zustand en `lib/store.ts` (productos, carrito, ventas, clientes...)
- **Módulos activables:** configurados por tenant en `lib/modules.ts`
- **Componentes UI base:** solo en `components/ui/` (shadcn), nunca reinventar botones/inputs
