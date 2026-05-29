# ⚙️ Arquitectura Backend

**Stack:** Node.js · Express 4.21 · TypeScript 5.5 · MySQL2 3.11 · Socket.io 4.7

## Estructura

```
backend/src/
├── config/
│   ├── env.ts          → config object con todas las vars de entorno
│   └── database.ts     → pool de conexiones MySQL2
│
├── common/
│   ├── middleware/
│   │   ├── auth.ts     → verifyToken, requireRole
│   │   └── error.ts    → AppError handler global
│   └── types/
│       └── index.ts    → User, JWTPayload, UserRole
│
├── utils/
│   └── crypto.ts       → encryptNullable / decryptNullable
│
└── modules/            → 40+ módulos
    └── index.ts        → registro de todas las rutas
```

## Patrón de Módulo

```
modules/[nombre]/
├── [nombre].routes.ts      ← define URL + aplica middlewares
├── [nombre].controller.ts  ← parsea req → llama service → formatea res
├── [nombre].service.ts     ← TODA la lógica + SQL queries
└── index.ts                ← re-export
```

## 40+ Módulos agrupados

**Auth y usuarios:** [[modules/auth/auth]] · [[modules/tenants/tenants]]  
**Ventas:** [[modules/pos/pos]] · [[modules/sales/sales]] · [[modules/orders/orders]]  
**Inventario:** [[modules/inventory/inventory]]  
**Clientes:** [[modules/customers/customers]]  
**Finanzas:** [[modules/finances/finances]]  
**Gastrobar:** [[modules/gastrobar-ops/gastrobar-ops]]  
**Delivery:** [[modules/delivery/delivery]]  
**Digital:** [[modules/storefront/storefront]]

## Middleware Stack

```typescript
// Orden de ejecución por request:
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRoutes)           // sin auth
app.use('/api/*', verifyToken)             // valida JWT
app.use('/api/admin/*', requireRole('admin')) // solo admin
```

## AppError — Manejo de Errores

```typescript
// En cualquier service:
throw new AppError('Mensaje en español', 400)

// El middleware captura y responde:
{ success: false, error: 'Mensaje en español' }
```

## Formato de Respuesta Estándar

```typescript
// Éxito
res.json({ success: true, data: result })
res.status(201).json({ success: true, data: created, message: 'Creado' })

// Con paginación
res.json({ success: true, data: rows, pagination: { page, limit, total } })

// Error (automático vía AppError)
{ success: false, error: 'Mensaje' }
```

---

← [[architecture/frontend]] | [[DAIMUZ]] | → [[architecture/database]]
