/**
 * Permisos granulares del sistema.
 * Un cargo de empleado puede tener cualquier combinación de estos permisos.
 * Los roles 'comerciante' y 'superadmin' tienen acceso total sin importar permisos.
 */
export const PERMISSIONS = {
  VENTAS: 'ventas',               // Crear y consultar ventas
  COMPRAS: 'compras',             // Crear y consultar compras / proveedores
  INVENTARIO: 'inventario',       // Ver y ajustar inventario / movimientos
  CLIENTES: 'clientes',           // Gestionar clientes y créditos
  CREDITOS: 'creditos',           // Gestionar fiados y créditos
  REPORTES: 'reportes',           // Ver dashboard y reportes
  CAJA: 'caja',                   // Abrir/cerrar sesiones de caja
  EMPLEADOS: 'empleados',         // Ver lista de empleados
  CONFIGURACION: 'configuracion', // Configuración de tienda / categorías
  PEDIDOS: 'pedidos',             // Ver y gestionar pedidos del storefront
  CATEGORIAS: 'categorias',       // Gestionar categorías de productos
  RECETAS: 'recetas',             // Gestionar recetas / productos compuestos
  SERVICIOS: 'servicios',         // Gestionar servicios
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);
