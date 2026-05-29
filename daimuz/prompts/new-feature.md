# 🤖 Prompt: Nuevo Feature

> Copia y personaliza este template cuando necesites que Claude agregue una funcionalidad.

---

## Template

```
Lee primero:
- [[DAIMUZ]]
- [[modules/[modulo]/[modulo]]] (el módulo afectado)
- [[flows/[flujo-relacionado]]] (si aplica)
- [[brain/coding-standards]]

---

Quiero agregar el siguiente feature:

**Descripción:** [qué debe hacer]

**Módulo:** [nombre del módulo]

**Frontend:**
- Componente a modificar: `frontend/components/[archivo].tsx`
- Qué debe mostrar/permitir: [descripción]

**Backend:**
- Endpoint nuevo: `[METHOD] /api/[ruta]`
- Lógica: [qué hace el service]
- Tablas afectadas: [tabla(s)]

**Restricciones:**
- Sigue el patrón routes → controller → service
- tenant_id siempre de req.user.tenantId
- Errores con AppError en español
- Respuesta: { success: true, data: ... }
- No modifiques otros archivos sin avisarme

**Roles que pueden usar esto:** [lista de roles]
```

---

## Ejemplo real

```
Lee primero:
- [[DAIMUZ]]
- [[modules/inventory/inventory]]
- [[flows/inventory-flow]]

Quiero agregar transferencias de stock entre sedes.

Frontend:
- Componente: frontend/components/inventory-list.tsx
- Agregar botón "Transferir" en cada producto
- Modal: seleccionar sede destino + cantidad

Backend:
- POST /api/inventory/transfer
- Body: { productId, fromSedeId, toSedeId, quantity, reason }
- Lógica: verifica stock en origen, descuenta origen, suma destino
- Tablas: stock_movements (2 registros: salida y entrada)

No modificar nada más sin preguntarme.
```

---

← [[DAIMUZ]] | → [[prompts/new-module]]
