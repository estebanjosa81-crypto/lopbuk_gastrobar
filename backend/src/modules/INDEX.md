# Índice de Módulos — Backend

> 35 módulos. Cada módulo sigue el patrón: `routes → controller → service`  
> Para descripciones completas, ver `daimuz/indexes/modules-index.md`.

## Patrón de Módulo
```
[modulo]/
├── [modulo].routes.ts      → Endpoints Express + apply middlewares
├── [modulo].controller.ts  → Parse request + call service + format response
├── [modulo].service.ts     → TODA la lógica de negocio + queries SQL
└── index.ts                → Re-export
```

**Regla:** La lógica va en el Service. Controllers son solo puentes.

---

## 🔐 Auth y Usuarios
`auth` · `users` · `tenants`

## 📦 Inventario
`products` · `inventory` · `categories` · `merma` · `recipes` · `scanner`

## 💰 Ventas
`sales` · `cash-sessions` · `orders` · `purchases` · `coupons`

## 👥 Clientes
`customers` · `credits` · `reviews`

## 🍽️ Gastrobar
`restbar` · `gastrobar-ops`

## 👔 RRHH / Nómina
`vendedores` · `novedades` · `cargos`

## 💳 Finanzas
`finances` · `stripe` · `subscriptions`

## 🚚 Delivery
`delivery` · `fleet`

## 🌐 Digital
`storefront` · `portfolio` · `services` · `client` · `media-library`

## 📊 Analytics
`dashboard` · `sync`

## 🤖 IA y Comms
`agent` · `chatbot` · `whatsapp`

## 🏗️ Verticales
`realestate` · `workorders` · `sedes` · `dev-requests` · `printers`
