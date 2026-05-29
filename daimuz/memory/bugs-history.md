# 🐛 Historial de Bugs

> Registro de bugs conocidos, en investigación o resueltos.

## Estados
- 🔴 **Abierto** — sin solución aún
- 🟡 **Investigando** — en diagnóstico
- 🟢 **Resuelto** — fix aplicado (mover resumen a [[important-fixes]])
- ⚪ **Descartado** — no es un bug / no reproducible

---

## Bugs Resueltos

### [2026-05] — Sesión perdida al refrescar página
**Estado:** 🟢 Resuelto  
**Módulo:** [[modules/auth/auth]]  
**Síntoma:** Al recargar el navegador, el usuario quedaba deslogueado aunque la sesión no había expirado  
**Causa:** El token solo vivía en memoria (auth-store). Al recargar, la memoria se limpiaba.  
**Fix:** La cookie httpOnly es la sesión real. El token en auth-store es cache para el header Authorization.  
**Regla aprendida:** httpOnly cookie = fuente de verdad de sesión. Token en JS = fallback de header.

---

### [2026-05] — WhatsApp webhook formato incorrecto
**Estado:** 🟢 Resuelto  
**Módulo:** [[modules/whatsapp/whatsapp]]  
**Síntoma:** El webhook de Evolution API v2 no se registraba correctamente. Mensajes no llegaban al agente.  
**Causa:** El servicio enviaba el webhook en formato nested (objeto con sub-objeto) cuando Evolution API v2 espera formato plano.  
**Fix:** `whatsapp.service.ts` → `setWebhook` corregido al formato plano requerido por Evolution API v2.  
**Regla aprendida:** Siempre verificar el formato exacto del webhook contra la docs de Evolution API antes de asumir.

---

### [2026-05] — Agente sugería productos sin que se preguntara por ellos
**Estado:** 🟢 Resuelto  
**Módulo:** [[modules/agent/agent]]  
**Síntoma:** El agente IA incluía sugerencias de productos en respuestas a preguntas genéricas ("¿cuánto cuestan los envíos?")  
**Causa:** `agent.service.ts` incluía productos en el contexto de RAG para TODOS los mensajes.  
**Fix:** `isProductQuery()`: función que detecta si el mensaje pide explícitamente información de productos. Solo entonces se incluye el catálogo en el contexto.  
**Regla aprendida:** El RAG debe ser selectivo. Más contexto no siempre = mejores respuestas.

---

## Bugs Activos

> Sin bugs conocidos activos al 2026-05-27

---

## Template para nuevo bug

```markdown
### [YYYY-MM] — Descripción corta
**Estado:** 🔴/🟡/🟢/⚪  
**Módulo:** [[modules/xxx/xxx]]  
**Síntoma:** qué pasa  
**Causa:** por qué pasa (si se sabe)  
**Fix:** cómo se resolvió  
**Regla aprendida:** qué no volver a hacer  
```

---

← [[important-fixes]] | [[DAIMUZ]]
