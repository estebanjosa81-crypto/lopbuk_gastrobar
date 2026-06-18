# scanner — compressed

> 5 líneas. Si necesitas más → lee `scanner.md`

- **Modos**: integrado en POS (cámara → carrito) · inventario (cámara → buscar producto) · remoto via QR (otro dispositivo como escáner) · USB (teclado físico)
- **Modo remoto**: POS genera QR con session token → móvil abre /scanner?session=token → escanea → Socket.io → POS agrega al carrito
- **Busca por**: `barcode` o `sku` en tabla `products` del tenant
- **Sin backend propio**: usa `scanner.socket.ts` para WebSocket. El resultado siempre va al carrito del POS.
- **Archivos**: `scanner.socket.ts`, `barcode-scanner.tsx`, `remote-scanner.tsx`, `app/scanner-remote/[sessionId]/page.tsx`

---

← [[DAIMUZ]] | → [[modules/scanner/scanner]]
