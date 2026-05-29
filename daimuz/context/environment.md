# 🌐 Entorno y Servicios

## Desarrollo Local

| Servicio | URL | Puerto |
|---|---|---|
| Frontend | http://localhost:3000 | 3000 |
| Backend API | http://localhost:3001 | 3001 |
| MySQL | localhost | 3306 |

## Comandos de Arranque

```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev

# MySQL (Docker)
docker-compose -f docker-compose.dev.yml up -d
```

## Servicios Externos

| Servicio | Para qué | Configuración |
|---|---|---|
| Google OAuth | Login con Google | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET |
| Stripe | Pagos y suscripciones | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET |
| Evolution API v2 | WhatsApp mensajería (self-hosted) | EVOLUTION_API_URL, EVOLUTION_API_KEY, WHATSAPP_INSTANCE_NAME |
| Cloudinary | Almacenamiento de imágenes | CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET |

## ⚠️ Estado de Evolution API

> Evolution API se deploya en Dokploy — **AÚN NO CONFIGURADO**

```bash
# Variables pendientes en backend/.env
EVOLUTION_API_URL=       # URL del servidor Evolution API en Dokploy
EVOLUTION_API_KEY=       # API key de Evolution API
API_BASE_URL=            # URL base del backend (para webhook)
```

**Para configurar:** Crear servicio Compose en Dokploy → repo `devalexcode/shell-evolution-api`

## Variables de Entorno

Ver [[architecture/deployment]] para la lista completa.

## Estado de los Servicios

> Actualiza si hay algo roto o en mantenimiento

- ✅ Backend local — funcionando
- ✅ Frontend local — funcionando
- ✅ MySQL local — funcionando
- ✅ Google OAuth — activo
- ✅ Stripe — activo (modo test en dev)

---

← [[context/pending]] | [[DAIMUZ]]
