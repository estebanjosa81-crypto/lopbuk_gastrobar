# restbar-finanzas — compressed

> 5 líneas. Si necesitas más → [[modules/restbar-finanzas/restbar-finanzas]]

- **Qué hace**: tracker financiero del gastrobar — gastos variables, ingresos diarios, gastos fijos, resumen quincenal con ganancia neta
- **Solo admins**: roles `superadmin`, `comerciante`, `administrador_rb` — cajero/mesero NO ven Finanzas
- **Auto-timestamp**: `registered_at` lo pone el servidor al insertar — nunca confiar en la fecha del cliente
- **Resumen quincenal**: Q1 = días 1-15, Q2 = días 16-31. Gastos fijos se prorratean por período
- **Archivos**: `restbar.finanzas.routes.ts`, `restbar-finanzas.tsx` · **Tablas**: `rb_gastos`, `rb_ingresos_diarios`, `rb_gastos_fijos`

---

← [[modules/gastrobar-ops/compressed]] | [[DAIMUZ]] | → [[modules/restbar-finanzas/restbar-finanzas]]
