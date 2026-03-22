# StockPro Backend API

Backend modular para el sistema de inventario StockPro.

## Requisitos

- Node.js 18+
- MySQL 8.0+ o MariaDB 10.5+

## Instalacion

1. Instalar dependencias:
```bash
cd backend
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

3. Editar `.env` con tus credenciales de MySQL:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=stockpro_db
JWT_SECRET=tu_secreto_jwt_seguro
```

4. Ejecutar el script SQL en tu gestor de base de datos:
   - Abre MySQL Workbench, DBeaver, phpMyAdmin o tu gestor preferido
   - Ejecuta el archivo `inventariodaniel.sql`

5. Iniciar el servidor:
```bash
npm run dev
```

## Scripts

- `npm run dev` - Inicia el servidor en modo desarrollo
- `npm run build` - Compila TypeScript a JavaScript
- `npm start` - Inicia el servidor en produccion

## Endpoints API

### Autenticacion
- `POST /api/auth/login` - Iniciar sesion
- `POST /api/auth/register` - Registrar usuario
- `GET /api/auth/profile` - Obtener perfil
- `PUT /api/auth/profile` - Actualizar perfil
- `PUT /api/auth/change-password` - Cambiar contrasena

### Usuarios (admin)
- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Obtener usuario
- `POST /api/users` - Crear usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

### Productos
- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Obtener producto
- `GET /api/products/sku/:sku` - Buscar por SKU
- `GET /api/products/low-stock` - Productos con stock bajo
- `GET /api/products/out-of-stock` - Productos agotados
- `POST /api/products` - Crear producto
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto

### Ventas
- `GET /api/sales` - Listar ventas
- `GET /api/sales/:id` - Obtener venta
- `GET /api/sales/invoice/:invoiceNumber` - Buscar por factura
- `GET /api/sales/recent` - Ventas recientes
- `POST /api/sales` - Crear venta
- `PUT /api/sales/:id/cancel` - Anular venta (admin)

### Inventario
- `GET /api/inventory/movements` - Listar movimientos
- `GET /api/inventory/movements/product/:productId` - Movimientos por producto
- `POST /api/inventory/adjust` - Ajustar stock (admin)
- `POST /api/inventory/bulk-adjust` - Ajuste masivo (admin)

### Dashboard
- `GET /api/dashboard/metrics` - Metricas generales
- `GET /api/dashboard/sales-trend` - Tendencia de ventas
- `GET /api/dashboard/store-info` - Info de la tienda
- `PUT /api/dashboard/store-info` - Actualizar info (admin)

## Usuario de prueba

- Email: `admin@stockpro.com`
- Password: `admin123`

## Estructura del proyecto

```
backend/
├── src/
│   ├── config/           # Configuracion (DB, env)
│   ├── common/           # Tipos, middleware compartido
│   ├── modules/          # Modulos de la aplicacion
│   │   ├── auth/         # Autenticacion
│   │   ├── users/        # Gestion de usuarios
│   │   ├── products/     # Gestion de productos
│   │   ├── sales/        # Gestion de ventas
│   │   ├── inventory/    # Movimientos de stock
│   │   └── dashboard/    # Metricas y reportes
│   ├── utils/            # Utilidades
│   └── index.ts          # Punto de entrada
├── inventariodaniel.sql  # Script de base de datos
├── package.json
└── tsconfig.json
```
