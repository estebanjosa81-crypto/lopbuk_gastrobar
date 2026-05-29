# 🤖 Prompt: Nuevo Módulo Backend

> Para cuando necesitas crear un módulo completo desde cero.

---

## Template

```
Lee primero:
- [[DAIMUZ]]
- [[architecture/backend]]
- [[brain/coding-standards]]

Crea el módulo "[nombre]" siguiendo el patrón estándar de Lopbuk.

**Función:** [qué hace este módulo]

**Endpoints necesarios:**
- GET /api/[nombre] → [qué retorna]
- POST /api/[nombre] → [qué recibe y crea]
- PUT /api/[nombre]/:id → [qué actualiza]
- DELETE /api/[nombre]/:id → [soft delete]
- [otros endpoints específicos]

**Tabla DB:** [nombre_tabla]
**Campos:**
- id (UUID)
- tenant_id
- [campo1]: tipo
- [campo2]: tipo
- is_active
- created_at, updated_at

**Roles que acceden:**
- GET: [roles]
- POST/PUT/DELETE: [roles]

**Dependencias de otros módulos:**
- [[modules/xxx/xxx]]

**Reglas de negocio:**
- [regla 1]
- [regla 2]

Estructura a crear:
backend/src/modules/[nombre]/
├── [nombre].routes.ts
├── [nombre].controller.ts
├── [nombre].service.ts
└── index.ts

Registrar en: backend/src/modules/index.ts
```

---

## Post-creación

Después de crear el módulo, actualizar:
1. [[DAIMUZ]] — agregar en la tabla de módulos
2. [[architecture/backend]] — agregar en la lista
3. Crear `daimuz/modules/[nombre]/[nombre].md` — neurona del módulo

---

← [[prompts/new-feature]] | [[DAIMUZ]] | → [[prompts/bug-fix]]
