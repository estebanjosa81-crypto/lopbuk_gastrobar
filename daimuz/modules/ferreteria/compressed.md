# ferreteria — compressed

> 3 líneas. Módulo pendiente. Si necesitas el plan completo → lee `ferreteria.md`

- **Vertical ferretería** (plan 9 fases acordado): flota por peso (moto <100kg · camión ligero 100-500kg · planta >500kg), despacho en pista, storefront con peso acumulado
- **Nuevo rol**: `despachador`. Nuevas tablas: `fleet_vehicles`, `fleet_maintenance`. Extiende: `storefront_orders`, `sales` con vehicle_id + dispatch_status + total_weight_kg
- **Estado**: ⏳ Pendiente de desarrollo. Fase 1 (DB) es el primer paso. Ver plan detallado en [[modules/ferreteria/ferreteria]]

---

← [[DAIMUZ]] | → [[modules/ferreteria/ferreteria]]
