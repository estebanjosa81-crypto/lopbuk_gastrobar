# portfolio — compressed

> 5 líneas. Módulo sin doc completo aún.

- **Qué es**: portafolio público de la marca DAIMUZ/Lopbuk — landing pública en `/portfolio` que muestra tenants destacados y planes
- **Singleton**: tabla `portfolio_config` siempre tiene `id = 1` — 1 solo registro de configuración global
- **Config**: hero_title, hero_subtitle, hero_image_url, contact_email/whatsapp/instagram, accent_color, featured_tenant_ids (JSON array)
- **`show_featured_stores`**: si activo, muestra las tiendas de los tenants en `featured_tenant_ids` como casos de éxito
- **Archivos**: `portfolio.routes.ts`, `app/portfolio/page.tsx` · Tabla: `portfolio_config`

---

← [[DAIMUZ]] | [[indexes/modules-index]]
