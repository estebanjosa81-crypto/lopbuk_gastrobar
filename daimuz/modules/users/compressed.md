# users — compressed

> 5 líneas. Módulo sin doc completo aún.

- **Qué hace**: CRUD de usuarios del tenant — crear empleados, cambiar rol, activar/desactivar login
- **`can_login`**: un empleado puede existir en el sistema (para nómina/reportes) sin poder iniciar sesión — `can_login = false`
- **Roles disponibles** (enum exacto): `superadmin · comerciante · administrador_rb · cajero · mesero · cocinero · bartender · vendedor · repartidor · despachador · auxiliar_bodega · asesor_inmobiliario · gerente_inmobiliario · cliente`
- **Nunca DELETE físico**: soft delete con `is_active = false` — el historial de ventas y pedidos del usuario se preserva
- **Archivos**: `users.service.ts`, `users.controller.ts`, `users.routes.ts` · Ver también: [[modules/cargos/compressed]]

---

← [[DAIMUZ]] | [[indexes/modules-index]]
