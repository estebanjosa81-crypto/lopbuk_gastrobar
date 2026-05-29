# 🔄 Protocolo de Actualización de DAIMUZ

> Cuándo y dónde actualizar cada parte del sistema cognitivo.  
> Si daimuz no se actualiza, se vuelve ruido, no señal.

---

## Al terminar una sesión de trabajo significativa

```
1. daimuz/memory/current-state.md    → ¿qué cambió hoy?
2. daimuz/memory/changelog.md        → entrada con fecha
3. daimuz/context/current-sprint.md  → ¿qué hice? ¿qué falta?
```

---

## Al agregar o cambiar un feature de módulo

| Cambio | Actualizar |
|---|---|
| Nuevo endpoint | `vault/api-routes.md` + `indexes/endpoints-index.md` |
| Nueva tabla DB | `indexes/db-tables-index.md` + `architecture/database.md` |
| Nuevo archivo crítico | `indexes/files-index.md` |
| Nueva regla de negocio | `vault/business-rules.md` + `modules/[x]/[x].md` |
| Cambio en flujo de módulo | `modules/[x]/compressed.md` (re-escribir) + `modules/[x]/[x].md` |
| Módulo que afecta a otro | `synapses/[cadena-relevante].md` → sección "Impacto por Cambio" |

---

## Al resolver un bug

```
1. daimuz/memory/bugs-history.md     → marcar como 🟢 Resuelto
2. daimuz/memory/important-fixes.md  → agregar el fix con regla aprendida
3. daimuz/memory/lessons-learned.md  → si hay lección de arquitectura
```

---

## Al terminar un feature completo

```
1. daimuz/memory/completed-features.md → agregar feature
2. daimuz/context/pending.md           → marcar como hecho
```

---

## Cuándo actualizar las Sinapsis (`synapses/`)

> Las sinapsis documentan el **impacto sistémico**. Actualizar cuando:

| Evento | Sinapsis a actualizar |
|---|---|
| Cambias `sales.service.ts` | `synapses/ops-chain.md` |
| Cambias `inventory.service.ts` | `synapses/ops-chain.md` + `synapses/gastrobar-chain.md` |
| Cambias `cash-sessions.service.ts` | `synapses/ops-chain.md` |
| Cambias `recipes.service.ts` | `synapses/gastrobar-chain.md` |
| Cambias `merma.service.ts` | `synapses/gastrobar-chain.md` |
| Cambias `delivery.service.ts` | `synapses/delivery-chain.md` |
| Cambias `whatsapp.service.ts` | `synapses/delivery-chain.md` |
| Cambias `agent.service.ts` | `synapses/delivery-chain.md` |
| Cambias `auth.middleware.ts` | `synapses/saas-chain.md` + **AVISAR antes** |
| Cambias `tenants.service.ts` | `synapses/saas-chain.md` |
| Cambias `subscriptions.service.ts` | `synapses/saas-chain.md` |

---

## Cuándo actualizar la Ontología (`ontology/entities.md`)

- Al agregar un nuevo tipo de entidad al sistema
- Al cambiar el significado semántico de una existente
- Al agregar nuevos campos críticos a una entidad (`fleet_vehicles` cuando ferretería esté lista)

---

## Cuándo actualizar Governance (`governance/`)

- Al cambiar un patrón de código que aplica a todos los módulos
- Al descubrir una nueva regla de seguridad crítica
- Al actualizar el protocolo de deploymenr

---

## Fuente de Verdad por Tipo de Dato

| Dato | Fuente de Verdad | Secundario |
|---|---|---|
| Endpoints | `indexes/endpoints-index.md` | `vault/api-routes.md` (más detallado) |
| Tablas DB | `indexes/db-tables-index.md` | `architecture/database.md` |
| Archivos | `indexes/files-index.md` | — |
| Módulos | `indexes/modules-index.md` | `modules/[x]/[x].md` |
| Reglas | `governance/universal-constraints.md` | `brain/coding-standards.md` |
| Estado hoy | `memory/current-state.md` | `context/current-sprint.md` |

---

← [[governance/universal-constraints]] | [[DAIMUZ]]
