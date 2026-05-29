# 🏠 Módulo: Real Estate (Inmobiliaria)

## Qué hace
Módulo vertical para negocios inmobiliarios. Gestiona propiedades, clientes compradores/arrendatarios, visitas y procesos de venta/arriendo.

## Archivos
- `backend/src/modules/realestate/realestate.service.ts`
- `backend/src/modules/realestate/realestate.routes.ts`
- `frontend/components/realestate.tsx`

## APIs
```
GET    /api/realestate             → lista propiedades
GET    /api/realestate/:id         → propiedad con detalles
POST   /api/realestate             → registra propiedad
PUT    /api/realestate/:id         → actualiza propiedad
DELETE /api/realestate/:id         → desactiva propiedad
GET    /api/realestate/clients     → clientes interesados
POST   /api/realestate/visit       → agenda visita
```

## Tipos de Propiedad
`apartamento` · `casa` · `local` · `bodega` · `lote` · `oficina`

## Estados de Propiedad
```
disponible → en_negociacion → vendida/arrendada → inactiva
```

## Estado Actual
🔄 En ajuste — módulo base funcional, refinando flujos de negociación

## Dependencias
- [[modules/customers/customers]] — usa el CRM para clientes inmobiliarios
- [[modules/storefront/storefront]] — puede mostrar propiedades en el storefront público

---
← [[DAIMUZ]]
