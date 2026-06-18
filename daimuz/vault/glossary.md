# 📖 Glosario del Dominio

> Términos del negocio y del sistema que Claude debe conocer.

## Términos del Negocio

| Término | Definición |
|---|---|
| **Tenant** | Un negocio cliente de Lopbuk (un gastrobar, una tienda, etc.) |
| **Sede** | Sucursal de un negocio (un tenant puede tener varias sedes) |
| **POS** | Point of Sale — el terminal de ventas |
| **Kardex** | Registro histórico de todos los movimientos de inventario |
| **Merma** | Pérdida de producto (vencimiento, daño, desperdicio) |
| **Fiado** | Venta a crédito sin pago inmediato (deuda del cliente) |
| **Cupo de crédito** | Límite máximo de deuda permitido para un cliente |
| **Food Cost** | Costo de los ingredientes de un plato como % del precio de venta |
| **BOM** | Bill of Materials — lista de ingredientes de una receta |
| **Nivel PAR** | Stock mínimo deseado por período (Periodic Automatic Replenishment) |
| **Arqueo de caja** | Conteo físico del efectivo al cerrar caja |
| **Comanda** | Pedido de una mesa en un restaurante/bar |
| **Ticket promedio** | Valor promedio por venta/transacción |
| **Slug** | Identificador único en URL (ej: `mi-gastrobar`) |

## Roles del Sistema

| Rol | Quién es |
|---|---|
| `superadmin` | Dueño de la plataforma Lopbuk |
| `admin` | Dueño o gerente del negocio |
| `cajero` | Empleado de caja/POS |
| `cocinero` | Chef o cocinero (ve cola de cocina) |
| `bartender` | Bartender (ve cola de barra) |
| `mesero` | Mesero/camarero (toma pedidos en mesa) |
| `vendedor` | Vendedor externo o agente comercial |
| `driver` | Conductor de delivery |
| `dispatcher` | Despachador (asigna pedidos a drivers) |
| `cliente` | Cliente final (accede a tienda online) |

## Acrónimos

| Acrónimo | Significado |
|---|---|
| POS | Point of Sale |
| CRM | Customer Relationship Management |
| BOM | Bill of Materials |
| PAR | Periodic Automatic Replenishment |
| SaaS | Software as a Service |
| JWT | JSON Web Token |
| SSR | Server-Side Rendering |
| CSR | Client-Side Rendering |

---

← [[DAIMUZ]] | → [[vault/integrations]]
