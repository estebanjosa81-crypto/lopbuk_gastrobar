# ⏳ Backlog — Pendientes

> Actualiza según prioridades. P1 = crítico, P2 = importante, P3 = mejora.

## 🔴 P1 — Crítico

- [ ] Configurar Evolution API en Dokploy y conectar con backend
  - Crear servicio Compose en Dokploy → repo devalexcode/shell-evolution-api
  - Completar `.env` backend: EVOLUTION_API_URL, EVOLUTION_API_KEY, API_BASE_URL

## 🟡 P2 — Importante

### Agente IA
- [ ] **Fase 3 — Voz IA (Vapi)**
  - Crear `backend/src/modules/voice/vapi.routes.ts`
  - Crear `backend/src/modules/voice/vapi.service.ts`
  - Migración SQL: voice_enabled, vapi_phone_id, vapi_assistant_id en chatbot_config
  - Agregar VAPI_API_KEY al .env
  - Registrar ruta en index.ts

- [ ] **Fase 4 — Panel Admin del Agente**
  - `frontend/app/agente/page.tsx` con tabs
  - `AgentConfig.tsx` — configuración web / WhatsApp / voz
  - `AgentConversations.tsx` — sesiones + botón "Tomar control"
  - `AgentActions.tsx` — historial de tool calls
  - `AgentAnalytics.tsx` — KPIs 30 días

### Otros módulos
- [ ] **Módulo Ferretería** — plan completo de 9 fases acordado → ver [[modules/ferreteria/ferreteria]]
  - Fase 1: DB (fleet_vehicles, fleet_maintenance, extensiones storefront_orders y sales)
  - Fase 2: Backend módulo `fleet` con asignación por peso
  - Fases 3–9: frontend (panel despachador, driver, inventario, storefront, POS, gestión flota)
- [ ] Completar flujos del módulo inmobiliaria
- [ ] Mejorar UX del módulo tapicería/workorders

## 🟢 P3 — Mejoras

- [ ] **Fase 5 — n8n automatizaciones**
  - Confirmaciones automáticas de reserva por WhatsApp
  - Cobros automáticos a créditos vencidos
  - Seguimiento de leads no convertidos
- [ ] Exportación avanzada de reportes (Excel nativo)
- [ ] Notificaciones push para pedidos nuevos
- [ ] Dashboard de superadmin con métricas globales SaaS
- [ ] Sistema de onboarding interactivo por tipo de negocio

## 💡 Ideas / Futuro

- [ ] **Fase 6 — Gemini Live + Qdrant** (voz en tiempo real por WebSocket)
- [ ] Integración con contabilidad (Siigo, Alegra)
- [x] ~~Módulo de nómina básica~~ → **YA EXISTE**: módulo `vendedores` con comisiones, metas y `payroll_records`
- [ ] App cliente nativa (iOS/Android)
- [ ] Integración con plataformas de delivery (Rappi, iFood)
- [ ] Plataforma SaaS de agentes IA para vender como servicio mensual

---

← [[context/current-sprint]] | [[DAIMUZ]] | → [[context/environment]]
