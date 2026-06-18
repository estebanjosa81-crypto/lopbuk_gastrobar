# 🚚 Sinapsis: Cadena Delivery

> Desde que el cliente hace un pedido online hasta que llega a su puerta.

## Flujo Completo

```
CLIENTE (storefront público en /links/[slug])
    │
    ├──► Navega productos con variantes (chips color/talla)
    │     └──► Solo variantes con stock > 0 visibles
    │     └──► Al cambiar cantidad → resolvePrice() calcula precio del tier
    │     └──► Badge "Mejor precio desde N uds." si hay tiers
    │
    ▼
POST /api/storefront/:slug/order
    │
    ├──► Valida: slug existe, variantes activas, stock disponible
    ├──► [ATÓMICO] UPDATE product_variants SET stock = stock - qty
    │     WHERE id=? AND stock >= qty  (si affectedRows=0 → error)
    ├──► inventory_movements INSERT (reference_type='storefront_order')
    ├──► storefront_orders INSERT (estado: 'pendiente')
    │
    └──► socket.emit('new-storefront-order', order) → panel del negocio
              │
              ▼
ADMIN / DISPATCHER (dispatch-panel.tsx)
    │
    ├──► ve pedido con peso total + dirección + mapa
    │
    └──► POST /api/delivery/assign { orderId, driverId, vehicleId }
              │
              ├──► deliveries INSERT (estado: 'asignado')
              │
              └──► socket.emit('delivery-assigned', {orderId, driver})
                        │
                        ▼
CONDUCTOR (driver-panel.tsx)
    │
    ├──► PATCH /api/delivery/:id/status → 'en_camino'
    │         └──► socket.emit('order-status') → cliente/admin pueden ver
    │
    └──► PATCH /api/delivery/:id/status → 'entregado'
              └──► orders/storefront_orders UPDATE status = 'entregado'
```

## Flujo WhatsApp (Evolution API)

```
CLIENTE envía mensaje WhatsApp
    │
    ▼
POST /api/whatsapp/webhook  (Evolution API → backend)
    │
    └──► agent.service.processMessage(message, tenantId)
              │
              ├──► RAG: busca en catálogo, precios, horarios
              ├──► Function Calling: puede crear pedido, consultar estado
              └──► whatsapp.service.sendMessage(response, phone)
```

## Impacto por Cambio

### Si cambias `storefront.service.ts`
- ⚠️ Afecta: `orders` (pedidos vienen de aquí), `inventory` (debe validar stock), `delivery` (asignación después de confirmar)
- ✅ Verificar: slug único por tenant, productos públicos/activos, geolocalización guardada

### Si cambias `delivery.service.ts`
- ⚠️ Afecta: `orders` (actualiza estado), `driver-panel.tsx` (depende de socket), `whatsapp` (puede notificar)
- ✅ Verificar: solo admin/dispatcher puede asignar, driver solo ve sus pedidos

### Si cambias `whatsapp.service.ts`
- ⚠️ Afecta: `agent` (envía respuestas), `chatbot_config` (toma configuración del tenant)
- ✅ Verificar: Evolution API v2 formato correcto (plano, no nested), WHATSAPP_TOKEN válido

### Si cambias `agent.service.ts`
- ⚠️ Afecta: `whatsapp` (respuestas al cliente), `chatbot_conversations` (guarda historial), `agent.tools.ts` (function calls disponibles)
- ✅ Verificar: isProductQuery() solo sugiere productos cuando se pide explícitamente

## Variables de Entorno Críticas

```env
# Evolution API
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
WHATSAPP_INSTANCE_NAME=

# Pendiente de configurar en Dokploy
```

---

**Módulos de esta cadena:** [[modules/storefront/storefront]] · [[modules/orders/orders]] · [[modules/delivery/delivery]] · [[modules/whatsapp/whatsapp]] · [[modules/agent/agent]]

← [[synapses/gastrobar-chain]] | [[DAIMUZ]] | → [[synapses/saas-chain]]
