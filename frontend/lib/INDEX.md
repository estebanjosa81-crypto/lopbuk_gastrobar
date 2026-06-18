# Índice de Lib — Frontend

> Lógica central: estado, API, tipos y configuración.

## `api.ts` — Servicio HTTP
Clase `ApiService` centraliza todas las llamadas al backend Express.  
**Métodos:** `get()`, `post()`, `put()`, `patch()`, `delete()`  
**Token:** en memoria + httpOnly cookie automática  
**URL base:** `NEXT_PUBLIC_API_URL` || `http://localhost:3001/api`

## `store.ts` — Estado Global (Zustand)
Estado principal de la app con persistencia.  
**Contiene:** products, cart, sales, customers, categories, sedes, stockMovements, storeInfo, UI state  
**Patron:** acciones asíncronas que llaman api.ts y actualizan el estado

## `auth-store.ts` — Estado de Autenticación
Estado del usuario autenticado.  
**Contiene:** user, token, isAuthenticated  
**Métodos:** login(), loginWithGoogle(), logout(), updateUser()

## `types.ts` — Tipos TypeScript
Interfaces y tipos principales del sistema.  
**Principales:** Product, Sale, CartItem, Customer, User, StoreInfo, Order, StockMovement, CategoryItem, Sede

## `modules.ts` — Configuración de Módulos
Define los módulos activables por tenant (nombre, ícono, ruta, rol requerido).  
Usado por el sidebar para mostrar solo los módulos activos.

## `socket.ts` — WebSocket Client
Instancia del cliente Socket.io para eventos en tiempo real.  
Eventos: nuevos pedidos, actualizaciones de estado, alertas.

## `product-config.ts` — Config de Productos
Configuración de campos de productos según el tipo de negocio (presets por industria).

## `utils.ts` — Utilidades Generales
Helpers: formateo de moneda, fechas, construcción de URLs del storefront.

## `product-config.ts` — Config de Productos por Industria
Presets de campos visibles según tipo de negocio (ropa, farmacia, ferretería…). Usado en el formulario de creación de productos.
