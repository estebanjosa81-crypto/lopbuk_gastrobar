# recipes — compressed

> 5 líneas. Si necesitas más → lee `recipes.md`

- **BOM**: receta = lista de ingredientes (products) con cantidad. `food_cost = Σ(product.cost × qty_usada)` · `food_cost% = food_cost / precio_venta × 100`
- **Producción**: POST /api/recipes/:id/produce → descuenta automáticamente ingredientes del inventario (stock_movement 'salida')
- **Dinámico**: food cost se recalcula automáticamente si cambia `products.cost` de cualquier ingrediente
- **Restricción**: ingrediente debe existir como producto activo en inventario del tenant
- **Archivos**: `recipes.service.ts`, `recipes.routes.ts`, `recipes.tsx`

---

← [[DAIMUZ]] | → [[modules/recipes/recipes]]
