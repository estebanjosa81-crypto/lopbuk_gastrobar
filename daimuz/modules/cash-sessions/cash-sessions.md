# 🏧 Módulo: Cash Sessions (Sesiones de Caja)

## Qué hace
Controla las sesiones de caja: apertura con monto inicial, registro de movimientos durante el turno, y cierre con arqueo (conteo físico vs calculado).

## Archivos
- `backend/src/modules/cash-sessions/cash-sessions.service.ts`
- `backend/src/modules/cash-sessions/cash-sessions.routes.ts`
- `frontend/components/cash-register.tsx`

## APIs
```
GET  /api/cash-sessions            → historial de sesiones
GET  /api/cash-sessions/active     → sesión activa actual (si hay)
GET  /api/cash-sessions/:id        → sesión con todos sus movimientos
POST /api/cash-sessions/open       → { initialAmount, sedeId, notes }
POST /api/cash-sessions/close      → { countedAmount, notes }
```

## Ciclo de una Sesión
```
1. Cajero abre caja: monto inicial declarado
2. Durante el turno: cada venta en efectivo suma al calculado
3. Cajero cierra: cuenta físicamente el efectivo
4. Sistema calcula: contado - calculado = diferencia
5. Si diferencia > umbral → alerta al admin
6. Sesión queda como histórico INMUTABLE
```

## Reglas Críticas
- **Solo una sesión activa por sede** a la vez
- **Sin sesión abierta = no se puede vender** en esa sede
- Los históricos de caja son **inmutables** (nunca se editan)
- Solo `admin` puede ver el historial completo de todas las sesiones

## Dependencias
- [[modules/sales/sales]] — las ventas necesitan `cash_session_id`
- [[modules/finances/finances]] — los cierres alimentan el flujo de caja
- [[modules/pos/pos]] — bloquea ventas si no hay sesión activa
- [[modules/dashboard/dashboard]] — muestra estado de caja actual

---
← [[DAIMUZ]]
