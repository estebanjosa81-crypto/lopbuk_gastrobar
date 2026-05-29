# 🔧 Fixes Importantes

> Bugs críticos resueltos. Sirven como referencia para no repetirlos.

## Template para agregar un fix

```markdown
### [YYYY-MM-DD] — Título del bug
**Síntoma:** qué pasaba
**Causa:** por qué pasaba
**Fix:** cómo se resolvió
**Archivos:** qué se modificó
**Regla:** qué aprender de esto
```

---

## Historial

### [2026-05] — Token en memoria vs localStorage
**Síntoma:** Al refrescar la página se perdía la sesión  
**Causa:** El token estaba solo en memoria (auth-store), no persistía  
**Fix:** Se usa httpOnly cookie como fuente de verdad, el token en memoria es solo para el header Authorization como fallback  
**Archivos:** `frontend/lib/auth-store.ts`, `frontend/lib/api.ts`  
**Regla:** La cookie httpOnly es la sesión real. El token en JS es solo un cache.

---

### [2026-05] — WhatsApp webhook formato Evolution API v2
**Síntoma:** Los mensajes de WhatsApp no llegaban al agente IA  
**Causa:** `setWebhook` enviaba el payload en formato nested (con sub-objeto webhook), pero Evolution API v2 espera el formato plano  
**Fix:** `backend/src/modules/whatsapp/whatsapp.service.ts` — `setWebhook()` corregido a formato plano  
**Archivos:** `backend/src/modules/whatsapp/whatsapp.service.ts`  
**Regla:** Siempre verificar el formato exacto de payload con la versión exacta de la API externa. v1 y v2 de Evolution API tienen formatos diferentes.

---

### [2026-05] — Agente IA respondía con productos no pedidos
**Síntoma:** El agente incluía sugerencias de productos en respuestas a preguntas genéricas (envíos, horarios, etc.)  
**Causa:** El RAG incluía el catálogo de productos en el contexto de TODOS los mensajes  
**Fix:** `agent.service.ts` — función `isProductQuery()` detecta si la intención del mensaje es sobre productos. Solo entonces se incluye el catálogo en el contexto RAG.  
**Archivos:** `backend/src/modules/agent/agent.service.ts`  
**Regla:** El RAG debe ser intencional y selectivo. Más contexto ≠ mejor respuesta.

---

> Agrega nuevos fixes aquí cuando los resuelvas. Fecha + descripción corta.

---

← [[lessons-learned]] | [[DAIMUZ]] | → [[bugs-history]]
