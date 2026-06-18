# client — compressed

> 5 líneas. Módulo sin doc completo aún.

- **Qué es**: rutas para el cliente registrado del storefront — gestiona su perfil, direcciones y consulta sus propios pedidos
- **Direcciones**: `user_addresses` — el cliente guarda múltiples direcciones con label, coordenadas y `is_default`
- **Encriptación**: `users.phone`, `cedula`, `address`, `neighborhood` se encriptan con AES-256-CBC al guardar (`utils/crypto.ts`)
- **Diferencia con storefront**: el módulo `storefront` es el catálogo público; `client` es el área privada del cliente autenticado
- **Archivos**: `client.routes.ts` · Tablas: `users` (campos de perfil), `user_addresses`

---

← [[DAIMUZ]] | [[indexes/modules-index]]
