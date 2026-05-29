# auth — compressed

> 5 líneas. Si necesitas más → lee `auth.md`

- **Login local**: POST /auth/login → bcrypt.compare → JWT (userId, tenantId, role) → httpOnly cookie
- **Google**: POST /auth/google → verifica idToken → UPSERT usuario → mismo JWT
- **Guard**: `verifyToken` en toda ruta protegida · `authorize('admin', 'cajero')` — params sueltos, NO array
- **Regla crítica**: `tenantId` del JWT = única fuente de verdad. NUNCA del body.
- **Archivos**: `auth.service.ts`, `auth.middleware.ts`, `auth-store.ts`, `auth-form.tsx`

---

← [[DAIMUZ]] | → [[modules/auth/auth]]
