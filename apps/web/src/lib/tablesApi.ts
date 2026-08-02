import type { DiningTable } from "@barapp/contracts";
import { apiFetch } from "./api";

export function fetchTables(): Promise<DiningTable[]> {
  return apiFetch<DiningTable[]>("/tables");
}

export function openTable(tableId: string): Promise<{ orderId: string }> {
  return apiFetch<{ orderId: string }>(`/tables/${tableId}/open`, { method: "POST" });
}
