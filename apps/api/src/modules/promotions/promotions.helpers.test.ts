import { describe, expect, it } from "vitest";
import { calcAppliedPrice } from "./promotions.helpers";

describe("calcAppliedPrice", () => {
  it("precio fijo nunca excede el precio base", () => {
    expect(calcAppliedPrice("FIXED_PRICE", 3000, 4500)).toBe(3000);
    expect(calcAppliedPrice("FIXED_PRICE", 6000, 4500)).toBe(4500);
  });

  it("porcentaje calcula el descuento redondeado", () => {
    expect(calcAppliedPrice("PERCENTAGE", 10, 4500)).toBe(4050);
    expect(calcAppliedPrice("PERCENTAGE", 50, 4501)).toBe(2250); // 4501 - round(2250.5) = 4501 - 2251 = 2250
  });

  it("nunca resulta en un precio negativo", () => {
    expect(calcAppliedPrice("PERCENTAGE", 150, 1000)).toBe(0);
  });
});
