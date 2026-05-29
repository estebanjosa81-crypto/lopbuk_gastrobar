# 🔒 Governance — Restricciones Universales

> Estas reglas no se negocian. Si algo las viola, está mal arquitecturalmente.

---

## 🏢 Multi-tenancy

```typescript
// ✅ SIEMPRE — tenantId del JWT
const tenantId = req.user.tenantId

// ❌ NUNCA — puede ser manipulado
const tenantId = req.body.tenantId
const tenantId = req.params.tenantId
const tenantId = req.query.tenantId
```

**Toda query a la DB debe incluir `tenant_id = ?`** — sin excepción.  
El superadmin es la única excepción, y debe estar explícitamente codificada.

---

## 🗑️ Soft Delete

```sql
-- ✅ CORRECTO
UPDATE products SET is_active = 0 WHERE id = ? AND tenant_id = ?

-- ❌ NUNCA en datos de negocio
DELETE FROM products WHERE id = ?
```

Tablas con soft delete: `products`, `users`, `customers`, `sedes`, `tenants`, `orders`, `sales` (cancelación)

---

## 📦 Stock

```typescript
// Stock nunca baja de 0
if (product.stock < quantity) {
  throw new AppError('Stock insuficiente', 400)
}

// Todo movimiento requiere reason para auditoría
if (!reason) throw new AppError('Debe especificar el motivo del movimiento', 400)
```

---

## 🏧 Caja

```
Sin cash_session activa → no se puede vender
Solo 1 sesión activa por sede
Los históricos de caja son inmutables — NUNCA se editan
```

---

## 🔐 Auth Pattern

```typescript
// ✅ CORRECTO — parámetros sueltos
router.get('/', verifyToken, authorize('admin', 'cajero'), controller.get)

// ❌ INCORRECTO — no acepta array
authorize(['admin', 'cajero'])  // no funciona

// ✅ Roles con acceso gastrobar
authorize('comerciante', 'superadmin')
```

---

## 📝 Código

```typescript
// ✅ Toda la lógica en service
// ❌ Nunca lógica en controller o routes

// ✅ Tipos explícitos en servicios
// ❌ No usar `any` en services (prohibido)

// ✅ AppError para errores con HTTP code correcto
throw new AppError('mensaje en español', 400)

// ✅ Respuesta estándar
res.json({ success: true, data: result })
res.status(201).json({ success: true, data: created })
```

---

## 🌐 API

```
Naming: kebab-case → /api/cash-sessions, /api/stock-movements
Métodos: GET=listar, POST=crear, PUT=reemplazar, PATCH=actualizar parcial, DELETE=eliminar
Los errores 4xx son del cliente, 5xx son del servidor
Mensajes de error en español (usuarios hispanohablantes)
```

---

## 🗄️ DB

```sql
-- Todo lo que tiene dueño tiene tenant_id
-- PKs son UUID v4 (VARCHAR(36))
-- Timestamps en todas las tablas
-- Columnas booleanas: is_[estado] (is_active, is_completed)
-- FKs: [tabla_singular]_id (product_id, tenant_id, user_id)
```

---

## ⚡ Lo que Claude NO puede hacer sin preguntar explícitamente

1. Cambiar el schema de la base de datos
2. Modificar `auth.middleware.ts`
3. Cambiar el formato de respuesta `{ success, data, error }`
4. Tocar archivos de config: `.env`, `database.ts`, `app.ts`
5. Refactorizar más código del que se pidió
6. Agregar dependencias npm sin avisar

---

← [[DAIMUZ]] | → [[governance/api-standards]]
