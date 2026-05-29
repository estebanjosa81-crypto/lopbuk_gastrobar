# 🔌 Integraciones Externas

## Google OAuth

**Uso:** Login con Google  
**Módulo:** [[modules/auth/auth]]  
**Variables:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`  
**Librería backend:** `google-auth-library` (OAuth2Client)  
**Librería frontend:** `@react-oauth/google`  

**Flujo:**
1. Frontend obtiene `idToken` de Google
2. Backend verifica con `googleClient.verifyIdToken()`
3. UPSERT usuario con `auth_provider = 'google'`

---

## Stripe

**Uso:** Pagos online + suscripciones SaaS  
**Módulo:** [[modules/finances/finances]]  
**Variables:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`  
**Webhooks:** `/api/stripe/webhook`

**Eventos que maneja:**
- `customer.subscription.created` → activa plan
- `customer.subscription.deleted` → desactiva plan
- `payment_intent.succeeded` → confirma pago one-time

---

## WhatsApp — Evolution API v2 (self-hosted)

**Uso:** Mensajería con clientes, notificaciones de reservas y pedidos  
**Módulo:** `backend/src/modules/whatsapp/`  
**Variables:** `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `WHATSAPP_INSTANCE_NAME`  
**Webhook:** `/api/whatsapp/webhook`  
**Deploy:** Dokploy → repo `devalexcode/shell-evolution-api` ⚠️ pendiente configurar

**Flujo:**
1. Evolution API conecta el número WhatsApp del negocio
2. Mensajes entrantes → webhook → `whatsapp.service.ts` → `agent.service.ts`
3. Respuestas salen por `whatsapp.service.ts → POST /message/sendText`
4. Webhook se auto-registra al iniciar backend si `EVOLUTION_API_URL` está configurado

> ⚠️ NO usar `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_ID` — esos son de Meta Cloud API (no usada)

---

## Cloudinary

**Uso:** Almacenamiento y CDN de imágenes (productos, logos, etc.)  
**Módulo:** `backend/src/modules/media-library/`  
**Variables:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`  
**Upload:** directo desde frontend para mejor performance  
**Componente:** `frontend/components/ui/cloudinary-upload.tsx`

---

## Socket.io

**Uso:** Tiempo real (pedidos, tracking, dashboard)  
**Config frontend:** `frontend/lib/socket.ts`  
**Config backend:** integrado en el servidor Express  

**Eventos principales:**
| Evento | Dirección | Descripción |
|---|---|---|
| `new-order` | server → clients | Nuevo pedido llegó |
| `order-status` | server → clients | Estado de pedido cambió |
| `driver-location` | client → server → clients | Tracking del conductor |
| `dashboard-update` | server → clients | KPIs actualizados |

---

← [[vault/glossary]] | [[DAIMUZ]] | → [[vault/external-resources]]
