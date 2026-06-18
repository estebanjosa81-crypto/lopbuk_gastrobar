# 🚀 Deployment y Entornos

## Entornos

| Entorno | Frontend URL | Backend URL | DB |
|---|---|---|---|
| Local | localhost:3000 | localhost:3001 | localhost:3306 (Docker) |
| Producción | Dokploy (dominio propio) | Dokploy (API subdomain) | MySQL managed |

## Plataforma de Deploy: Dokploy

> Lopbuk usa **Dokploy** para gestionar los servicios en producción.

```
Servicios en Dokploy:
  ├── lopbuk-frontend    → Next.js (puerto 3000)
  ├── lopbuk-backend     → Express (puerto 3001)
  ├── lopbuk-mysql       → MySQL 8 (puerto 3306)
  └── evolution-api      → Evolution API v2 (WhatsApp)
                           Repo: devalexcode/shell-evolution-api
                           ⚠️ PENDIENTE DE CONFIGURAR
```

---

## Variables de Entorno — Backend (`backend/.env`)

```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=stockpro_db          # nombre que crea inventarioEsteban_v3_multitenant.sql

# JWT
JWT_SECRET=string_muy_largo_aleatorio_aqui
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Evolution API v2 (WhatsApp) — ⚠️ pendiente configurar en Dokploy
EVOLUTION_API_URL=https://evo.tudominio.com
EVOLUTION_API_KEY=tu_authentication_api_key
API_BASE_URL=https://api.tudominio.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

PORT=3001
NODE_ENV=production
```

## Variables de Entorno — Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

---

## Docker — Desarrollo Local

```bash
# Levanta MySQL local en Docker
docker-compose -f docker-compose.dev.yml up -d
```

## Scripts de Arranque — Local

```bash
# Backend (desde raíz)
cd backend && npm run dev      # ts-node con watch en puerto 3001

# Frontend (desde raíz)
cd frontend && npm run dev     # Next.js dev en puerto 3000
```

## Build Producción

```bash
# Backend
cd backend
npm run build   # TypeScript → dist/
npm start       # node dist/index.js

# Frontend
cd frontend
npm run build   # Next.js build optimizado
npm start       # servidor Next.js de producción
```

---

## Checklist de Deploy

- [ ] Variables de entorno configuradas en Dokploy
- [ ] MySQL accesible desde el backend
- [ ] Evolution API desplegada y configurada
  - [ ] `EVOLUTION_API_URL` apunta al servidor Dokploy
  - [ ] `EVOLUTION_API_KEY` = `AUTHENTICATION_API_KEY` del servidor
  - [ ] `API_BASE_URL` apunta al backend (para auto-registrar webhook)
- [ ] Stripe webhook configurado con la URL de producción
- [ ] Google OAuth redirect URIs actualizadas para producción

---

← [[architecture/database]] | [[DAIMUZ]]
