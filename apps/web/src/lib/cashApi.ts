import type { CashRegisterDto, CashShiftSummaryDto, CreateCashMovementInput } from "@barapp/contracts";
import { apiFetch, newIdempotencyKey } from "./api";

export const fetchRegisters = (): Promise<CashRegisterDto[]> => apiFetch<CashRegisterDto[]>("/cash/registers");
export const createRegister = (name: string) => apiFetch<CashRegisterDto>("/cash/registers", { method: "POST", body: JSON.stringify({ name }) });

export const openShift = (registerId: string, openingFloatCents: number) =>
  apiFetch<CashShiftSummaryDto>("/cash/shifts", {
    method: "POST",
    body: JSON.stringify({ registerId, openingFloatCents, idempotencyKey: newIdempotencyKey("open-shift") }),
  });

export const fetchShift = (shiftId: string): Promise<CashShiftSummaryDto> => apiFetch<CashShiftSummaryDto>(`/cash/shifts/${shiftId}`);

export const createCashMovement = (shiftId: string, input: CreateCashMovementInput) =>
  apiFetch(`/cash/shifts/${shiftId}/movements`, { method: "POST", body: JSON.stringify(input) });

export const closeShift = (shiftId: string, countedCashCents: number) =>
  apiFetch<CashShiftSummaryDto>(`/cash/shifts/${shiftId}/close`, {
    method: "POST",
    body: JSON.stringify({ countedCashCents, idempotencyKey: newIdempotencyKey("close-shift") }),
  });
