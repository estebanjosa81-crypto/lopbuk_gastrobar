# 💡 Recuerdo — Cómo replicar DAIMUZ en un proyecto nuevo

> Guardado: 2026-05-27  
> Origen: sesión donde se midió 45 min → 18 min por feature

---

## La idea en una línea

Un archivo `CLAUDE.md` en el root del proyecto + una carpeta `daimuz/` con la documentación estructurada = Claude llega al archivo correcto sin explorar.

## Los 3 archivos que más importan

1. **`CLAUDE.md`** (root) — le dice a Claude que lea daimuz/ primero. Sin este, nada funciona.
2. **`daimuz/DAIMUZ.md`** — el mapa. Apunta a todo lo demás.
3. **`daimuz/modules/[x]/compressed.md`** — 5 líneas por módulo. El mayor ahorro de tiempo.

## Mínimo para arrancar un proyecto nuevo

```
PROYECTO/
├── CLAUDE.md                              ← obligatorio en root
└── daimuz/
    ├── DAIMUZ.md
    ├── indexes/modules-index.md
    ├── memory/current-state.md
    ├── governance/universal-constraints.md
    ├── context/current-sprint.md
    └── modules/[modulo]/compressed.md
```

## Formato compressed.md (copiar y pegar)

```markdown
# [Módulo] — Compressed

**Qué hace:** [1 línea]
**Tablas:** `tabla1` · `tabla2`
**Endpoints clave:** `GET /ruta` · `POST /ruta/:id`
**Archivos:** `backend/.../x.service.ts` · `frontend/components/x.tsx`
**⚠️ Regla crítica:** [lo más importante que NO debes olvidar]
```

## Guía completa de replicación

→ [[brain/daimuz-replication]]

---

← [[current-state]] | [[DAIMUZ]]
