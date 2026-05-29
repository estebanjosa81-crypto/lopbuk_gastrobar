# Lopbuk — Backend API

Backend modular de la plataforma **Lopbuk**: Node.js + Express + TypeScript + MySQL2.  
Arquitectura en 40+ módulos con patrón `routes → controller → service`.

---

## Requisitos

- Node.js 18+
- MySQL 8.0+ o MariaDB 10.5+

---

## Instalación

```bash
# 1. Instalar dependencias
cd backend
npm install

# 2. Crear archivo .env (ver sección Variables de Entorno)

# 3. Cargar el schema de base de datos
mysql -u root -p < inventarioEsteban_v3_multitenant.sql

# 4. Iniciar en modo desarrollo
npm run dev
```

---

## Variables de Entorno (`backend/.env`)

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=lopbuk_db

JWT_SECRET=cambiar_en_produccion
JWT_EXPIRES_IN=24h

CORS_ORIGIN=http://localhost:3000
API_PREFIX=/api

# Stripe (pagos online)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Desarrollo con hot-reload (ts-node-dev) |
| `npm run build` | Compilar TypeScript → `/dist` |
| `npm start` | Ejecutar build compilado |
| `npm run lint` | ESLint |

---

## Estructura

```
backend/src/
├── config/
│   ├── env.ts              → Variables de entorno tipadas
│   └── database.ts         → Pool MySQL2 (connectionLimit: 10)
│
├── common/
│   ├── middleware/         → auth.middleware.ts (verifyToken, requireRole)
│   └── types/              → Tipos compartidos (User, JWTPayload, UserRole)
│
├── utils/
│   └── crypto.ts           → Encriptación de datos sensibles
│
└── modules/                → 40+ módulos (ver src/modules/INDEX.md)
    ├── [modulo]/
    │   ├── [modulo].routes.ts
    │   ├── [modulo].controller.ts
    │   └── [modulo].service.ts
    └── index.ts             → Registro de todos los módulos
```

**Ver:** [`src/modules/INDEX.md`](src/modules/INDEX.md) — lista completa de módulos por área.  
**Ver:** [`../daimuz/architecture/backend.md`](../daimuz/architecture/backend.md) — arquitectura detallada del backend.  
**Ver:** [`../daimuz/vault/api-routes.md`](../daimuz/vault/api-routes.md) — todos los endpoints REST.

---

## Módulos principales

| Área | Módulos |
|---|---|
| Auth y Usuarios | `auth` · `users` · `tenants` |
| Inventario | `products` · `inventory` · `categories` · `merma` · `recipes` · `scanner` |
| Ventas | `sales` · `cash-sessions` · `orders` · `purchases` · `coupons` |
| Clientes | `customers` · `credits` · `reviews` |
| Gastrobar | `restbar` · `gastrobar-ops` · `novedades` · `cargos` |
| Finanzas | `finances` · `stripe` · `subscriptions` |
| Delivery | `delivery` · `fleet` · `vendedores` |
| Digital | `storefront` · `portfolio` · `services` · `media-library` |
| Analytics | `dashboard` · `sync` |
| IA y Comms | `agent` · `chatbot` · `whatsapp` |
| Verticales | `realestate` · `workorders` · `sedes` · `printers` |

---

## Convenciones

- **Auth:** JWT en header `Authorization: Bearer <token>` + httpOnly cookie
- **Multi-tenant:** `tenant_id` en todas las tablas relevantes
- **Nomenclatura:** snake_case en DB, camelCase en TypeScript
- **Patrón respuesta:**
  ```json
  { "success": true, "data": { ... } }
  { "success": false, "error": "mensaje" }
  ```
- **Transacciones:** toda operación de escritura múltiple usa `beginTransaction / commit / rollback`
- **Errores controlados:** `throw new AppError('mensaje', statusCode)`

---

## Base URL

```
http://localhost:3001/api
```

Autenticación en todos los endpoints (salvo `/auth/login`, `/auth/register`):  
`Authorization: Bearer <jwt_token>`
