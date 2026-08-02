import { describe, expect, it } from "vitest";
import { roleHasPermission } from "./index";

describe("roleHasPermission", () => {
  it("ADMIN puede administrar usuarios; CAJERO y MESERO no", () => {
    expect(roleHasPermission("ADMIN", "USERS_MANAGE")).toBe(true);
    expect(roleHasPermission("CAJERO", "USERS_MANAGE")).toBe(false);
    expect(roleHasPermission("MESERO", "USERS_MANAGE")).toBe(false);
  });

  it("CAJERO y MESERO pueden operar órdenes, pero no ver reportes", () => {
    expect(roleHasPermission("CAJERO", "ORDERS_OPERATE")).toBe(true);
    expect(roleHasPermission("MESERO", "ORDERS_OPERATE")).toBe(true);
    expect(roleHasPermission("CAJERO", "REPORTS_VIEW")).toBe(false);
    expect(roleHasPermission("MESERO", "REPORTS_VIEW")).toBe(false);
  });

  it("solo ADMIN puede abrir y cerrar caja", () => {
    expect(roleHasPermission("ADMIN", "CASH_OPEN")).toBe(true);
    expect(roleHasPermission("ADMIN", "CASH_CLOSE")).toBe(true);
    expect(roleHasPermission("CAJERO", "CASH_OPEN")).toBe(false);
    expect(roleHasPermission("CAJERO", "CASH_CLOSE")).toBe(false);
  });
});
