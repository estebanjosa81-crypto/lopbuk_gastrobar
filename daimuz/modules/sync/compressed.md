# sync — compressed

> 5 líneas. Módulo sin doc completo aún.

- **Qué hace**: sincronización offline-first — sube ventas y compras registradas sin conexión cuando vuelve internet
- **Campo clave**: `sales.synced = 0` y `purchase_invoices.synced = 0` marcan registros pendientes · `origin = 'local'` indica que vienen del dispositivo
- **Flujo**: `checkConnectivity()` ping a `CLOUD_API_URL/health` cada intervalo → si online: sube registros con `synced=0` → marca `synced=1`, `synced_at=NOW()`
- **Pull incremental**: descarga cambios de la nube desde `lastPullCursor` (inicializado 24h atrás en primer arranque)
- **Archivos**: `sync.service.ts`, `sync.controller.ts`, `sync.routes.ts`, `sync-status-bar.tsx` · Env: `CLOUD_API_URL`

---

← [[DAIMUZ]] | [[indexes/modules-index]]
