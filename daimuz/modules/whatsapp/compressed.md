# whatsapp — compressed

> 5 líneas. Si necesitas más → lee `whatsapp.md`

- **Stack**: Evolution API v2 self-hosted (Dokploy). Instancia por tenant: `lopbuk-{tenantId[:8]}`. QR desde panel → escanear → conectado.
- **Webhook**: POST /api/whatsapp/webhook/:tenantSlug (público) → verifica `whatsapp_enabled` → `processAgentMessage()` → RAG+Gemini → `sendTextMessage()`
- **Human takeover**: si `isHumanTakeover=true` en sesión → agente silenciado, responde el humano
- **Variables críticas**: `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `API_BASE_URL` — **⚠️ AÚN NO CONFIGURADAS en Dokploy**
- **Archivos**: `whatsapp.service.ts`, `whatsapp.routes.ts`. Config en tabla `chatbot_config` (whatsapp_enabled, evolution_instance)

---

← [[DAIMUZ]] | → [[modules/whatsapp/whatsapp]]
