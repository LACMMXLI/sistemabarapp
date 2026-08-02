import { describe, expect, it } from "vitest";
import { computeBilliardCharge, computeCashChange, computeExpectedCash, hourlyToPerMinute, roundUpMinutes } from "./billing";

describe("roundUpMinutes", () => {
  it("redondea hacia arriba al siguiente minuto iniciado", () => {
    expect(roundUpMinutes(1)).toBe(1);
    expect(roundUpMinutes(60)).toBe(1);
    expect(roundUpMinutes(61)).toBe(2);
    expect(roundUpMinutes(119)).toBe(2);
    expect(roundUpMinutes(120)).toBe(2);
  });
});

describe("hourlyToPerMinute", () => {
  it("convierte tarifa por hora a tarifa por minuto redondeando hacia arriba", () => {
    expect(hourlyToPerMinute(12000)).toBe(200);
    expect(hourlyToPerMinute(10000)).toBe(167); // 166.66... -> 167
  });
});

describe("computeBilliardCharge", () => {
  it("cobra por minutos facilitados sin cargo mínimo", () => {
    expect(computeBilliardCharge(125, 200, 0)).toBe(600); // 3 minutos * 200
  });

  it("aplica el cargo mínimo si el cálculo por tiempo es menor", () => {
    expect(computeBilliardCharge(30, 200, 500)).toBe(500); // 1 min * 200 = 200 < 500
  });

  it("con 0 segundos activos igual redondea a 1 minuto facturable", () => {
    expect(computeBilliardCharge(0, 200, 0)).toBe(0);
  });
});

describe("computeCashChange", () => {
  it("calcula el cambio correctamente", () => {
    expect(computeCashChange(10000, 9000)).toBe(1000);
  });

  it("nunca es negativo aunque el recibido sea menor (caso ya validado antes de llamar)", () => {
    expect(computeCashChange(500, 1000)).toBe(0);
  });
});

describe("computeExpectedCash", () => {
  it("aplica la fórmula del corte de caja", () => {
    const result = computeExpectedCash({
      openingFloatCents: 50000,
      cashSalesCents: 20000,
      cashInCents: 1000,
      cashOutCents: 500,
      refundsCashCents: 300,
    });
    expect(result).toBe(50000 + 20000 + 1000 - 500 - 300);
  });
});
