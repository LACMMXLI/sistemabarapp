export const AUDIT_ACTION_LABELS: Record<string, string> = {
  AUTH_LOGIN: "Inicio de sesión",
  USER_CREATE: "Usuario creado",
  USER_UPDATE: "Usuario actualizado",
  CATEGORY_CREATE: "Categoría creada",
  CATEGORY_UPDATE: "Categoría actualizada",
  PRODUCT_CREATE: "Producto creado",
  PRODUCT_UPDATE: "Producto actualizado",
  TABLE_CREATE: "Mesa creada",
  TABLE_UPDATE: "Mesa actualizada",
  ORDER_OPEN_TABLE: "Mesa abierta",
  ORDER_OPEN_QUICK_SALE: "Venta rápida iniciada",
  ORDER_ITEM_CANCEL: "Producto retirado de la cuenta",
  ORDER_PAY: "Cuenta cobrada",
  ORDER_CANCEL: "Cuenta cancelada",
  BILLIARD_RATE_CREATE: "Tarifa de billar creada",
  BILLIARD_RATE_UPDATE: "Tarifa de billar actualizada",
  BILLIARD_START: "Sesión de billar iniciada",
  BILLIARD_PAUSE: "Sesión de billar pausada",
  BILLIARD_RESUME: "Sesión de billar reanudada",
  BILLIARD_FINISH: "Sesión de billar finalizada",
  BILLIARD_CANCEL: "Sesión de billar cancelada",
  PROMOTION_CREATE: "Promoción creada",
  PROMOTION_UPDATE: "Promoción actualizada",
  INVENTORY_MANUAL_MOVEMENT: "Movimiento manual de inventario",
  CASH_REGISTER_CREATE: "Caja creada",
  CASH_SHIFT_OPEN: "Turno de caja abierto",
  CASH_MOVEMENT_CREATE: "Movimiento de efectivo registrado",
  CASH_SHIFT_CLOSE: "Turno de caja cerrado",
  SETTINGS_UPDATE: "Configuración actualizada",
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  User: "Usuario",
  Category: "Categoría",
  Product: "Producto",
  DiningTable: "Mesa",
  Order: "Orden",
  OrderItem: "Producto de orden",
  BilliardRate: "Tarifa de billar",
  BilliardSession: "Sesión de billar",
  Promotion: "Promoción",
  InventoryMovement: "Movimiento de inventario",
  CashRegister: "Caja",
  CashShift: "Turno de caja",
  CashMovement: "Movimiento de efectivo",
  AppSettings: "Configuración",
};

export function describeAuditLog(action: string, entityType: string): string {
  const actionLabel = AUDIT_ACTION_LABELS[action] ?? action;
  const entityLabel = AUDIT_ENTITY_LABELS[entityType] ?? entityType;
  return `${actionLabel} (${entityLabel})`;
}
