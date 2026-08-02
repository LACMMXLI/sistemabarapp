export const APP_TIMEZONE = "America/Tijuana";
export const APP_CURRENCY = "MXN";

export const ROLES = ["ADMIN", "CAJERO", "MESERO"] as const;
export type RoleName = (typeof ROLES)[number];

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

export const TABLE_POLL_INTERVAL_MS = 4000;
export const ORDER_POLL_INTERVAL_MS = 4000;

export const LOW_STOCK_DEFAULT_THRESHOLD = 5;

/**
 * Matriz central de permisos. Cada capability se valida en backend
 * en cada endpoint; el frontend solo la usa para ocultar UI.
 */
export const PERMISSIONS = {
  QUICK_SALE: ["ADMIN", "CAJERO", "MESERO"],
  TABLES_VIEW: ["ADMIN", "CAJERO", "MESERO"],
  TABLES_MANAGE: ["ADMIN"],
  ORDERS_OPERATE: ["ADMIN", "CAJERO", "MESERO"],
  ORDERS_PAY: ["ADMIN", "CAJERO", "MESERO"],
  ORDERS_CANCEL: ["ADMIN", "CAJERO", "MESERO"],
  BILLIARD_OPERATE: ["ADMIN", "CAJERO", "MESERO"],
  BILLIARD_RATES_MANAGE: ["ADMIN"],
  PRODUCTS_MANAGE: ["ADMIN"],
  CATEGORIES_MANAGE: ["ADMIN"],
  INVENTORY_VIEW_FULL: ["ADMIN"],
  INVENTORY_ADJUST: ["ADMIN"],
  PROMOTIONS_MANAGE: ["ADMIN"],
  CASH_OPEN: ["ADMIN"],
  CASH_CLOSE: ["ADMIN"],
  CASH_MOVEMENT: ["ADMIN"],
  CASH_VIEW_SHIFTS: ["ADMIN"],
  REPORTS_VIEW: ["ADMIN"],
  AUDIT_VIEW: ["ADMIN"],
  USERS_MANAGE: ["ADMIN"],
  SETTINGS_MANAGE: ["ADMIN"],
} as const satisfies Record<string, readonly RoleName[]>;

export type PermissionKey = keyof typeof PERMISSIONS;

export function roleHasPermission(role: RoleName, permission: PermissionKey): boolean {
  return (PERMISSIONS[permission] as readonly RoleName[]).includes(role);
}
