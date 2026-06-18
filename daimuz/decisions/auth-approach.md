# 🔐 Decisión: Enfoque de Autenticación

## Decisión
**JWT + httpOnly Cookie + Google OAuth**

## Alternativas consideradas

| Opción | Descartada por |
|---|---|
| JWT en localStorage | Vulnerable a XSS attacks |
| Sesiones en servidor | Requiere estado en servidor, no escala horizontal |
| Solo Google OAuth | Usuarios sin Google quedan fuera |
| Solo local | Fricción en onboarding |

## Por qué JWT

- **Sin estado en servidor** → cualquier instancia del backend puede validar
- **Contiene el payload necesario** → userId, tenantId, role en un solo objeto
- **Expira automáticamente** → 7 días, sin sesiones que limpiar

## Por qué httpOnly Cookie

- **XSS proof** → JavaScript no puede leer la cookie
- **CSRF mitigado** → con SameSite=Lax
- **Automático** → el browser lo manda en cada request

## Por qué también en memoria (auth-store)

Hay clientes (mobile apps, Postman, otros) que no manejan cookies bien.  
El header `Authorization: Bearer <token>` es el fallback.

## Flujo Dual

```
Browser → usa httpOnly cookie (automático, seguro)
Cliente no-browser → usa header Authorization: Bearer <token>
```

---

← [[decisions/multitenant-strategy]] | [[DAIMUZ]] | → [[decisions/state-management]]
