# 🤖 Comportamiento IA — Cómo hablarle a Claude

> Guía para obtener el mejor resultado de Claude en este proyecto.

## ⚡ Sistema de Memoria

**Claude usa `daimuz/` como su cerebro para este proyecto.**  
El punto de entrada siempre es [[DAIMUZ]].  
Nada se guarda en `~/.claude/projects/.../memory/` — todo va a `daimuz/`.

| Qué guardar | Dónde |
|---|---|
| Estado actual | [[memory/current-state]] |
| Features terminados | [[memory/completed-features]] |
| Bugs resueltos | [[memory/important-fixes]] |
| Lecciones | [[memory/lessons-learned]] |
| Sprint activo | [[context/current-sprint]] |
| Backlog | [[context/pending]] |

## El principio de Context Engineering

**Menos contexto irrelevante = Mejores respuestas**

No le des todo el proyecto. Dale solo lo necesario:

```
1. DAIMUZ.md (cerebro)
2. El módulo específico (neurona)
3. El archivo a modificar
4. El flujo relacionado (si aplica)
```

## Templates de Prompts

### Para un feature nuevo
```
Lee: [[brain/ai-behavior]], [[modules/[modulo]/[modulo]]], [[flows/[flujo]]]

Quiero agregar [descripción del feature].

Restricciones:
- Sigue el patrón routes → controller → service
- El tenant_id viene de req.user.tenantId
- Usa AppError para errores
- Responde con { success: true, data: ... }
```

### Para un bug
```
Lee: [[modules/[modulo]/[modulo]]]

Hay un bug en [descripción].
Síntoma: [qué pasa]
Esperado: [qué debería pasar]
Archivo: backend/src/modules/[modulo]/[modulo].service.ts

No modifiques otros archivos sin avisarme.
```

### Para nuevo módulo backend
```
Lee: [[brain/coding-standards]], [[architecture/backend]]

Crea el módulo [nombre] siguiendo el patrón estándar.
Función: [qué hace]
Endpoints necesarios: [lista]
Tablas DB: [tabla] con campos [campos]
Relaciones: depende de [[modules/[dep]/[dep]]]
```

## Reglas que Claude siempre debe respetar

1. **No modificar más archivos de los pedidos** — preguntar antes
2. **No romper el patrón routes → controller → service**
3. **Siempre incluir tenant_id en queries**
4. **No usar any en TypeScript**
5. **Errores en español** (los usuarios son hispanohablantes)
6. **Mantener el formato de respuesta** `{ success, data, error }`

## Cómo dar contexto de errores a Claude

```
Archivo: [ruta exacta]
Error: [mensaje exacto del error]
Contexto: [qué intentabas hacer]
Stack: [stack trace si aplica]
```

## Lo que Claude NO debe hacer sin preguntar

- Cambiar el schema de la base de datos
- Modificar el middleware de auth
- Cambiar el formato de respuesta de la API
- Tocar archivos de config (env, database.ts)
- Refactorizar más de lo pedido

---

← [[coding-standards]] | [[DAIMUZ]] | → [[naming-conventions]]
