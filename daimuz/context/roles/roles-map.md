# 👥 Mapa de Roles

> Qué puede hacer cada rol y qué módulos usa.

## superadmin
**Es:** Dueño de la plataforma Lopbuk  
**Accede a:** Todo + gestión de todos los tenants  
**Módulos clave:** [[modules/tenants/tenants]] · [[modules/subscriptions/subscriptions]] · [[modules/finances/finances]]

## admin
**Es:** Dueño o gerente del negocio  
**Accede a:** Todo dentro de su tenant  
**Módulos clave:** [[modules/dashboard/dashboard]] · [[modules/finances/finances]] · [[modules/inventory/inventory]] · [[modules/sales/sales]] · [[modules/customers/customers]] · [[modules/purchases/purchases]]

## cajero
**Es:** Empleado de caja/POS  
**Accede a:** Ventas, caja, búsqueda de productos  
**Módulos clave:** [[modules/pos/pos]] · [[modules/cash-sessions/cash-sessions]] · [[modules/sales/sales]]  
**NO puede:** Finanzas, configuración, usuarios

## cocinero
**Es:** Chef o cocinero  
**Accede a:** Cola de pedidos de cocina  
**Módulos clave:** [[modules/orders/orders]] · [[modules/gastrobar-ops/gastrobar-ops]]  
**NO puede:** Ventas, inventario, finanzas

## bartender
**Es:** Bartender  
**Accede a:** Cola de pedidos de barra  
**Módulos clave:** [[modules/orders/orders]] · [[modules/gastrobar-ops/gastrobar-ops]] · [[modules/recipes/recipes]]

## mesero
**Es:** Mesero o camarero  
**Accede a:** Mesas, comandas, pedidos  
**Módulos clave:** [[modules/orders/orders]] · [[modules/gastrobar-ops/gastrobar-ops]] · [[modules/pos/pos]]

## vendedor
**Es:** Vendedor externo o agente comercial  
**Accede a:** Sus propias ventas y clientes asignados  
**Módulos clave:** [[modules/sales/sales]] · [[modules/customers/customers]] · [[modules/pos/pos]]

## driver
**Es:** Conductor de delivery  
**Accede a:** Sus entregas asignadas  
**Módulos clave:** [[modules/delivery/delivery]] · [[modules/orders/orders]]

## dispatcher
**Es:** Despachador  
**Accede a:** Todos los pedidos de delivery, asignación  
**Módulos clave:** [[modules/delivery/delivery]] · [[modules/orders/orders]]

## cliente
**Es:** Cliente final del negocio  
**Accede a:** Tienda online, historial de sus compras  
**Módulos clave:** [[modules/storefront/storefront]] · [[modules/orders/orders]] · [[modules/customers/customers]]

---

← [[DAIMUZ]]
