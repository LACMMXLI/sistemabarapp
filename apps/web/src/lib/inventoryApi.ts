import type { CreateManualMovementInput, InventoryItemDto, InventoryMovementDto } from "@barapp/contracts";
import { apiFetch } from "./api";

export function fetchInventory(): Promise<InventoryItemDto[]> {
  return apiFetch<InventoryItemDto[]>("/inventory");
}

export function fetchInventoryMovements(): Promise<InventoryMovementDto[]> {
  return apiFetch<InventoryMovementDto[]>("/inventory/movements");
}

export function createManualMovement(input: CreateManualMovementInput) {
  return apiFetch("/inventory/movements", { method: "POST", body: JSON.stringify(input) });
}
