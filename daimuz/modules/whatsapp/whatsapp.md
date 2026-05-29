# 💬 Módulo: WhatsApp (Evolution API)

## Qué hace
Conecta cada tenant con WhatsApp usando **Evolution API** (autoalojado).
El agente IA responde mensajes entrantes usando el mismo pipeline de `agent.service.ts`.
El comerciante conecta su número escaneando un QR desde el panel.

## Archivos
```
backend/src/modules/whatsapp/
  ├── whatsapp.routes.ts   — Webhook público + endpoints de gestión [auth]
  └── whatsapp.service.ts  — HTTP client para Evolution API v2
```

## APIs
```
POST   /api/whatsapp/webhook/:tenantSlug  → Evolution API envía eventos aquí (público)
GET    /api/whatsapp/status               → [auth] Estado de la instancia (open/close/connecting)
POST   /api/whatsapp/connect              → [auth] Crear instancia + obtener QR base64
DELETE /api/whatsapp/disconnect           → [auth] Eliminar instancia
GET    /api/whatsapp/qr                   → [auth] Refrescar QR
```

## Flujo de conexión (comerciante)

```
Panel → "Conectar WhatsApp"
  ↓
POST /api/whatsapp/connect
  ↓
Evolution API crea instancia lopbuk-{tenantId[:8]}
  ↓
Devuelve qrcode base64 → panel lo muestra
  ↓
Comerciante escanea con su teléfono
  ↓
Evolution API emite MESSAGES_UPSERT → webhook
  ↓
Backend procesa con processAgentMessage()
  ↓
sendTextMessage() responde al cliente
```

## Flujo de mensaje entrante

```
Cliente escribe en WhatsApp
  ↓
Evolution API → POST /api/whatsapp/webhook/:slug
  ↓
Verificar: chatbot_config.whatsapp_enabled = 1
  ↓
getOrCreateSession("wa:phoneNumber", tenantId)
  ↓
isHumanTakeover? → si true, silenciar agente
  ↓
processAgentMessage() → RAG + Gemini + tools
  ↓
sendTextMessage(instanceName, phoneNumber, reply)
```

## Variables de entorno
```
EVOLUTION_API_URL=https://evo.tudominio.com   ← URL pública del servidor Evolution API
EVOLUTION_API_KEY=tu_authentication_api_key   ← igual que AUTHENTICATION_API_KEY del servidor
API_BASE_URL=https://api.tudominio.com         ← para auto-registrar el webhook en la instancia
```

## Instalación del servidor Evolution API
```bash
# Repositorio: https://github.com/devalexcode/shell-evolution-api
git clone https://github.com/devalexcode/shell-evolution-api.git
cd shell-evolution-api
cp .env.example .env
nano .env  # definir AUTHENTICATION_API_KEY, POSTGRESS_PASS
chmod +x install.sh && ./install.sh
```

**En Dokploy:** Create Service → **Compose** → apuntar al repo → agregar env vars → Deploy

## Columnas en chatbot_config (usadas por este módulo)
| Columna | Descripción |
|---|---|
| `whatsapp_enabled` | 1 = agente activo en WA |
| `whatsapp_number` | Número del negocio (informativo) |
| `evolution_instance` | Nombre de la instancia en Evolution API (`lopbuk-{id[:8]}`) |

## Estado
✅ **Completo y en producción**
- Webhook recibe mensajes
- Agente responde con RAG + function calling
- Comerciante conecta/desconecta desde el panel
- Webhook se auto-registra al conectar

## Dependencias
- [[modules/agent/agent]] — pipeline de IA compartido
- [[vault/integrations]] — variables de entorno

---
← [[DAIMUZ]]
