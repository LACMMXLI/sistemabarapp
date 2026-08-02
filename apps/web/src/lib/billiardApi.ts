import type { BilliardRateDto, BilliardSessionDto, CreateBilliardRateInput, UpdateBilliardRateInput } from "@barapp/contracts";
import { apiFetch, newIdempotencyKey } from "./api";

export function fetchBilliardRates(): Promise<BilliardRateDto[]> {
  return apiFetch<BilliardRateDto[]>("/billiard/rates");
}

export function createBilliardRate(input: CreateBilliardRateInput): Promise<BilliardRateDto> {
  return apiFetch<BilliardRateDto>("/billiard/rates", { method: "POST", body: JSON.stringify(input) });
}

export function updateBilliardRate(id: string, input: UpdateBilliardRateInput): Promise<BilliardRateDto> {
  return apiFetch<BilliardRateDto>(`/billiard/rates/${id}`, { method: "POST", body: JSON.stringify(input) });
}

export function fetchActiveSession(tableId: string): Promise<BilliardSessionDto | null> {
  return apiFetch<BilliardSessionDto | null>(`/billiard/sessions/active?tableId=${tableId}`);
}

export function startSession(tableId: string, rateId: string): Promise<BilliardSessionDto> {
  return apiFetch<BilliardSessionDto>(`/billiard/sessions/tables/${tableId}/start`, {
    method: "POST",
    body: JSON.stringify({ rateId, idempotencyKey: newIdempotencyKey("billiard-start") }),
  });
}

export function pauseSession(sessionId: string): Promise<BilliardSessionDto> {
  return apiFetch<BilliardSessionDto>(`/billiard/sessions/${sessionId}/pause`, { method: "POST" });
}

export function resumeSession(sessionId: string): Promise<BilliardSessionDto> {
  return apiFetch<BilliardSessionDto>(`/billiard/sessions/${sessionId}/resume`, { method: "POST" });
}

export function finishSession(sessionId: string): Promise<BilliardSessionDto> {
  return apiFetch<BilliardSessionDto>(`/billiard/sessions/${sessionId}/finish`, {
    method: "POST",
    body: JSON.stringify({ idempotencyKey: newIdempotencyKey("billiard-finish") }),
  });
}
