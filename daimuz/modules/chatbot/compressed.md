# chatbot — compressed

> 5 líneas. Módulo sin doc completo aún.

- **Qué hace**: configura el agente IA por tenant — el superadmin activa/desactiva, el comerciante personaliza su bot
- **Config**: `bot_name`, `system_prompt` (base de conocimiento), `business_info`, `faqs`, `tone` (profesional/amigable/formal/casual), `accent_color`
- **WhatsApp**: campos `whatsapp_enabled`, `evolution_instance`, `whatsapp_number` activan el canal WhatsApp del agente
- **Herramientas**: `agent_tools JSON` define qué function calling tools puede usar el agente de ese tenant
- **Archivos**: `chatbot.routes.ts`, `ChatWidget.tsx` · Tabla: `chatbot_config` (UNIQUE por tenant) · Ver: [[modules/agent/compressed]]

---

← [[DAIMUZ]] | [[indexes/modules-index]]
