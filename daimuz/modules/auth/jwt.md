# auth — JWT

> Detalle de cómo funciona el token JWT. Ver también: `auth.middleware.ts`

## Payload

```typescript
interface JWTPayload {
  userId: string     // UUID del usuario
  tenantId: string   // UUID del negocio → fuente de verdad de multi-tenancy
  role: UserRole     // rol del usuario en ese tenant
}
```

## Firma y Verificación

```typescript
// Firmar (en auth.service.ts)
const token = jwt.sign(
  { userId, tenantId, role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
)

// Verificar (en auth.middleware.ts)
const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload
```

## Cómo viaja el token

```
1. Login exitoso → backend setea cookie httpOnly
   res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' })

2. El frontend también lo guarda en memoria (auth-store.ts)
   → para usarlo en el header Authorization como fallback

3. Cada request protegido:
   → verifyToken busca primero en Authorization header
   → si no, busca en cookie httpOnly

4. Frontend nunca puede leer la cookie (httpOnly = protección XSS)
```

## Expiración

```
7 días. Al expirar → 401 Unauthorized → frontend redirige a login
No hay refresh token implementado → el usuario debe volver a iniciar sesión
```

## Variables de entorno

```env
JWT_SECRET=string_muy_largo_aleatorio_minimo_32_chars
JWT_EXPIRES_IN=7d
```

---

← [[modules/auth/auth]] | [[modules/auth/middleware]]
