# reviews — compressed

> 5 líneas. Módulo sin doc completo aún.

- **Qué hace**: reseñas de productos del storefront — los clientes califican (1-5 ⭐), el comerciante modera
- **Flujo**: cliente envía reseña → estado `pendiente` → comerciante aprueba/rechaza → si aprobada aparece en la tienda
- **Respuesta**: el comerciante puede agregar `reply` a una reseña — se muestra públicamente en el producto
- **Imágenes**: soporta hasta 2 fotos por reseña (`image_url_1`, `image_url_2`)
- **Archivos**: `reviews.service.ts`, `reviews.controller.ts`, `reviews.routes.ts`, `reviews-panel.tsx` · Tabla: `product_reviews`

---

← [[DAIMUZ]] | [[indexes/modules-index]]
