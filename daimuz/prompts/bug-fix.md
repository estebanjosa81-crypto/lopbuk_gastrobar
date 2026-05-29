# 🤖 Prompt: Bug Fix

> Template para reportar y resolver bugs con Claude de forma eficiente.

---

## Template

```
Lee primero:
- [[modules/[modulo]/[modulo]]]

Hay un bug en el módulo [nombre].

**Síntoma:** [qué pasa exactamente]
**Esperado:** [qué debería pasar]
**Pasos para reproducir:**
1. [paso 1]
2. [paso 2]

**Archivo probable:** `[ruta exacta del archivo]`

**Error en consola (si aplica):**
```
[pegar el error exacto aquí]
```

**Stack trace (si aplica):**
```
[pegar el stack trace]
```

**Restricciones:**
- Solo modifica el archivo del bug
- Si necesitas cambiar otros archivos, avísame primero
- No refactorices más de lo necesario
```

---

## Ejemplo real

```
Lee: [[modules/inventory/inventory]]

Bug en el módulo de inventario.

Síntoma: Al registrar una merma, el stock no se descuenta en products
Esperado: stock debería reducirse por la cantidad de merma
Pasos: 1) ir a inventario 2) registrar merma de 5 unidades 3) ver que stock no cambió

Archivo probable: backend/src/modules/merma/merma.service.ts

Solo modifica el service de merma. No toques nada más.
```

---

## Después del fix

Actualizar [[memory/important-fixes]] con:
- Qué era el bug
- Cuál fue la causa
- Cómo se resolvió

---

← [[prompts/new-module]] | [[DAIMUZ]] | → [[prompts/code-review]]
