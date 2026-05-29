# 🧠 DAIMUZ — Guía de Replicación en Cualquier Proyecto

> Cómo instalar este sistema de memoria cognitiva en un proyecto nuevo.  
> Medido en Lopbuk: reduce el tiempo de implementación de ~45 min → ~18 min por sesión.

---

## ¿Qué es DAIMUZ?

Un **cerebro de proyecto** que vive en `daimuz/` — una carpeta Obsidian vault que Claude lee antes de tocar código. Reemplaza la exploración ciega de archivos con navegación O(1) por contexto.

```
Sin DAIMUZ:  Claude lee 8-12 archivos para orientarse → 15-20 min perdidos
Con DAIMUZ:  Claude lee 3 archivos y ya sabe dónde tocar → directo a implementar
```

---

## Estructura completa

```
PROYECTO_ROOT/
│
├── CLAUDE.md                        ← 🔑 ENTRADA OBLIGATORIA (en el root)
│
└── daimuz/
    ├── DAIMUZ.md                    ← índice maestro, primer archivo que lee Claude
    │
    ├── indexes/                     ← O(1) navigation
    │   ├── modules-index.md         → todos los módulos en 1 línea cada uno
    │   ├── endpoints-index.md       → todos los endpoints REST ultra-compactos
    │   ├── db-tables-index.md       → todas las tablas y columnas clave
    │   └── files-index.md           → archivos críticos y ubicación exacta
    │
    ├── modules/                     ← 1 carpeta por módulo
    │   └── [modulo]/
    │       ├── compressed.md        → 5 líneas de triage rápido ← EL MÁS IMPORTANTE
    │       ├── [modulo].md          → documentación completa
    │       └── [subtema].md         → extra si el módulo es complejo
    │
    ├── memory/                      ← memoria episódica viva
    │   ├── current-state.md         → qué funciona hoy, últimos cambios
    │   ├── changelog.md             → historial de cambios por fecha + métricas
    │   ├── completed-features.md    → qué está 100% terminado
    │   ├── lessons-learned.md       → lecciones + datos medidos de rendimiento
    │   ├── important-fixes.md       → bugs críticos resueltos
    │   └── bugs-history.md          → problemas abiertos o históricos
    │
    ├── governance/                  ← reglas absolutas
    │   ├── universal-constraints.md → las reglas que nunca se rompen
    │   ├── why-decisions.md         → por qué existen esas reglas
    │   └── update-protocol.md       → cuándo actualizar cada parte de daimuz
    │
    ├── synapses/                    ← mapas de impacto entre módulos
    │   └── [cadena]-chain.md        → si cambio A, qué afecta en B, C, D
    │
    ├── ontology/
    │   └── entities.md              ← definición semántica de cada entidad
    │
    ├── architecture/
    │   ├── overview.md
    │   ├── frontend.md
    │   ├── backend.md
    │   ├── database.md
    │   └── deployment.md            → entornos, variables, deploy checklist
    │
    ├── context/                     ← estado vivo del trabajo activo
    │   ├── current-sprint.md        → en qué trabajo esta semana
    │   ├── pending.md               → backlog priorizado
    │   └── environment.md           → variables, servicios, puertos
    │
    ├── brain/                       ← ADN del proyecto
    │   ├── identity.md              → qué es el proyecto y para quién
    │   ├── philosophy.md            → por qué está construido así
    │   ├── coding-standards.md      → cómo se escribe el código
    │   ├── ai-behavior.md           → cómo hablarle a Claude
    │   ├── naming-conventions.md    → convenciones de nombres
    │   ├── daimuz-replication.md    → este archivo: guía para replicar DAIMUZ
    │   └── patterns/
    │       └── module-pattern.md    → patrón estándar de módulo
    │
    ├── flows/                       ← flujos end-to-end
    │   └── [nombre]-flow.md         → pasos de un proceso completo
    │
    ├── decisions/                   ← ADRs (Architecture Decision Records)
    │   └── [decision].md            → qué, por qué, alternativas descartadas
    │
    ├── prompts/                     ← plantillas de prompts para Claude
    │   ├── new-feature.md
    │   ├── new-module.md
    │   ├── bug-fix.md
    │   └── code-review.md
    │
    └── vault/                       ← conocimiento de referencia
        ├── api-routes.md            → todos los endpoints detallados
        ├── business-rules.md        → reglas de negocio por módulo
        ├── glossary.md              → términos del dominio
        └── integrations.md          → docs de APIs externas
```

---

## El gancho — `CLAUDE.md` en el root

**Archivo más importante.** Sin él, Claude no sabe que existe el cerebro.

```markdown
# CLAUDE.md

## 🧠 Primer paso siempre

1. Lee daimuz/DAIMUZ.md          → índice maestro del proyecto
2. Lee el módulo específico       → daimuz/modules/[modulo]/compressed.md
3. Lee el archivo a modificar
4. Lee el flujo si aplica         → daimuz/flows/

## ⚡ Stack (resumen rápido)
| Capa | Tecnología |
|---|---|
| Frontend | [stack] |
| Backend  | [stack] |
| BD       | [stack] |

## 📐 Reglas que nunca se rompen
1. [regla más importante del proyecto]
2. [regla de seguridad]
3. [regla de arquitectura]

## 💾 Sistema de memoria
Toda la memoria vive en daimuz/ — no en ~/.claude/
```

---

## El archivo más importante — `compressed.md`

Cada módulo **debe** tener este archivo. Es el que más ahorra tiempo.

```markdown
# [Módulo] — Compressed

**Qué hace:** [1 línea que explica todo]
**Tablas:** `tabla1` · `tabla2`
**Endpoints clave:** `GET /ruta` · `POST /ruta/:id`
**Archivos:** `backend/src/modules/x/x.service.ts` · `frontend/components/x.tsx`
**⚠️ Regla crítica:** [la cosa más importante que NO debes olvidar]
```

Este archivo hace que Claude llegue al archivo correcto sin leer 5 archivos intermedios.

---

## Orden de lectura de Claude

```
CLAUDE.md (root)
    ↓
daimuz/DAIMUZ.md                 ← mapa del cerebro
    ↓
daimuz/memory/current-state.md   ← ¿dónde estamos hoy?
    ↓
daimuz/indexes/modules-index.md  ← ¿en qué módulo está lo que busco?
    ↓
daimuz/modules/[X]/compressed.md ← ¿qué archivos tocar? ¿qué regla hay?
    ↓
el archivo real del código        ← ahora sí, a implementar
```

---

## Mínimo viable — 6 archivos para empezar

```
daimuz/
├── DAIMUZ.md
├── indexes/modules-index.md
├── memory/current-state.md
├── governance/universal-constraints.md
├── context/current-sprint.md
└── modules/[primer-modulo]/compressed.md

+ CLAUDE.md en el root del proyecto
```

Los demás se van creando **mientras construyes** el proyecto.

---

## Protocolo de mantenimiento

| Cuándo | Qué hacer |
|---|---|
| Al terminar una sesión | Actualizar `memory/current-state.md` + `memory/changelog.md` |
| Al terminar un feature | Añadir a `memory/completed-features.md` |
| Al resolver un bug | Añadir a `memory/important-fixes.md` y `memory/bugs-history.md` |
| Al crear un módulo | Crear `modules/[modulo]/compressed.md` antes del código |
| Al aprender algo | Añadir a `memory/lessons-learned.md` con datos medidos |

**Regla de oro:** Si en la próxima sesión Claude necesitará saber algo, escríbelo ahora.

---

## Métricas medidas en Lopbuk (2026-05-27)

Primera sesión completa con DAIMUZ v3 al 100/100:

| Métrica | Sin DAIMUZ | Con DAIMUZ |
|---|---|---|
| Tiempo total por feature | ~45 min | ~18 min |
| Files leídos para orientarse | 8-12 | 3 |
| Backtracking | Frecuente | 0 |
| Bugs detectados antes de runtime | Raro | ✅ 1 detectado en pre-lectura |

**Ahorro: ~60% del tiempo de implementación.**

---

← [[ai-behavior]] | [[DAIMUZ]] | → [[coding-standards]]
