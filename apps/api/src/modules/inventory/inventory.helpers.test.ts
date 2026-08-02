import { describe, expect, it } from "vitest";
import { computeStockStatus } from "./inventory.helpers";

describe("computeStockStatus", () => {
  it("UNTRACKED si el producto no controla inventario", () => {
    expect(computeStockStatus(false, null, 5)).toBe("UNTRACKED");
  });

  it("OUT_OF_STOCK si la existencia es 0 o negativa", () => {
    expect(computeStockStatus(true, 0, 5)).toBe("OUT_OF_STOCK");
    expect(computeStockStatus(true, -1, 5)).toBe("OUT_OF_STOCK");
  });

  it("LOW_STOCK cuando la existencia está en el umbral o por debajo", () => {
    expect(computeStockStatus(true, 5, 5)).toBe("LOW_STOCK");
    expect(computeStockStatus(true, 1, 5)).toBe("LOW_STOCK");
  });

  it("AVAILABLE por encima del umbral", () => {
    expect(computeStockStatus(true, 6, 5)).toBe("AVAILABLE");
  });
});
