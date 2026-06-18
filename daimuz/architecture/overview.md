# 🗺️ Arquitectura — Vista General

## Diagrama del Sistema

```mermaid
graph TD
    subgraph Cliente
        B[Browser/Mobile]
    end

    subgraph Frontend [":3000 — Next.js 16"]
        LP[Landing / Storefront público]
        APP[App SPA — Panel de gestión]
        ZS[Zustand State]
        API_SVC[api.ts — HTTP Service]
        SOCK_CLI[socket.ts — WS Client]
    end

    subgraph Backend [":3001 — Express + TypeScript"]
        API[REST API /api/*]
        MW[Auth Middleware JWT]
        MODS[40+ Módulos]
        SOCK_SRV[Socket.io Server]
    end

    subgraph DB [Base de Datos]
        MySQL[(MySQL — Multitenant)]
    end

    subgraph External [Servicios Externos]
        Google[Google OAuth2]
        Stripe[Stripe]
        WA[WhatsApp Business]
        Cloudinary[Cloudinary CDN]
    end

    B --> Frontend
    APP --> ZS --> API_SVC
    API_SVC -->|HTTP REST| API
    B <-->|WebSocket| SOCK_SRV
    API --> MW --> MODS --> MySQL
    MODS --> Google & Stripe & WA & Cloudinary
```

## Regla de Flujo

```
UI Component
  → Zustand Action
    → api.ts (HTTP)
      → Express Route
        → Auth Middleware
          → Controller
            → Service (lógica + SQL)
              → MySQL
            ← Service
          ← Controller (JSON)
        ← Express
      ← api.ts
    ← Zustand (actualiza estado)
  ← React (re-render)
```

## Tiempo Real (Socket.io)

```
Evento en servidor (nuevo pedido, cambio de estado)
  → socket.emit('event', data)
    → todos los clientes del mismo tenant
      → frontend actualiza UI sin refresh
```

## Puertos

| Servicio | Puerto | Notas |
|---|---|---|
| Frontend Next.js | 3000 | Dev server |
| Backend Express | 3001 | `NEXT_PUBLIC_API_URL` |
| MySQL | 3306 | Local / RDS en prod |

## Ver más

- [[architecture/frontend]] — estructura detallada del frontend
- [[architecture/backend]] — estructura detallada del backend
- [[architecture/database]] — schema y convenciones DB
- [[architecture/deployment]] — entornos y deploy

---

← [[DAIMUZ]] | → [[architecture/frontend]]
