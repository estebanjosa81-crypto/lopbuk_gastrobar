# printers — compressed

> 5 líneas. Módulo sin doc completo aún.

- **Qué hace**: registra y configura las impresoras térmicas POS de cada tenant
- **Tipos de conexión**: `lan` (IP + puerto 9100) · `usb` · `bluetooth`
- **`assigned_module`**: cada impresora se asigna a un área: `caja` · `cocina` · `bar` · `factura`
- **Paper width**: 80mm (estándar) o 58mm (mini) — afecta el formato de impresión
- **Archivos**: `printers.service.ts`, `printers.controller.ts`, `printers.routes.ts`, `printers.tsx` · Tabla: `printers`

---

← [[DAIMUZ]] | [[indexes/modules-index]]
