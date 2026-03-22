// Formateador de moneda COP
export const formatCOP = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Generar ID unico
export const generateId = (): string => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
};

// Calcular estado de stock
export const getStockStatus = (stock: number, reorderPoint: number): 'suficiente' | 'bajo' | 'agotado' => {
  if (stock === 0) return 'agotado';
  if (stock <= reorderPoint) return 'bajo';
  return 'suficiente';
};

// IVA Colombia
export const TAX_RATE = 0.19;

// Calcular totales
export const calculateTotals = (
  items: Array<{ unitPrice: number; quantity: number; discount: number }>
): { subtotal: number; tax: number; total: number } => {
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.unitPrice * item.quantity;
    const discountAmount = itemTotal * (item.discount / 100);
    return sum + (itemTotal - discountAmount);
  }, 0);

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return { subtotal, tax, total };
};
