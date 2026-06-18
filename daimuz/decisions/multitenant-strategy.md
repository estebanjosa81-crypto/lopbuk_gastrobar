# 🏢 Decisión: Estrategia Multi-Tenant

## Decisión
**Multi-tenancy por columna** (`tenant_id` en cada tabla)

## Alternativas consideradas

| Estrategia | Descripción | Descartada por |
|---|---|---|
| **DB separada por tenant** | Cada negocio tiene su propia base de datos | Operacionalmente costoso, difícil de escalar |
| **Schema separado por tenant** | Una DB, schemas separados | Complejidad de conexión, MySQL no es ideal |
| **Columna tenant_id** ✅ | Una DB, una tabla, filtrado por tenant_id | **Elegida** |

## Por qué columna

1. **Operacionalmente simple** — una sola DB, un solo schema
2. **Queries eficientes** — con índice en `tenant_id` es igual de rápido
3. **Fácil de mantener** — migraciones afectan a todos a la vez
4. **Reportes cruzados** — superadmin puede hacer analytics globales fácilmente

## La regla de oro derivada

```sql
-- SIEMPRE filtrar por tenant_id
SELECT * FROM products WHERE tenant_id = ? AND is_active = 1

-- El tenant_id viene del JWT, nunca del request body
const { tenantId } = req.user
```

## Riesgo principal

Si un developer olvida el filtro de `tenant_id` → data leak entre negocios.  
**Mitigación:** El middleware de auth pone `req.user.tenantId`. Todos los services lo reciben como parámetro obligatorio.

---

← [[DAIMUZ]] | → [[decisions/auth-approach]]
