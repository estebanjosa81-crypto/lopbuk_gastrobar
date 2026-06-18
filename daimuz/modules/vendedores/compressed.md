# vendedores — compressed

> 5 líneas. Módulo sin doc completo aún.

- **Qué hace**: gestiona comisiones de vendedores, metas mensuales y genera nóminas quincenales
- **Tipos de comisión**: `sin_comision` · `porcentaje` (% sobre total venta) · `fijo_por_venta` (monto fijo por transacción) · `fijo_por_item` (monto fijo por ítem vendido)
- **Nómina**: `total_pagar = salary_base + commission_earned + goal_bonus + bonos - descuentos`. Estado: `borrador → pagado`
- **Ajustes**: `payroll_adjustments` permite agregar bonos o descuentos manuales por período antes de generar la nómina
- **Archivos**: `vendedores.service.ts`, `vendedores.controller.ts`, `vendedores.routes.ts`, `vendedores-panel.tsx` · Tablas: `payroll_records`, `payroll_adjustments`

---

← [[DAIMUZ]] | [[indexes/modules-index]]
