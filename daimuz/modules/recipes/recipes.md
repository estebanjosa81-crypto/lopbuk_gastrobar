# 🍳 Módulo: Recipes (Recetas BOM)

## Qué hace
Gestiona recetas de platos y bebidas con su lista de ingredientes (Bill of Materials). Calcula food cost en tiempo real y descuenta ingredientes del inventario al producir.

## Archivos
- `backend/src/modules/recipes/recipes.service.ts`
- `backend/src/modules/recipes/recipes.routes.ts`
- `frontend/components/recipes.tsx`

## APIs
```
GET    /api/recipes              → lista recetas
GET    /api/recipes/:id          → receta con ingredientes
POST   /api/recipes              → crea receta BOM
PUT    /api/recipes/:id          → actualiza receta
DELETE /api/recipes/:id          → elimina receta
GET    /api/recipes/:id/cost     → calcula food cost en tiempo real
POST   /api/recipes/:id/produce  → produce: descuenta ingredientes
```

## Food Cost

```
Food Cost = Σ(precio_ingrediente × cantidad_usada)
Food Cost % = (Food Cost / Precio_de_venta) × 100

Meta saludable: < 30% en gastrobar
```

## Reglas Críticas
- Al producir → descuenta automáticamente ingredientes del [[modules/inventory/inventory]]
- El food cost se recalcula si cambia el costo de un ingrediente
- Un ingrediente de la receta debe existir como producto en inventario

## Dependencias
- [[modules/inventory/inventory]] — ingredientes son productos de inventario
- [[modules/gastrobar-ops/gastrobar-ops]] — forma parte del centro de mando

---
← [[DAIMUZ]]
