# gastrobar-ops — compressed

> 5 líneas. Si necesitas más → lee `gastrobar-ops.md`

- **Modo dueño**: snapshot diario con ventas, food cost %, ganancia real, semáforo (ok/warning/danger), top platos
- **Food cost**: calcula en tiempo real con precios actuales de ingredientes. Cocina <35% OK · Barra <28% OK
- **PAR levels**: stock mínimo deseado. Si stock < PAR → aparece en sugerencias de compra
- **Merma**: requiere motivo obligatorio. Descuenta automáticamente del inventario.
- **Finance Tracker** (tab "Finanzas", solo admin): gastos variables + ingresos diarios + gastos fijos + resumen quincenal P&L → ver [[modules/restbar-finanzas/compressed]]
- **RestBar Caja — tab "Caja"** (`CajaTab` en `restbar.tsx`): 3 modos de cobro: (1) Toda la mesa, (2) **Dividir en partes iguales** — panel ámbar con +/− personas, calcula "cada persona paga $XXX" solo frontend sin cambios backend, (3) Por comensal — requiere ítems pre-asignados a comensales. El selector siempre muestra al elegir una mesa.
- **Archivos**: `gastrobar.service.ts`, `merma.service.ts`, `restbar.finanzas.routes.ts`, `gastrobar-ops.tsx`, `merma.tsx`, `restbar-finanzas.tsx`, `recipes.tsx`
