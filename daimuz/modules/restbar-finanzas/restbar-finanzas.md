# Módulo: RestBar Finanzas — Tracker Financiero del Gastrobar

> Sub-módulo del RestBar. Control de gastos y rentabilidad quincenal.  
> Acceso restringido a admins — el mesero/cajero NO lo ve.

---

## Qué hace

Permite al dueño/administrador del gastrobar llevar un control financiero operativo:

| Sección | Función |
|---|---|
| **Timeline** | Feed cronológico de todos los gastos e ingresos del mes |
| **Gastos variables** | Registro de egresos con concepto, categoría, cantidad y valor |
| **Ingresos diarios** | Registro diario de ventas + ganancia (upsert por fecha) |
| **Gastos fijos** | Lista de gastos recurrentes con período (quincenal/semanal/mensual) |
| **Resumen quincenal** | P&L por quincena con ganancia neta = ventas - gastos_var - gastos_fijos |

---

## Tablas

### `rb_gastos` — Gastos variables
```sql
id            VARCHAR(36)   PK
tenant_id     VARCHAR(36)   NOT NULL
concepto      VARCHAR(255)  NOT NULL
categoria     VARCHAR(50)   DEFAULT 'egreso'
cantidad      DECIMAL(10,2) DEFAULT 1
valor_unitario DECIMAL(12,2) NOT NULL
total         DECIMAL(12,2) NOT NULL  -- = cantidad * valor_unitario (redondeado)
notas         TEXT          NULL
registered_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP  -- servidor, NO cliente
created_by    VARCHAR(36)   NULL
```

### `rb_ingresos_diarios` — Ingresos por día
```sql
id           VARCHAR(36)   PK
tenant_id    VARCHAR(36)   NOT NULL
fecha        DATE          NOT NULL
num_pedidos  INT           DEFAULT 0
valor_ventas DECIMAL(12,2) DEFAULT 0
ganancia     DECIMAL(12,2) DEFAULT 0
notas        TEXT          NULL
created_at / updated_at   TIMESTAMP
-- UNIQUE (tenant_id, fecha) → upsert ON DUPLICATE KEY UPDATE
```

### `rb_gastos_fijos` — Gastos recurrentes
```sql
id        VARCHAR(36)   PK
tenant_id VARCHAR(36)   NOT NULL
nombre    VARCHAR(255)  NOT NULL
valor     DECIMAL(12,2) NOT NULL
periodo   ENUM('quincenal','semanal','mensual') DEFAULT 'quincenal'
is_active TINYINT(1)    DEFAULT 1
created_at / updated_at  TIMESTAMP
```

---

## Endpoints

```
GET  /api/restbar/finanzas/timeline?month=YYYY-MM        feed cronológico
GET  /api/restbar/finanzas/gastos?from=&to=&quincena=    lista gastos
POST /api/restbar/finanzas/gastos                        registra gasto
PUT  /api/restbar/finanzas/gastos/:id                    edita gasto
DEL  /api/restbar/finanzas/gastos/:id                    elimina gasto
GET  /api/restbar/finanzas/ingresos?month=YYYY-MM        ingresos del mes
POST /api/restbar/finanzas/ingresos                      upsert ingreso diario
DEL  /api/restbar/finanzas/ingresos/:id                  elimina ingreso
GET  /api/restbar/finanzas/gastos-fijos                  lista gastos fijos
POST /api/restbar/finanzas/gastos-fijos                  crea gasto fijo
PUT  /api/restbar/finanzas/gastos-fijos/:id              edita gasto fijo
DEL  /api/restbar/finanzas/gastos-fijos/:id              elimina gasto fijo
GET  /api/restbar/finanzas/resumen?month=YYYY-MM         P&L quincenal
```

---

## Regla del Resumen Quincenal

```
ganancia_neta = ventas - gastos_variables - gastos_fijos_prorrateados

Prorrateo de gastos fijos:
  quincenal → valor / 2  (la mitad por quincena)
  semanal   → valor * 2  (~2 semanas por quincena)
  mensual   → valor / 2
```

---

## Archivos

| Tipo | Ruta |
|---|---|
| Backend routes | `backend/src/modules/restbar/restbar.finanzas.routes.ts` |
| Frontend component | `frontend/components/restbar-finanzas.tsx` |

---

## Roles con acceso

| Rol | Acceso |
|---|---|
| superadmin | ✅ |
| comerciante | ✅ |
| administrador_rb | ✅ |
| cajero | ❌ |
| mesero / cocinero / bartender | ❌ |

---

## Sinapsis

- Conecta con [[modules/gastrobar-ops/gastrobar-ops]] — son vistas del mismo negocio
- Los ingresos diarios aquí son **manuales** — no se sincronizan con `sales` automáticamente
- Futuro: trigger que al cerrar caja rb_orders sume al ingreso diario automáticamente

---

← [[modules/gastrobar-ops/gastrobar-ops]] | [[DAIMUZ]] | → [[modules/merma/merma]]
