# agent — compressed

> 5 líneas. Si necesitas más → lee `agent.md`

- **Stack IA**: RAG (búsqueda semántica catálogo) + Function Calling (crear pedidos, consultar stock) + historial de contexto
- **Canal WhatsApp**: Evolution API v2. Webhook en /api/whatsapp/webhook → agent.service → responde
- **Productos**: `isProductQuery()` solo sugiere productos cuando el mensaje lo pide explícitamente
- **Fases pendientes**: Fase 3 (Voz Vapi), Fase 4 (Panel Admin), Fase 5 (n8n automatizaciones)
- **Archivos**: `agent.service.ts`, `agent.rag.ts`, `agent.tools.ts`, `whatsapp.service.ts`

---

← [[DAIMUZ]] | → [[modules/agent/agent]]
