# tenants — compressed

> 5 líneas. Si necesitas más → lee `tenants.md`

- **Qué es**: negocio registrado en Lopbuk. Tiene id, slug único, plan, módulos activos, configuración de branding
- **Solo superadmin** puede ver/crear/desactivar tenants. El admin solo edita SU tenant.
- **Módulos activables**: cada tenant tiene array `modules[]` que determina qué puede usar. El backend valida, no solo el frontend.
- **Desactivar tenant**: `is_active = false` → bloquea TODOS sus usuarios. Datos intactos (soft delete).
- **Archivos**: `tenants.service.ts`, `tenant-management.tsx` (superadmin), `settings.tsx` (admin), `register-modal.tsx`

---

← [[DAIMUZ]] | → [[modules/tenants/tenants]]
