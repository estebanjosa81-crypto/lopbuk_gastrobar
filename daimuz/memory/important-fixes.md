# 🔧 Fixes Importantes

> Bugs críticos resueltos. Sirven como referencia para no repetirlos.

## Template para agregar un fix

```markdown
### [YYYY-MM-DD] — Título del bug
**Síntoma:** qué pasaba
**Causa:** por qué pasaba
**Fix:** cómo se resolvió
**Archivos:** qué se modificó
**Regla:** qué aprender de esto
```

---

## Historial

### [2026-06-14] — Archivos truncados por mezclar `sed` con el editor (build roto)
**Síntoma:** `next build` falla con `Unterminated block comment` en `app/portfolio/page.tsx:1697`. Varios archivos del portafolio quedaron truncados en disco (page.tsx, lanyard.tsx, package.json, usePortfolio.ts, PortfolioTab.tsx, portfolio.routes.ts).
**Causa:** Se editó `page.tsx` con `sed -i` mientras la vista del editor y el disco estaban desincronizados; `sed` reescribió una copia cortada y se commiteó. Otras escrituras quedaron truncadas por el mismo desfase.
**Fix:** Restaurar `page.tsx` desde el último commit íntegro (`60f4f77`) y reaplicar los cambios de forma atómica; reescribir `lanyard.tsx` completo; restaurar el resto desde HEAD con `git show HEAD:ruta > ruta`. Verificar en disco: fin-de-archivo + balance de llaves + `tsc`.
**Archivos:** portafolio (frontend + backend), `frontend/package.json`
**Regla:** Nunca `sed -i` / `>` para parchar archivos existentes; usar el editor y verificar en disco. Ver [[lessons-learned]].

### [2026-06-14] — Colorimetría no teñía el home (Tema 2)
**Síntoma:** El superadmin generaba y guardaba la paleta, pero el home seguía verde.
**Causa:** El Tema 2 (`MarketplaceHomeGovCo`) pintaba la marca con estilos **inline** (`style={{ background: GREEN }}`, constante JS fija) y nunca recibía la paleta. Los estilos inline NO se pueden sobreescribir con reglas CSS de clases.
**Fix:** Constantes de marca como variables CSS con fallback (`var(--brand-green, #00833E)`); la raíz del tema inyecta `--brand-green`/`--brand-green-dark` desde la prop `themeColors`; `landing-page.tsx` se la pasa.
**Archivos:** `frontend/components/home-theme2.tsx`, `frontend/components/landing-page.tsx`
**Regla:** Todo tema consume la colorimetría vía variables CSS. Nunca hex de marca inline. Ver [[brain/colorimetria]].

### [2026-06-14] — Favicon de pestaña no cambiaba
**Síntoma:** La pestaña seguía mostrando un icono viejo pese a configurar `metadata.icons`.
**Causa:** En el App Router de Next, `app/favicon.ico` se sirve automáticamente en `/favicon.ico` y **tiene prioridad** sobre `metadata.icons`. Existía un `.ico` antiguo.
**Fix:** Se regeneró `app/favicon.ico` desde `public/daimuz-icon.png` (ICO multi-tamaño 16→256).
**Archivos:** `frontend/app/favicon.ico`, `frontend/app/layout.tsx`, `frontend/components/dynamic-favicon.tsx`
**Regla:** Si hay `app/favicon.ico`, ese manda sobre el metadata. Cambiar el icono = regenerar ese archivo. Requiere hard-refresh (cache de navegador).

### [2026-05] — Token en memoria vs localStorage
**Síntoma:** Al refrescar la página se perdía la sesión  
**Causa:** El token estaba solo en memoria (auth-store), no persistía  
**Fix:** Se usa httpOnly cookie como fuente de verdad, el token en memoria es solo para el header Authorization como fallback  
**Archivos:** `frontend/lib/auth-store.ts`, `frontend/lib/api.ts`  
**Regla:** La cookie httpOnly es la sesión real. El token en JS es solo un cache.

---

### [2026-05] — WhatsApp webhook formato Evolution API v2
**Síntoma:** Los mensajes de WhatsApp no llegaban al agente IA  
**Causa:** `setWebhook` enviaba el payload en formato nested (con sub-objeto webhook), pero Evolution API v2 espera el formato plano  
**Fix:** `backend/src/modules/whatsapp/whatsapp.service.ts` — `setWebhook()` corregido a formato plano  
**Archivos:** `backend/src/modules/whatsapp/whatsapp.service.ts`  
**Regla:** Siempre verificar el formato exacto de payload con la versión exacta de la API externa. v1 y v2 de Evolution API tienen formatos diferentes.

---

### [2026-05] — Agente IA respondía con productos no pedidos
**Síntoma:** El agente incluía sugerencias de productos en respuestas a preguntas genéricas (envíos, horarios, etc.)  
**Causa:** El RAG incluía el catálogo de productos en el contexto de TODOS los mensajes  
**Fix:** `agent.service.ts` — función `isProductQuery()` detecta si la intención del mensaje es sobre productos. Solo entonces se incluye el catálogo en el contexto RAG.  
**Archivos:** `backend/src/modules/agent/agent.service.ts`  
**Regla:** El RAG debe ser intencional y selectivo. Más contexto ≠ mejor respuesta.

---

> Agrega nuevos fixes aquí cuando los resuelvas. Fecha + descripción corta.

---

### [2026-06-05] — Panel "Mi cuenta" mobile quedaba flotando sobre el fondo
**Síntoma:** En mobile, estando en "Mi cuenta", abrir el menú lateral y tocar Inicio actualizaba el fondo pero el panel de cuenta seguía en primer plano.
**Causa:** Los botones del menú mobile cambiaban los flags `show*` pero no reseteaban `mobileActiveTab`, que seguía en `'cuenta'`; el panel está gated por `mobileActiveTab === 'cuenta'`.
**Fix:** Agregar `setMobileActiveTab('tienda')` a los botones de navegación del menú (Inicio, Catálogo, Sedes, Nuevos Lanzamientos, Servicios, Drop, Ofertas).
**Archivos:** `frontend/components/landing-page.tsx`
**Regla:** En la vista mobile, cualquier navegación debe resetear `mobileActiveTab`, no solo los flags `show*`.

---

### [2026-06-05] — Módulo gym no aparecía en el modal de activación
**Síntoma:** El gimnasio no salía en "Módulos — [tenant]" del superadmin ni se podía activar por comercio.
**Causa:** Se registró en `sidebar.tsx` y `page.tsx` pero NO en `lib/modules.ts` (`ALL_MODULES`), que es la fuente del modal de activación y del gating del sidebar (`activeModules.includes(item.id)`).
**Fix:** Agregar `{ id:'gym', name:'Gimnasio', group:'ops' }` a `ALL_MODULES` + presets gimnasio/fitness/crossfit en `BUSINESS_PRESETS`.
**Archivos:** `frontend/lib/modules.ts`
**Regla:** Un módulo nuevo del comerciante requiere 3 lugares: `lib/modules.ts` (registro/toggle), `sidebar.tsx` (menú) y `app/page.tsx` (render por `case`).

---

### [2026-06-05] — Plan de comidas 500: columna user_id ambigua
**Síntoma:** `GET /api/rutina/plan-comidas` 500 → `ER_NON_UNIQ_ERROR: Column 'user_id' in where clause is ambiguous`.
**Causa:** `listPlanComidas` hace `JOIN rutina_recetas r`; ambas tablas tienen `user_id`, y el WHERE usaba `user_id`/`plan_date` sin calificar.
**Fix:** Calificar con alias: `pc.user_id`, `pc.plan_date` en el WHERE dinámico.
**Archivos:** `backend/src/modules/rutina/rutina.service.ts`
**Regla:** En cualquier SELECT con JOIN, SIEMPRE calificar columnas (`alias.columna`) en WHERE/ORDER, no solo en el SELECT.

---

### [2026-06-05] — Categorías: colisión de PRIMARY KEY entre tenants
**Síntoma:** `POST /api/categories` 500 → `ER_DUP_ENTRY 'opa' for key 'categories.PRIMARY'`. Dos comerciantes distintos creando una categoría con el mismo nombre chocaban.
**Causa:** `categories.id` (VARCHAR(50)) se genera como slug del nombre y era PRIMARY KEY global. Distintos tenants con el mismo nombre → mismo id → choque, ignorando el aislamiento multi-tenant.
**Fix:** PK compuesta `(tenant_id, id)`. Seguro: sin FKs hacia `categories(id)`, ids únicos globalmente al migrar, y el service ya validaba unicidad por `id + tenant_id`. Solo migración de BD, sin rebuild.
**Archivos:** `backend/migrations/fix_categories_composite_pk.sql` (nuevo), `backend/inventarioEsteban_v3_multitenant.sql` (esquema base)
**Regla:** En multi-tenant, cualquier id derivado de datos del usuario (slug, nombre) debe ser único POR tenant. La PK debe incluir `tenant_id`, no conf