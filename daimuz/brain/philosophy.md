# 📐 Filosofía de Construcción

> Por qué Lopbuk está construido como está.

## Principios de Diseño

### 1. Módulos, no monolito
Cada módulo es independiente. Puedes trabajar en `inventory` sin tocar `sales`. Esto permite escalar el equipo y el producto sin fricciones.

### 2. El Service es el cerebro
```
routes  → define el contrato (URL + método)
controller → recibe y responde
service  → AQUÍ vive TODA la lógica
```
Un controller que tiene lógica de negocio es un error de arquitectura.

### 3. La UI no decide nada
Los componentes React solo muestran y capturan. La lógica de estado está en Zustand. La lógica de negocio está en el backend.

### 4. Cada dato tiene dueño
`tenant_id` en cada tabla. Nunca un tenant puede ver datos de otro. Esta regla no tiene excepciones (excepto superadmin).

### 5. Fallar rápido y claro
```typescript
throw new AppError('Stock insuficiente', 400)
```
Los errores son explícitos, con mensaje en español y código HTTP correcto.

### 6. Soft delete siempre
Los datos de negocio nunca se borran físicamente. `is_active = 0` para histórico, auditoría y recuperación.

## Por qué estas tecnologías

| Tecnología | Por qué |
|---|---|
| Next.js App Router | SSR/SSG para páginas públicas (menú, tienda) + SPA para la app |
| Zustand | Simple, sin boilerplate, performance perfecta para este tamaño |
| Express | Control total, sin magic, fácil de depurar |
| MySQL | Transacciones ACID para datos financieros, joins potentes |
| Socket.io | Tiempo real sin reinventar la rueda |
| JWT + cookie | Sin estado en servidor, seguro contra XSS |

## Lo que evitamos conscientemente

- ❌ ORM pesados (TypeORM, Prisma) → queries SQL directas, más control
- ❌ Redux → demasiado boilerplate para este tamaño
- ❌ Microservicios → costo operativo innecesario en esta etapa
- ❌ GraphQL → REST es suficiente y más predecible aquí

---

← [[identity]] | [[DAIMUZ]] | → [[coding-standards]]
