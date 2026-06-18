# merma — compressed

> 5 líneas. Si necesitas más → lee `merma.md`

- **Registro**: tipo (vencimiento/daño/derrame/cocción/ajuste) + reason obligatorio + cost (usa products.cost) → genera stock_movement 'merma'
- **Auditoría**: motivo siempre requerido. El sistema alerta si merma supera umbral configurado.
- **PAR levels**: stock mínimo deseado por producto. `stock_gap = par_level - stock_actual`. Si negativo → compra sugerida.
- **Vive en**: `merma.tsx` tiene 3 tabs: Dashboard KPIs · Registros CRUD · Niveles PAR
- **Archivos**: `merma.service.ts`, `merma.routes.ts`, `merma.tsx`. Tabla: `waste_records`, `par_levels`

---

← [[DAIMUZ]] | → [[modules/merma/merma]]
