# novedades — compressed

> 5 líneas. Módulo sin doc completo aún.

- **Qué hace**: control de ausencias y novedades laborales de empleados — permisos, incapacidades, vacaciones, suspensiones
- **Tipos**: `vacaciones` · `permiso_remunerado` · `permiso_no_remunerado` · `incapacidad` · `calamidad` · `licencia_maternidad` · `suspension` · `otro`
- **Impacto nómina**: `deducts_salary = 1` → `deduct_amount` se descuenta de la nómina del período · `deducts_vacation = 1` → descuenta del saldo anual
- **Saldo vacaciones**: `employee_vacation_balances` — 15 días por ley colombiana por año · se actualiza al aprobar novedades de tipo vacaciones
- **Archivos**: `novedades.service.ts`, `novedades.controller.ts`, `novedades.routes.ts` · Tablas: `employee_novelties`, `employee_vacation_balances`

---

← [[DAIMUZ]] | [[indexes/modules-index]]
