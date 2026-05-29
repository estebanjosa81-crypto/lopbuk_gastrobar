# 🤖 Prompt: Code Review

> Template para pedir a Claude que revise código existente.

---

## Template

```
Lee primero:
- [[brain/coding-standards]]
- [[brain/philosophy]]

Revisa el siguiente archivo:
`[ruta del archivo]`

Busca:
- [ ] Violaciones del patrón routes → controller → service
- [ ] Queries SQL sin filtro de tenant_id
- [ ] Uso de `any` en TypeScript
- [ ] Lógica de negocio en controller o routes
- [ ] Manejo incorrecto de errores
- [ ] Race conditions o bugs potenciales
- [ ] Código duplicado

Reporta cada hallazgo con:
1. Línea del problema
2. Por qué es un problema
3. Cómo corregirlo

No apliques los cambios, solo reporta.
```

---

## Checklist de Revisión

Antes de hacer PR o commit importante, verificar:

### Backend Service
- [ ] Todas las queries tienen `WHERE tenant_id = ?`
- [ ] Los errores lanzan `AppError` con mensaje en español
- [ ] No hay `any` en tipos
- [ ] Las interfaces de DB rows extienden `RowDataPacket`
- [ ] No hay lógica en el controller

### Frontend Component
- [ ] No hay `fetch()` directo (usar api.ts)
- [ ] Los estados se manejan via Zustand
- [ ] Los errores se muestran al usuario
- [ ] No hay `console.log` en producción

---

← [[prompts/bug-fix]] | [[DAIMUZ]]
