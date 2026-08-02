import type { OrderDto } from "@barapp/contracts";
import { apiFetch, newIdempotencyKey } from "./api";

export function createOrRecoverQuickSale(): Promise<OrderDto> {
  return apiFetch<OrderDto>("/quick-sales", {
    method: "POST",
    body: JSON.stringify({ idempotencyKey: newIdempotencyKey("quick-sale") }),
  });
}
