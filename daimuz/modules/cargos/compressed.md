# cargos — compressed

> 5 líneas. Módulo sin doc completo aún.

- **Qué es**: cargos/posiciones personalizadas que el comerciante crea para su negocio (ej: "Jefe de cocina", "Auxiliar de bodega")
- **FK en users**: `users.cargo_id → employee_cargos.id` — el cargo determina los permisos RBAC granulares
- **Permisos**: `employee_cargos.permissions JSON` — array de strings como `["manage_products","view_reports"]`, evaluados por `utils/permissions.ts`
- **Regla**: el rol del JWT controla acceso grueso (cajero/mesero); el cargo controla acceso fino dentro del rol
- **Archivos**: `cargos.service.ts`, `cargos.controller.ts`, `cargos.routes.ts` · Tabla: `employee_cargos`

---

← [[DAIMUZ]] | [[indexes/modules-index]]
