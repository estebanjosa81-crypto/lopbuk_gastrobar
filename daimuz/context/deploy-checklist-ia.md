# Checklist de deploy — IA multi-proveedor (OpenCode/OpenAI/Groq/Gemini)

> Última actualización: 2026-06-16. Causa de los 500 en prod: el build desplegado era
> viejo + el agente tenía `api.openai.com` hardcodeado. Ya corregido en código.

## 1. Redeploy del backend (obligatorio)
El build de prod (`/app/dist/...`) debe reconstruirse para incluir:
- `agent.service.callOpenAI` → ahora usa **Base URL/modelo configurables** (antes hardcodeaba OpenAI).
  `processAgentMessage` le pasa `openaiBaseUrl`/`openaiModel` desde `getAIKeys()`.
- `assistant.service` (`runPlatformAssistant`, `runPublicAssistant`) → leen Base URL/modelo de `getAIKeys()`.
- `daimuz-chat` (`llmCall`) → usa Base URL/modelo de `getAIKeys()`.
- `restbar.service.getAreaDisplay` → resiliente a `rb_orders.priority` faltante (la crea con `ADD COLUMN` plano;
  **MySQL NO soporta `ADD COLUMN IF NOT EXISTS`** — por eso fallaba la migración).
- `agent.tools.toolRegistrarPedido` → inserta pedidos REALES en `storefront_orders` + items.

## 2. Configurar el proveedor en el panel (Superadmin → Página Principal → Integraciones → IA)
Para el plan **OpenCode Go** (key `sk-` de opencode.ai):
- **Proveedor default:** OpenAI
- **OpenAI (key):** la `sk-…` de opencode
- **Base URL:** `https://opencode.ai/zen/v1`
- **Modelo:** `deepseek-v4-flash` (elige de la lista o escríbelo)
- Guardar Integraciones.

> Alternativas si no carga el modelo: `deepseek-v4-flash-free`, `deepseek-v3.1`, `qwen3-coder`, etc.
> (el campo Modelo permite elegir de una lista o escribir cualquiera). Si OpenCode devuelve
> "model not found", cambia el nombre exacto al de tu plan.

## 3. Frontend (redeploy)
- Fix `--primary` (acento): `applyAdminAccent` ahora envuelve en `hsl(...)` → avatar/botones visibles.
- Switch de tema (claro/oscuro, View Transitions) movido al **header** del comerciante.
- Ítem "DAIMUZ Chat" del sidebar removido; entrada única = botón glitch **CHAT DAIMUZ** (footer) → `/modo-chat`.
- `/modo-chat`: escritorio = chat + panel de KPIs; móvil = solo chat; botón "Volver al panel"; loader al entrar.
- Loader de cajas reemplaza el spinner en `app/page.tsx` y `login` (portafolio conserva el suyo).

## 4. Verificación post-deploy
- [ ] Chatbot de tienda responde (no 500): `/api/chatbot/message`.
- [ ] Asistente del panel responde: `/api/assistant`.
- [ ] Modo Chat Daimuz responde y ejecuta acciones (con confirmación).
- [ ] Cocina/Bar (KDS) cargan sin error de `o.priority`.
- [ ] Pedido por chatbot aparece en Centro de Pedidos.
- [ ] Avatar/botones con color de acento visible.

## Plan de contingencia (modelos)
- El campo **Modelo** acepta selección de lista **o** texto libre → cambiar de modelo es inmediato.
- Si un proveedor/modelo falla, alternar **Proveedor default** (Gemini/Groq) o cambiar la **Base URL/Modelo**
  resuelve sin tocar código. Todo se resuelve desde el panel.
