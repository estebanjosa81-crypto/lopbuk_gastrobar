# 🧠 Por qué — Razonamiento detrás de las Reglas

> Las reglas están en [[governance/universal-constraints]].  
> Este archivo explica el **por qué** de las decisiones arquitecturales más importantes.

---

## ¿Por qué `tenant_id` siempre del JWT?

**Regla:** `const tenantId = req.user.tenantId` — nunca del body ni params.

**Razonamiento:** Un atacante podría enviar `{ tenantId: "otro-negocio" }` en el body e intentar acceder a datos de otro tenant. El JWT está firmado con `JWT_SECRET` y no puede ser modificado sin ser detectado. Es la única fuente verificada del tenant.

→ Decisión completa: [[decisions/multitenant-strategy]]

---

## ¿Por qué JWT + httpOnly cookie?

**Regla:** Token en cookie httpOnly, no en localStorage.

**Razonamiento:** localStorage es accesible desde JavaScript → cualquier script inyectado (XSS) podría robar el token. Una cookie httpOnly no es accesible desde JS bajo ninguna circunstancia. El tradeoff: CSRF → mitigado con `sameSite: 'strict'`.

→ Decisión completa: [[decisions/auth-approach]]

---

## ¿Por qué Zustand y no Redux?

**Regla:** Estado global en Zustand. No agregar Redux.

**Razonamiento:** Redux requiere actions, reducers, selectors, middleware → 4-5 archivos por feature. Zustand es 1 store con funciones directas. Para el tamaño de Lopbuk (un equipo pequeño, 40+ módulos), el overhead de Redux no aporta valor y ralentiza el desarrollo.

→ Decisión completa: [[decisions/state-management]]

---

## ¿Por qué MySQL directo y no ORM?

**Regla:** `db.execute('SELECT ...', [params])` — sin TypeORM ni Prisma.

**Razonamiento:** Los ORMs abstrae el SQL generando queries subóptimas para joins complejos y datos financieros. Los errores de "N+1" son comunes. Con MySQL directo, cada query es exactamente lo que se escribe, optimizable, y más fácil de debuggear. El costo: más código verbose en services.

→ Decisión completa: [[decisions/db-design]]

---

## ¿Por qué Soft Delete?

**Regla:** `UPDATE ... SET is_active = 0` — nunca `DELETE` físico en datos de negocio.

**Razonamiento:** Los datos de ventas, inventario y clientes son **datos financieros y de auditoría**. Borrarlos físicamente viola principios básicos de contabilidad y hace imposible la trazabilidad. Un cliente que "se fue" puede volver. Un producto descontinuado puede reactivarse. La historia siempre importa.

---

## ¿Por qué toda la lógica en `*.service.ts`?

**Regla:** Controllers y routes no tienen lógica de negocio.

**Razonamiento:** Si la lógica está en el controller, no se puede testear sin levantar HTTP. Si está en la route, no se puede reutilizar. El service es la unidad de negocio: autónoma, testeable, reutilizable desde cualquier lugar (HTTP, Socket.io, jobs background).

---

← [[governance/universal-constraints]] | [[DAIMUZ]] | → [[decisions/multitenant-strategy]]
