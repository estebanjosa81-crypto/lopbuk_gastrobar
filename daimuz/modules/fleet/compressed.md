# fleet — compressed

> 5 líneas. Módulo sin doc completo aún.

- **Qué hace**: gestión de la flota de vehículos del tenant — registro, estados y mantenimientos
- **Tipos de vehículo**: `planta` (>500kg carga pesada) · `ligera` (50–500kg) · `moto` (<50kg domicilios)
- **Estados**: `disponible` · `en_ruta` · `mantenimiento` · `inactivo` — el dispatcher solo puede asignar vehículos `disponible`
- **Mantenimientos**: `fleet_maintenance` registra preventivos/correctivos con costo, fecha y técnico
- **Archivos**: `fleet.routes.ts`, `fleet-management.tsx` · Tablas: `fleet_vehicles`, `fleet_maintenance` · Relacionado: [[modules/delivery/compressed]]

---

← [[DAIMUZ]] | [[indexes/modules-index]]
