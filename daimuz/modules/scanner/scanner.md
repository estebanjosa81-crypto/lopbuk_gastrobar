# 📷 Módulo: Scanner (Escáner)

## Qué hace
Permite escanear códigos de barras y QR para buscar productos en el POS, registrar entradas de inventario, o identificar pedidos. Funciona tanto con cámara del dispositivo como con escáneres USB físicos.

## Archivos
- `backend/src/modules/scanner/scanner.socket.ts` — manejo via WebSocket
- `frontend/components/barcode-scanner.tsx` — escáner vía cámara
- `frontend/components/remote-scanner.tsx` — escáner remoto (otro dispositivo)
- `frontend/app/scanner/` — ruta standalone para escáner

## Modos de Operación

| Modo | Descripción | Caso de Uso |
|---|---|---|
| **Integrado en POS** | Escanea y agrega al carrito | Ventas rápidas |
| **Inventario** | Escanea para buscar/actualizar stock | Conteo físico |
| **Remoto via QR** | Otro dispositivo actúa como escáner | Tablet separada |
| **USB** | Escáner físico enviando teclas | Tienda física |

## Flujo Remoto (via Socket.io)
```
1. POS genera código QR con session token
2. Empleado escanea QR con su móvil
3. Móvil abre /scanner?session=token
4. Escanea código de barras del producto
5. Socket.io emite el código al POS
6. POS agrega el producto al carrito automáticamente
```

## Dependencias
- [[modules/pos/pos]] — el resultado del escaneo va al carrito
- [[modules/inventory/inventory]] — búsqueda de producto por SKU/barcode
- [[architecture/overview]] — usa Socket.io para el modo remoto

---
← [[DAIMUZ]]
