# 👥 Módulo: Customers

## Qué hace
CRM básico de clientes. Registra datos de contacto, historial de compras, manejo de créditos y segmentación básica.

## Archivos

**Backend:**
- `backend/src/modules/customers/customers.routes.ts`
- `backend/src/modules/customers/customers.controller.ts`
- `backend/src/modules/customers/customers.service.ts`
- `backend/src/modules/credits/credits.service.ts` — fiados
- `backend/src/modules/reviews/reviews.service.ts` — reseñas

**Frontend:**
- `frontend/components/customers.tsx` — CRM principal
- `frontend/components/credits.tsx` — gestión de créditos/fiados
- `frontend/components/fiados.tsx` — listado de fiados
- `frontend/components/fiado-checkout.tsx` — checkout fiado en POS
- `frontend/components/bulk-upload-customers-dialog.tsx` — importación

## APIs

```
GET  /api/customers           → lista con filtros y búsqueda
GET  /api/customers/:id       → perfil completo con historial
POST /api/customers           → crea cliente
PUT  /api/customers/:id       → actualiza datos
DELETE /api/customers/:id     → desactiva (soft)
POST /api/customers/bulk      → importación masiva CSV

GET  /api/credits             → fiados pendientes
GET  /api/credits/:id         → crédito con historial de pagos
POST /api/credits             → registra fiado
POST /api/credits/:id/payment → registra pago (parcial o total)
```

## Datos del Cliente

```typescript
{
  id, tenant_id,
  name, email, phone,
  cedula,                    // documento de identidad
  address, neighborhood,
  credit_limit,              // cupo máximo de crédito
  credit_balance,            // deuda actual
  total_purchases,           // total histórico comprado
  last_purchase_at,
  is_active
}
```

## Flujo de Venta a Crédito (Fiado)

```
1. En POS seleccionar cliente
2. Método de pago: 'fiado'
3. Sistema verifica: credit_balance < credit_limit
4. Si hay cupo: permite la venta
5. Crea registro en credits con monto y fecha
6. Sale no afecta caja hasta cobro real
7. Cuando paga: POST /api/credits/:id/payment
8. Actualiza credit_balance del cliente
```

## Reglas Críticas

- El fiado requiere cliente registrado (no aplica a clientes anónimos)
- Si `credit_balance >= credit_limit` → bloquea nueva venta a crédito
- Los pagos parciales están permitidos
- El historial de créditos nunca se borra

## Dependencias
- [[modules/pos/pos]] — ventas a crédito
- [[modules/sales/sales]] — historial de compras
- [[modules/storefront/storefront]] — clientes de tienda online

---

← [[DAIMUZ]]
